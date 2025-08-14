// app/api/generate/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/* ---------------- helpers ---------------- */
const truthy = (v) => ['1','true','yes','on','y'].includes(String(v ?? '').toLowerCase());

async function saveUpload(file) {
  // Save a File/Blob from formData to /public/uploads
  const arrayBuffer = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(dir, { recursive: true });
  const safeName = `${Date.now()}_${String(file.name || 'upload.mp3').replace(/\s+/g, '_')}`;
  const out = path.join(dir, safeName);
  await writeFile(out, buf);
  return out;
}

async function sha256OfFile(p){
  const data = await readFile(p);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function isDuplicate(p){
  const idxPath = path.join(process.cwd(), 'public', 'uploads', 'uploads_index.json');
  try {
    const hex = await sha256OfFile(p);
    const exists = await stat(idxPath).then(()=>true).catch(()=>false);
    let idx = exists ? JSON.parse(await readFile(idxPath, 'utf8')) : { hashes: [] };
    const dup = idx.hashes.includes(hex);
    if (!dup){ idx.hashes.push(hex); await writeFile(idxPath, JSON.stringify(idx)); }
    return { dup:false };
  } catch {
    return { dup:false };
  }
}

async function importIfExists(absPath) {
  try {
    if (!fs.existsSync(absPath)) return null;
    const m = await import(pathToFileURL(absPath).href);
    return m;
  } catch (e) {
    console.warn('[generate] import failed:', absPath, e.message);
    return null;
  }
}

async function getRunner() {
  const root = process.cwd();
  const candidates = [
    // modern first
    path.join(root, 'engine', 'orchestrator.js'),
    path.join(root, 'engine', 'orchestrator', 'index.js'),
    path.join(root, 'engine', 'orchestrator.mjs'),
    // legacy
    path.join(root, 'engine', 'orchestrator', 'runFlip.js'),
    path.join(root, 'engine', 'orchestrator', 'runFlip.mjs'),
  ];

  for (const file of candidates) {
    const mod = await importIfExists(file);
    if (!mod) continue;

    if (typeof mod.orchestrateRemix === 'function') {
      console.log('[generate] using orchestrateRemix from', file);
      return async (args) => mod.orchestrateRemix(args);
    }
    if (typeof mod.runFlip === 'function') {
      console.log('[generate] using legacy runFlip from', file);
      return async (args) => mod.runFlip(args);
    }
    if (typeof mod.default === 'function') {
      console.log('[generate] using default export from', file);
      return async (args) => mod.default(args);
    }
  }

  throw new Error('No orchestrator found (tried legacy runFlip and new orchestrateRemix).');
}

function publicUrl(pAbs) {
  if (!pAbs) return null;
  const pubRoot = path.join(process.cwd(), 'public');
  return pAbs.startsWith(pubRoot) ? pAbs.slice(pubRoot.length) || '/' : pAbs;
}

async function parseBody(req) {
  const ctype = req.headers.get('content-type') || '';
  if (ctype.includes('multipart/form-data')) {
    const form = await req.formData();
    return { form };
  }
  // allow JSON for quick tests without upload
  try {
    const json = await req.json();
    return { json };
  } catch {
    return {};
  }
}
/* ---------------- handler ---------------- */
export async function POST(req) {
  try {
    const isDev = process.env.NODE_ENV !== 'production';
    const enabled = truthy(
      process.env.ENABLE_SONALUX ??
      process.env.ENABLE_GMI_FLIPLINE ??
      (isDev ? '1' : '0')
    );

    if (!enabled) {
      return NextResponse.json(
        { ok: false, error: 'Flipline disabled. Set ENABLE_SONALUX=1 (or ENABLE_GMI_FLIPLINE=1).' },
        { status: 503 }
      );
    }

    // Accept multipart form-data or JSON
    const { form, json } = await parseBody(req);

    // Optional upload → save under /public/uploads
    let inputPath = null;
    if (form) {
      const file = form.get('audio') || form.get('file');

      let neighbors = [];
    if (file) {
      const audioF32 = await decodeUploadToMonoF32(file); // your decode helper
      const qVec = await embedAudioOpenL3(audioF32);
      neighbors = search(IDX, qVec, /*k=*/5, /*ef*/64)              // [{id, score}]
        .map(({id, score}) => ({ refId: embeds[id].id, score }));   // map back to ref ids
    }

      
      if (file && typeof file.arrayBuffer === 'function') {
        inputPath = await saveUpload(file);
        // non-blocking duplicate record
        try { await isDuplicate(inputPath); } catch {}
      }
    } else if (json?.filePath) {
      inputPath = String(json.filePath);
    }

    // Normalize controls
    const genre      = form ? String(form.get('genre') || 'Trap')      : String(json?.genre ?? 'Trap');
    const mood       = form ? String(form.get('mood') || '')           : String(json?.mood ?? '');
    const intensity  = form ? Number(form.get('intensity') ?? 0.6)     : Number(json?.intensity ?? 0.6);
    const prompt     = form ? String(form.get('prompt') || '')         : String(json?.prompt ?? '');
    const vocal_pref = form ? String(form.get('vocal_pref') || 'None') : String(json?.vocal_pref ?? 'None');

    // Create a public session directory
    const sessionDir = path.join(process.cwd(), 'public', 'out', `session-${Date.now()}`);
    await mkdir(sessionDir, { recursive: true });

    // Resolve a runner (modern → legacy). If missing, serve fallback audio.
    let run;
    try {
      run = await getRunner();
    } catch {
      console.warn('[generate] no orchestrator, falling back to /test.mp3');
      return NextResponse.json({ ok: true, url: '/test.mp3', finalMp3: '/test.mp3', fallback: true });
    }

    // Execute the runner
    let out;
    try {
      out = await run({
        inputPath,
        file: inputPath,               // modern orchestrator expects "file"
        genre,
        mood,
        intensity,
        prompt,
        vocal_pref,
        sessionDir,
        promptMapperUrl: process.env.PROMPT_MAPPER_URL || 'http://127.0.0.1:8011',
        requireSplit: false,           // avoid Demucs during MVP
        strictNew: false
      });
    } catch (e) {
      console.error('[generate] runner error:', e);
      return NextResponse.json({
        ok: true,
        url: '/test.mp3',
        finalMp3: '/test.mp3',
        fallback: true,
        error: e.message
      });
    }

    // Map absolute paths under /public → public URLs
    const finalWav = publicUrl(out?.finalWav);
    const finalMp3 = publicUrl(out?.finalMp3) || publicUrl(out?.url) || '/test.mp3';
    const url = finalMp3;

    // Optionally persist a report.json beside artifacts
    try {
      const reportPathAbs = path.join(sessionDir, 'report.json');
      await writeFile(
        reportPathAbs,
        JSON.stringify({ controls: { genre, mood, intensity, prompt, vocal_pref }, out }, null, 2)
      );
    } catch (e) {
      console.warn('[generate] report write skipped:', e.message);
    }

    // Optional: save session to DB if model exists
    try {
      const SessionMod = await importIfExists(path.join(process.cwd(), 'lib', 'models', 'Session.js'));
      const Session = SessionMod?.default || null;
      if (Session) {
        await Session.create({
          prompt,
          controls: out?.controls,
          rsg_id: out?.rsg_id,
          refs_used: out?.refs_used,
          vocal_pref,
          artifacts: out?.artifacts,
          finalWav,
          finalMp3,
          reportPath: path.join('/out', path.basename(sessionDir), 'report.json')
        });
      }
    } catch (e) {
      console.warn('[generate] DB save skipped:', e.message);
    }

    return NextResponse.json({ ok: true, url, finalMp3, finalWav, report: out?.report || out });
  } catch (e) {
    console.error('[generate] fatal:', e);
    // Always return playable audio so UX isn't blocked
    return NextResponse.json(
      { ok: true, url: '/test.mp3', finalMp3: '/test.mp3', fallback: true, error: e.message },
      { status: 200 }
    );
  }
}
