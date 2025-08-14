'use server';

import path from 'node:path';
import { sh } from '../utils/shell.js';

/**
 * Minimal “redrum polish” via ffmpeg (placeholder):
 * Modes: raw | studio | ultra
 */
export async function regenerateDrums(inputWav, { mode = 'studio' } = {}) {
  const dir = path.dirname(inputWav);
  const t = Date.now();
  const rawPath = path.join(dir, `drums_raw_${t}.wav`);
  const polPath = path.join(dir, `drums_pol_${t}.wav`);

  await sh('ffmpeg', ['-y', '-i', inputWav, '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', rawPath]);

  const brighten = mode === 'ultra' ? 4 : mode === 'studio' ? 2 : 0;
  const comp = mode === 'ultra' ? 'acompressor=threshold=-18dB:ratio=6:attack=3:release=120:makeup=6' :
               mode === 'studio' ? 'acompressor=threshold=-20dB:ratio=4:attack=5:release=160:makeup=4' :
                                   'acompressor=threshold=-24dB:ratio=2:attack=8:release=200:makeup=2';
  const eq = brighten ? `,highpass=f=25,equalizer=f=8000:t=h:width=2000:g=${brighten}` : ',highpass=f=25';
  const chain = `${comp}${eq},alimiter=limit=0.89`;
  await sh('ffmpeg', ['-y', '-i', rawPath, '-filter:a', chain, '-c:a', 'pcm_s16le', polPath]);
  return { rawPath, polPath, mode };
}
