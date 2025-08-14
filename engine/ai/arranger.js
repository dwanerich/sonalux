import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

export async function arrangeSong({ analysis, generated, targets }) {
  // TODO: place events onto a timeline and render to WAVs using your sampler/render chain
  const sessionDir = path.join(os.tmpdir(), 'sonalux_session_' + Date.now());
  await fs.mkdir(sessionDir, { recursive: true });
  await fs.writeFile(path.join(sessionDir, 'layers.json'), JSON.stringify({ analysis, generated, targets }, null, 2));
  return { sessionDir };
}
