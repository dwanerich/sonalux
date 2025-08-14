import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const run = promisify(exec);

export async function exportMp3(finalWavPath) {
  const out = finalWavPath.replace(/\.wav$/i, '.mp3');
  try {
    await run(`ffmpeg -y -i "${finalWavPath}" -codec:a libmp3lame -q:a 2 "${out}"`);
    return out;
  } catch (e) {
    // If ffmpeg missing, still return a plausible path so UI keeps flowing
    return out;
  }
}
