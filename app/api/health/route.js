import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { which } from '../../../../engine/utils/shell.js';

export async function GET() {
  const hasFfmpeg = await which('ffmpeg');
  const hasDemucs = await which('demucs');
  let mapper = 'down';
  try {
    const r = await fetch(`${process.env.PROMPT_MAPPER_URL || 'http://127.0.0.1:8011'}/map`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'health', genre: 'trap', mood: 'dark', intensity: 'med' })
    });
    if (r.ok) mapper = 'up';
  } catch {}
  return NextResponse.json({ ffmpeg: hasFfmpeg?'up':'down', demucs: hasDemucs?'up':'missing', prompt_mapper: mapper });
}
