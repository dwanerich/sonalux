
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

// IMPORTANT: use RELATIVE imports so you don't depend on "@/" aliases.
// Adjust the number of "../" if your paths differ.
import { runFlip } from '../../../engine/orchestrator/runFlip.js';
import { wildcardPostProcess } from '../../../engine/orchestrator/wildcard_post.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      inputPath,          // absolute or project-relative audio path
      genre, mood,
      intensity = 50,     // 0..100
      prompt = '',
      requireSplit = false,
      strictNew   = false,
      wildcard    = true, // toggle
      moods       = []    // e.g., ['reforge'] or include 'joker-chip'
    } = body || {};

    // Make a fresh session dir per request
    const sessionDir = path.join(process.cwd(), 'sessions', String(Date.now()));
    await mkdir(sessionDir, { recursive: true });

    // Your existing prompt mapper URL (adjust if different)
    const promptMapperUrl = process.env.PROMPT_MAPPER_URL || 'http://localhost:8002';

    // 1) Run your existing pipeline (UNCHANGED)
    const baseReport = await runFlip({
      inputPath, genre, mood, intensity, prompt,
      sessionDir, promptMapperUrl,
      requireSplit, strictNew
    });

    // 2) Run the new Wildcard post-process (adds final_wild.* and telemetry)
    const wildReport = await wildcardPostProcess({
      sessionDir,
      intensity,
      moods,
      wildcard
    });

    // Respond with both outputs + telemetry
    return Response.json({
      ok: true,
      sessionDir,
      base: {
        finalWav: baseReport.finalWav,
        finalMp3: baseReport.finalMp3
      },
      wild: {
        finalWav: wildReport.finalWildWav,
        finalMp3: wildReport.finalWildMp3
      },
      telemetry: wildReport.telemetry
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ ok:false, error: e.message }), { status: 500 });
  }
}
