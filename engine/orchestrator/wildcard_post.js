'use server';

import path from 'node:path';
import { mkdir, writeFile, readFile, readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { getDspMatrix } from './engine/dsp/matrixRouter.js';
console.log(getDspMatrix({ profile: 'punch', I: -12, TP: -1.0 }).filtergraph);


// ---------- CONFIG / ENV ----------
const EMB_URL  = process.env.EMB_URL  || 'http://localhost:8001';      // FastAPI embeddings
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; // for /api/refbank/topk

// ---------- SMALL HELPERS ----------
const FFMPEG  = process.env.FFMPEG_BIN  || ffmpegStatic;
const FFPROBE = process.env.FFPROBE_BIN || ffprobeStatic.path;

function sh(bin, args) {
  const cmd = bin === 'ffmpeg' ? FFMPEG : bin === 'ffprobe' ? FFPROBE : bin;
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('close', code => code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`)));
  });
}

async function getDspMatrix(profile = 'clean', I = -12, TP = -1.0) {
  try {
    const r = await fetch(`${BASE_URL}/api/dsp/matrix`, {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({ profile, I, TP })
    });
    const j = await r.json();
    return j?.filtergraph || null;
  } catch {
    return null;
  }
}

async function ensureDir(p){ await mkdir(p, { recursive: true }); }

function cosine(a = [], b = []) {
  let da=0, db=0, dot=0; const n = Math.min(a.length, b.length);
  for (let i=0;i<n;i++){ const x=a[i], y=b[i]; dot+=x*y; da+=x*x; db+=y*y; }
  if (!da || !db) return 0;
  return dot / (Math.sqrt(da) * Math.sqrt(db));
}

function intensityToCfg(intensity = 0) {
  const v = Number(intensity) || 0;
  if (v <= 33) return { topK: 2, candidatesMax: 3, margin: 0.18, refWeight: 0.40, level: 'Clean' };
  if (v <= 66) return { topK: 3, candidatesMax: 5, margin: 0.14, refWeight: 0.50, level: 'Bold'  };
  return           { topK: 4, candidatesMax: 7, margin: 0.10, refWeight: 0.60, level: 'Rebel' };
}

function scoreVec(vec, baseline, refVecs, refWeight) {
  const raw = cosine(vec, baseline);
  const ref = refVecs.length ? refVecs.reduce((s,r)=>s+cosine(vec,r),0)/refVecs.length : 0;
  return (1 - refWeight) * raw + refWeight * ref;
}

function pickWinner(baseline, candidates, refVecs, { margin, refWeight }) {
  const baseScore = scoreVec(baseline, baseline, refVecs, refWeight);
  let bestIdx = -1, bestScore = baseScore;
  for (let i=0;i<candidates.length;i++){
    const s = scoreVec(candidates[i], baseline, refVecs, refWeight);
    if (s > bestScore){ bestScore = s; bestIdx = i; }
  }
  const delta = bestScore - baseScore;
  const improved = bestIdx >= 0 && delta >= margin;
  return { improved, bestIdx, delta, baseScore, bestScore };
}

async function embedPathToOpenL3Vec(absPath) {
  const data = await readFile(absPath);
  const blob = new Blob([data], { type: 'audio/wav' });
  const fd = new FormData();
  fd.append('file', blob, path.basename(absPath));
  const r = await fetch(`${EMB_URL}/embed/audio`, { method: 'POST', body: fd });
  if (!r.ok) throw new Error(`embed audio failed: ${r.status}`);
  const j = await r.json();
  return j.embedding || [];
}

async function getTopRefs({ sectionVec, k = 4, moods = [] }) {
  try {
    const r = await fetch(`${BASE_URL}/api/refbank/topk`, {
      method: 'POST',
      headers: { 'content-type':'application/json' },
      body: JSON.stringify({ k, sectionVec, requiredTraits: moods })
    });
    const j = await r.json();
    return (j.refs || []).filter(Boolean);
  } catch {
    return [];
  }
}

async function loadGuideByRsgId(rsgId) {
  try {
    const [genre, mood] = String(rsgId || '').split(':');
    const guidePath = path.join(process.cwd(), 'refbank', 'guides', `${genre}_${mood}_v1.json`);
    const raw = await readFile(guidePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function mixSection(outPath, drumsPath, otherPaths = []) {
  const ins = [drumsPath, ...otherPaths].filter(Boolean);
  if (!ins.length) throw new Error('No inputs to section mix');
  await sh('ffmpeg', [
    '-y',
    ...ins.flatMap(f => ['-i', f]),
    '-filter_complex', `amix=inputs=${ins.length}:normalize=0`,
    '-c:a', 'pcm_s16le',
    outPath
  ]);
}

async function finalMixdown(inWav, finalWav, finalMp3, guide, profile = 'clean') {
  const I  = guide?.mix_targets?.lufs_i       ?? -12;
  const TP = guide?.mix_targets?.true_peak_db ?? -1.0;

  // Try to get a profile-specific filtergraph from the matrix router
  const fg = await getDspMatrix(profile, I, TP);
  const filtergraph = fg || `loudnorm=I=${I}:TP=${TP}:LRA=7,alimiter=limit=${Math.min(0.89, Math.pow(10, TP/20))}`;

  await sh('ffmpeg', ['-y','-i', inWav, '-filter_complex', filtergraph, '-c:a','pcm_s16le', finalWav]);
  await sh('ffmpeg', ['-y','-i', finalWav, '-c:a','libmp3lame','-q:a','2', finalMp3]);
}

// map Clean/Bold/Rebel → matrix profiles
const levelToProfile = { Clean: 'clean', Bold: 'gloss', Rebel: 'punch' };
// ...
await finalMixdown(finalPre, finalWav, finalMp3, guide, levelToProfile[lvl.level] || 'clean');


// ---------- MAIN ENTRY: post-runFlip wildcard pass ----------
/**
 * Rebuilds per-section mixes choosing better drums (MVP) via Wildcard shoot-out,
 * then concatenates and masters to final_wild.* — original files remain untouched.
 *
 * @param {Object} opts
 * @param {string} opts.sessionDir   runFlip's sessionDir
 * @param {number} opts.intensity    0..100 (maps Clean/Bold/Rebel)
 * @param {string[]} [opts.moods]    mood chips, e.g., ['reforge','joker-chip']
 * @param {boolean} [opts.wildcard]  toggle; if false and no 'joker-chip', does nothing
 * @returns wildcard report object with telemetry & file paths
 */
export async function wildcardPostProcess({ sessionDir, intensity = 50, moods = [], wildcard = true }) {
  const doWildcard = wildcard || (Array.isArray(moods) && moods.includes('joker-chip'));
  const lvl = intensityToCfg(intensity);

  // 1) Load previous report to get rsg_id (for final loudness targets) + sanity
  const prevReportPath = path.join(sessionDir, 'report.json');
  const prev = JSON.parse(await readFile(prevReportPath, 'utf8'));
  const guide = await loadGuideByRsgId(prev?.rsg_id);

  // 2) Find section folders (sec_*)
  const entries = await readdir(sessionDir, { withFileTypes: true });
  const secDirs = entries
    .filter(e => e.isDirectory() && /^sec_\d+$/.test(e.name))
    .map(e => ({ name: e.name, num: Number(e.name.split('_')[1]), dir: path.join(sessionDir, e.name) }))
    .sort((a,b) => a.num - b.num);

  // If Wildcard is off, just mirror existing sec_mix into wild and master
  if (!doWildcard) {
    const secWild = [];
    for (const s of secDirs) {
      const secMix = path.join(s.dir, 'sec_mix.wav');
      const wildOut = path.join(s.dir, 'sec_mix_wild.wav');
      // copy (stream copy)
      await sh('ffmpeg', ['-y','-i', secMix, '-c','copy', wildOut]);
      secWild.push(wildOut);
    }
    const concatList = path.join(sessionDir, 'concat_wild.txt');
    await writeFile(concatList, secWild.map(p => `file '${p.replace(/'/g,"'\\''")}'`).join('\n'));
    const finalPre = path.join(sessionDir, 'final_pre_wild.wav');
    await sh('ffmpeg', ['-y','-f','concat','-safe','0','-i', concatList, '-c','copy', finalPre]);

    const finalWav = path.join(sessionDir, 'final_wild.wav');
    const finalMp3 = path.join(sessionDir, 'final_wild.mp3');
    await finalMixdown(finalPre, finalWav, finalMp3, guide);

    const report = {
      ...prev,
      telemetry: { ...(prev.telemetry||{}), wildcard: { enabled:false, level:lvl.level }, dominance: 0, netLift: 0 },
      finalWildWav: finalWav,
      finalWildMp3: finalMp3
    };
    const outPath = path.join(sessionDir, 'wildcard_report.json');
    await writeFile(outPath, JSON.stringify(report, null, 2));
    return report;
  }

  // 3) For each section: pick drum winner & build sec_mix_wild.wav
  const decisions = [];
  const secWildPaths = [];

  for (const s of secDirs) {
    // discover files
    const files = (await readdir(s.dir)).filter(n => n.endsWith('.wav'));
    const baselineDrums = files.includes('drums.wav') ? path.join(s.dir, 'drums.wav') : null;
    const otherPaths = ['bass.wav','vox.wav','other.wav'].filter(n => files.includes(n)).map(n => path.join(s.dir, n));

    // candidates: any drums*.wav except baseline
    const candNames = files
      .filter(n => /^drums.*\.wav$/i.test(n) && n !== 'drums.wav' && n !== 'sec_mix.wav' && n !== 'sec_mix_wild.wav');
    const candidateFiles = candNames.slice(0, lvl.candidatesMax).map(n => path.join(s.dir, n));

    let chosenDrums = baselineDrums;
    let decision = { section: s.name, improved:false, bestIdx:-1, delta:0 };

    try {
      if (baselineDrums && candidateFiles.length) {
        const baselineVec = await embedPathToOpenL3Vec(baselineDrums);
        const refItems = await getTopRefs({ sectionVec: baselineVec, k: lvl.topK, moods });
        const refVecs  = refItems.map(r => r.openl3_vec).filter(Array.isArray);

        const candVecs = [];
        for (const f of candidateFiles) {
          try { candVecs.push(await embedPathToOpenL3Vec(f)); } catch {}
        }

        if (candVecs.length) {
          const { improved, bestIdx, delta } = pickWinner(baselineVec, candVecs, refVecs, { margin:lvl.margin, refWeight:lvl.refWeight });
          decision = { section: s.name, improved, bestIdx, delta, used: improved ? path.basename(candidateFiles[bestIdx]) : 'drums.wav' };
          if (improved) chosenDrums = candidateFiles[bestIdx];
        }
      }
    } catch (e) {
      // silent: keep baseline
    }

    decisions.push(decision);

    // Build section wild mix
    const secWild = path.join(s.dir, 'sec_mix_wild.wav');
    await mixSection(secWild, chosenDrums || null, otherPaths);
    secWildPaths.push(secWild);
  }

  // 4) Concat + master → final_wild.*
  const concatList = path.join(sessionDir, 'concat_wild.txt');
  await writeFile(concatList, secWildPaths.map(p => `file '${p.replace(/'/g,"'\\''")}'`).join('\n'));
  const finalPre = path.join(sessionDir, 'final_pre_wild.wav');
  await sh('ffmpeg', ['-y','-f','concat','-safe','0','-i', concatList, '-c','copy', finalPre]);

  const finalWav = path.join(sessionDir, 'final_wild.wav');
  const finalMp3 = path.join(sessionDir, 'final_wild.mp3');
  await finalMixdown(finalPre, finalWav, finalMp3, guide);

  // 5) Telemetry
  const wins = decisions.filter(d => d.improved).length;
  const total = decisions.length || 1;
  const dominance = wins / total;
  const netLift = wins ? decisions.filter(d=>d.improved).reduce((s,d)=>s+d.delta,0) / wins : 0;

  const report = {
    ...prev,
    telemetry: {
      ...(prev.telemetry||{}),
      wildcard: { enabled:true, level:lvl.level },
      dominance, netLift, decisions
    },
    finalWildWav: finalWav,
    finalWildMp3: finalMp3
  };

  const outPath = path.join(sessionDir, 'wildcard_report.json');
  await writeFile(outPath, JSON.stringify(report, null, 2));
  return report;
}
