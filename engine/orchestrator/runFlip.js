'use server';

import path from 'node:path';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { sh, which } from '../utils/shell.js';
import { regenerateDrums } from '../drums/regenerateDrums.js';
import { applyWatermark } from '../utils/watermark.js';
import { computeSections } from './sectionizer.js';
import { spawn } from 'node:child_process';
// at top of the file
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
// resolve paths; allow override via env if you later install brew ffmpeg
const FFMPEG  = process.env.FFMPEG_BIN  || ffmpegStatic;
const FFPROBE = process.env.FFPROBE_BIN || ffprobeStatic.path;

// example wrapper (use your existing spawn/sh helper)
import { spawn } from 'node:child_process';
function sh(bin, args) {
  const cmd = bin === 'ffmpeg' ? FFMPEG : bin === 'ffprobe' ? FFPROBE : bin;
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('close', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}`)));
  });
}


async function ensureSession(dir) { await mkdir(dir, { recursive: true }); }

async function convertToWav(inputFile, outDir) {
  const outWav = path.join(outDir, `input_${Date.now()}.wav`);
  await sh('ffmpeg', ['-y', '-i', inputFile, '-vn', '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', outWav]);
  return outWav;
}

async function ffprobeDuration(p){
  const { out } = await sh('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1', p]);
  return Math.max(0, parseFloat(out.trim() || '0'));
}

async function splitDemucsRequired(inputWav, outDir, requireSplit) {
  const ok = await which('demucs');
  if (!ok && requireSplit) throw new Error('Demucs not found (required). Install: pip install demucs');
  if (!ok) return { mix: inputWav };
  await sh('demucs', ['-n', 'mdx_q', '-o', outDir, inputWav]);
  const base = path.basename(inputWav, path.extname(inputWav));
  const d = path.join(outDir, base);
  return {
    drums: path.join(d, 'drums.wav'),
    bass: path.join(d, 'bass.wav'),
    vox: path.join(d, 'vocals.wav'),
    other: path.join(d, 'other.wav')
  };
}

async function passthroughToWav(inFile, outFile) {
  await sh('ffmpeg', ['-y', '-i', inFile, '-vn', '-ac', '2', '-ar', '44100', '-c:a', 'pcm_s16le', outFile]);
}

async function loadGuide(rsgId) {
  try {
    const [genre, mood] = String(rsgId).split(':');
    const guidePath = path.join(process.cwd(), 'refbank', 'guides', `${genre}_${mood}_v1.json`);
    const raw = await readFile(guidePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function mixdown(inputs, finalWav, finalMp3, guide) {
  const ins = inputs.filter(Boolean);
  if (!ins.length) throw new Error('No inputs to mix');

  const I = guide?.mix_targets?.lufs_i ?? -12;
  const TP = guide?.mix_targets?.true_peak_db ?? -1.0;

  await sh('ffmpeg', [
    '-y', ...ins.flatMap(f => ['-i', f]),
    '-filter_complex', `amix=inputs=${ins.length}:normalize=0, loudnorm=I=${I}:TP=${TP}:LRA=7, alimiter=limit=${Math.min(0.89, 10 ** (TP/20))}`,
    '-c:a', 'pcm_s16le', finalWav
  ]);
  await sh('ffmpeg', ['-y', '-i', finalWav, '-c:a', 'libmp3lame', '-q:a', '2', finalMp3]);
  return { finalWav, finalMp3 };
}


function py(args, opts={}){
  return new Promise((resolve, reject)=>{
    const p = spawn('python', args, { stdio:['ignore','pipe','pipe'], ...opts });
    let out='', err=''; p.stdout.on('data',d=>out+=d.toString()); p.stderr.on('data',d=>err+=d.toString());
    p.on('close', c=> c===0 ? resolve({out,err}) : reject(new Error(err||out)));
  });
}

async function sliceStem(src, dest, start, duration){
  await sh('ffmpeg', ['-y', '-i', src, '-ss', String(start), '-t', String(duration), '-c:a', 'pcm_s16le', dest]);
}

export async function runFlip({ inputPath, genre, mood, intensity, prompt, vocal_pref = 'none', sessionDir, promptMapperUrl, requireSplit=false, strictNew=false }) {
  await ensureSession(sessionDir);
  const inputWav = await convertToWav(inputPath, sessionDir);

  // prompt → feature map
  const fm = await fetch(`${promptMapperUrl}/map`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ prompt, genre, mood, intensity })
  }).then(r => r.json()).catch(() => ({ rsg_id: `${genre}:${mood}:v1`, controls: { genre, mood, intensity }, refs_used: [] }));

  const guide = await loadGuide(fm.rsg_id);
  const stems = await splitDemucsRequired(inputWav, sessionDir, requireSplit);

  // compute sections from guide and total duration
  const totalSec = await ffprobeDuration(stems.drums || stems.mix || inputWav);
  const sections = computeSections(guide, totalSec);

  // intensity→mode
  const mode = /^h/i.test(intensity) ? 'ultra' : /^l/i.test(intensity) ? 'raw' : 'studio';

  // Section-wise processing
  const builtSections = [];
  for (const sec of sections){
    const secDir = path.join(sessionDir, `sec_${Math.round(sec.start*1000)}`);
    await mkdir(secDir, { recursive: true });

    // slice stems
    const paths = {};
    for (const k of ['drums','bass','vox','other','mix']){
      if (!stems[k]) continue;
      const p = path.join(secDir, `${k}.wav`);
      await sliceStem(stems[k], p, sec.start, sec.duration || 0.0001);
      paths[k] = p;
    }

    // generate/transform
    let drumsPol = null;
    if (paths.drums){
      // "strictNew" means ignore original audio content aside from analysis; here we always render new processed drums
      const { polPath } = await regenerateDrums(paths.drums, { mode });
      drumsPol = polPath;
    }

    // lane generators when intensity high or strictNew and Fluidsynth SF2 available
    const haveSf2 = !!process.env.FLUID_SF2;
    if ((/^h/i.test(intensity) || strictNew) && haveSf2){
      // DRUMS: generate 2-bar pattern and render
      try{
        const drumMid = path.join(secDir, 'drums.mid');
        await py(['services/adapters/drum_generate.py','--out_mid', drumMid, '--bars', String(Math.max(2, Math.round(sec.duration / (240/(guide?.bpm_target||120))*2))) ]);
        const drumNew = path.join(secDir, 'drums_new.wav');
        await py(['services/adapters/resynth_fluidsynth.py','--sf2', process.env.FLUID_SF2, '--mid', drumMid, '--out', drumNew]);
        drumsPol = drumNew;
      }catch(e){ /* fallback to polished audio already computed */ }
      // BASS: transcribe or synth
      try{
        const bassMid = path.join(secDir, 'bass.mid');
        if (paths.bass){
          await py(['services/adapters/basic_pitch_to_midi.py','--audio', paths.bass, '--out_mid', bassMid]);
        } else {
          // generate simple root motion bass from guide key (stub via melody gen with low octave will be done by SF2)
          await py(['services/adapters/melody_generate.py','--out_mid', bassMid, '--bars', '2', '--key', String(guide?.key_center||'C'), '--scale', String(guide?.scale||'aeolian')]);
        }
        const bassWav = path.join(secDir, 'bass_new.wav');
        await py(['services/adapters/resynth_fluidsynth.py','--sf2', process.env.FLUID_SF2, '--mid', bassMid, '--out', bassWav, '--gain','0.6']);
        paths.bass = bassWav;
      }catch(e){}
      // MELODY/TOPLINE: synth lead
      try{
        const melMid = path.join(secDir, 'mel.mid');
        await py(['services/adapters/melody_generate.py','--out_mid', melMid, '--bars', '2', '--key', String(guide?.key_center||'C'), '--scale', String(guide?.scale||'aeolian')]);
        const melWav = path.join(secDir, 'mel_new.wav');
        await py(['services/adapters/resynth_fluidsynth.py','--sf2', process.env.FLUID_SF2, '--mid', melMid, '--out', melWav, '--gain','0.5']);
        paths.other = melWav; // replace "other" with generated lead for now
      }catch(e){}
    }

    // others: placeholder pass-through (hook for MIDI/resynth later)
    const others = [];
    for (const k of ['bass','vox','other']) if (paths[k]) others.push(paths[k]);

    // section mix
    const secOut = path.join(secDir, `sec_mix.wav`);
    await sh('ffmpeg', ['-y', ...(drumsPol?[ '-i', drumsPol ]:[]), ...others.flatMap(f=>['-i', f]),
      '-filter_complex', `amix=inputs=${(drumsPol?1:0)+others.length}:normalize=0`, '-c:a','pcm_s16le', secOut]);

    builtSections.push({ sec, secOut });
  }

  // Concat all section mixes to final
  const concatList = path.join(sessionDir, 'concat.txt');
  await writeFile(concatList, builtSections.map(b=>`file '${b.secOut.replace(/'/g,"'\''")}'`).join('
'));
  const finalPre = path.join(sessionDir, 'final_pre.wav');
  await sh('ffmpeg', ['-y','-f','concat','-safe','0','-i', concatList, '-c','copy', finalPre]);

  const finalWav = path.join(sessionDir, 'final.wav');
  const finalMp3 = path.join(sessionDir, 'final.mp3');
  await mixdown([finalPre], finalWav, finalMp3, guide);

  // optional: ingest into sound bank
  try {
    if (process.env.ENABLE_BANKING === '1' && process.env.SOUNDBANK_URL) {
      await fetch(`${process.env.SOUNDBANK_URL}/ingest`, {
        method:'POST', headers:{'content-type':'application/json'},
        body: JSON.stringify({ session_dir: sessionDir, rsg_id: fm.rsg_id, controls: fm.controls || { genre, mood, intensity } })
      });
    }
  } catch {}

  const report = {
    timestamp: Date.now(),
    rsg_id: fm.rsg_id,
    controls: fm.controls || { genre, mood, intensity },
    vocal_pref,
    refs_used: fm.refs_used || [],
    targets: fm.targets || {},
    sections,
    strictNew,
    finalWav, finalMp3
  };
  await writeFile(path.join(sessionDir, 'report.json'), JSON.stringify(report, null, 2));
  return report;
}
