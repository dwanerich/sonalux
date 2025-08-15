'use server';

import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

// IMPORTANT: use RELATIVE imports, no TS:
import { runFlip } from '../../../engine/orchestrator/runFlip.js';
import { wildcardPostProcess } from '../../../engine/orchestrator/wildcard_post.js';

// turn absolute file path under /public into a URL like /sessions/.../file.mp3
function toPublicUrl(absPath) {
  const pub = path.join(process.cwd(), 'public');
  return absPath.startsWith(pub) ? absPath.slice(pub.length).replace(/\\/g,'/') : absPath;
}

export async function POST(req) {
  try {
    const form = await req.formData();

    // 1) read form fields
    const file = form.get('file');                 // required
    const genre = (form.get('genre') || 'generic').toString();
    const mood  = (form.get('mood')  || 'neutral').toString();
    const prompt = (form.get('prompt') || '').toString();
    const intensity = Number(form.get('intensity') || 50);
    const wildcard  = String(form.get('wildcard') || 'true') === 'true';

    // moods can be: multiple 'moods' fields OR one comma string
    let moods = [];
    const moodsField = form.getAll('moods');
    if (moodsField.length > 1) moods = moodsField.map(String);
    else if (moodsField.length === 1) moods = String(moodsField[0]).split(',').map(s=>s.trim()).filter(Boolean);

    if (!file || typeof file.arrayBuffer !== 'function') {
      return new Response(JSON.stringify({ ok:false, error:'No file uploaded' }), { status: 400 });
    }

    // 2) create a web-accessible session dir under /public/sessions/<ts>
    const ts = Date.now();
    const sessionDir = path.join(process.cwd(), 'public', 'sessions', String(ts));
    await mkdir(sessionDir, { recursive: true });

    // 3) save upload to disk (keep original extension if present)
    const origName = file.name || 'upload.wav';
    const ext = path.extname(origName) || '.wav';
    const uploadPath = path.join(sessionDir, `upload${ext}`);
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(uploadPath, buf);

    // 4) run your existing pipeline (UNCHANGED)
    const promptMapperUrl = process.env.PROMPT_MAPPER_URL || 'http://localhost:3000/api/prompt';
    const baseReport = await runFlip({
      inputPath: uploadPath,
      genre, mood, intensity, prompt,
      sessionDir, promptMapperUrl,
      requireSplit: false,
      strictNew: false
    });

    // 5) run the Wildcard post-process (drums MVP)
    const wildReport = await wildcardPostProcess({
      sessionDir, intensity, moods, wildcard
    });

    // 6) return public URLs + telemetry (so UI can play them)
    return Response.json({
      ok: true,
      sessionUrl: `/sessions/${ts}`,
      base: {
        finalWav: toPublicUrl(baseReport.finalWav),
        finalMp3: toPublicUrl(baseReport.finalMp3)
      },
      wild: {
        finalWav: toPublicUrl(wildReport.finalWildWav),
        finalMp3: toPublicUrl(wildReport.finalWildMp3)
      },
      telemetry: wildReport.telemetry
    });
  } catch (e) {
    console.error('wildcard-upload error:', e);
    return new Response(JSON.stringify({ ok:false, error: e.message }), { status: 500 });
  }
}
