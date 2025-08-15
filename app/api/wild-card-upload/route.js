export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

// adjust depth if your route is under src/app/...
import { runFlip } from '../../../engine/orchestrator/runFlip.js';
import { wildcardPostProcess } from '../../../engine/orchestrator/wildcard_post.js';

function toPublicUrl(absPath) {
  const pub = path.join(process.cwd(), 'public');
  return absPath.startsWith(pub) ? absPath.slice(pub.length).replace(/\\/g, '/') : absPath;
}

export async function GET() {
  return Response.json({ ok: true, route: '/api/wild-card-upload' });
}

export async function POST(req) {
  try {
    // ---- Stage: form ----
    let form;
    try { form = await req.formData(); }
    catch (e) { return Response.json({ ok:false, stage:'form', error:String(e?.message||e) }, { status: 400 }); }

    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return Response.json({ ok:false, stage:'form', error:'No file uploaded' }, { status: 400 });
    }

    // DRY short-circuit
    if (String(form.get('dry') || '') === '1') {
      const ts = Date.now();
      const sessionDir = path.join(process.cwd(), 'public', 'sessions', String(ts));
      await mkdir(sessionDir, { recursive: true });
      const uploadPath = path.join(sessionDir, `upload${path.extname(file.name || '') || '.wav'}`);
      await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));
      return Response.json({ ok:true, stage:'dry', sessionUrl:`/sessions/${ts}`, uploadUrl: toPublicUrl(uploadPath) });
    }

    // ---- Stage: save upload ----
    const ts = Date.now();
    const sessionDir = path.join(process.cwd(), 'public', 'sessions', String(ts));
    await mkdir(sessionDir, { recursive: true });
    const uploadPath = path.join(sessionDir, `upload${path.extname(file.name || '') || '.wav'}`);
    await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));

    // ---- Stage: params ----
    const genre     = String(form.get('genre') ?? 'generic');
    const mood      = String(form.get('mood') ?? 'neutral');
    const prompt    = String(form.get('prompt') ?? '');
    const intensity = Number(form.get('intensity') ?? 50);
    const wildcard  = String(form.get('wildcard') ?? 'true') === 'true';
    const moods     = String(form.get('moods') ?? '').split(',').map(s=>s.trim()).filter(Boolean);

    // ---- Stage: runFlip ----
    const promptMapperUrl = process.env.PROMPT_MAPPER_URL || 'http://localhost:3000/api/prompt';
    let baseReport;
    try {
      baseReport = await runFlip({
        inputPath: uploadPath, genre, mood, intensity, prompt,
        sessionDir, promptMapperUrl, requireSplit:false, strictNew:false
      });
    } catch (e) {
      return Response.json({ ok:false, stage:'runFlip', error:String(e?.message||e) }, { status: 500 });
    }

    // ---- Stage: wildcard ----
    let wildReport;
    try {
      wildReport = await wildcardPostProcess({ sessionDir, intensity, moods, wildcard });
    } catch (e) {
      return Response.json({ ok:false, stage:'wildcard', error:String(e?.message||e) }, { status: 500 });
    }

    // ---- Done ----
    return Response.json({
      ok: true,
      sessionUrl: `/sessions/${ts}`,
      base: {  finalWav: toPublicUrl(baseReport.finalWav),  finalMp3: toPublicUrl(baseReport.finalMp3) },
      wild: {  finalWav: toPublicUrl(wildReport.finalWildWav), finalMp3: toPublicUrl(wildReport.finalWildMp3) },
      telemetry: wildReport.telemetry
    });
  } catch (e) {
    return Response.json({ ok:false, stage:'route', error:String(e?.message||e) }, { status: 500 });
  }
}
