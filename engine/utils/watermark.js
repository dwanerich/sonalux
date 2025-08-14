
import crypto from 'node:crypto';
import path from 'node:path';
import { sh } from './shell.js';

/**
 * Digital Stain v1:
 *  - Two near-ultrasonic sines mixed at very low level (≈ -42 dBFS) keyed by meta hash.
 *  - Also writes metadata tags into the output container.
 *  - Not bulletproof; later we can switch to a robust watermark library. Good enough for MVP tracking.
 */
export async function applyWatermark(inputWav, outWav, meta = {}){
  const json = JSON.stringify(meta);
  const hash = crypto.createHash('sha256').update(json).digest('hex');
  // derive freqs from hash
  const h1 = parseInt(hash.slice(0,4), 16) % 50;   // 0..49
  const h2 = parseInt(hash.slice(4,8), 16) % 50;
  const f1 = 17400 + h1; // ~17.4-17.45 kHz
  const f2 = 18300 + h2; // ~18.3-18.35 kHz

  // probe duration
  const { out:durStr } = await sh('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nk=1:nw=1', inputWav]);
  const dur = Math.max(1, Math.floor(parseFloat(durStr.trim() || '1')));

  // Mix watermark tones
  const tmpOut = outWav; // can be same
  await sh('ffmpeg', [
    '-y',
    '-i', inputWav,
    '-f','lavfi','-t', String(dur), '-i', `sine=frequency=${f1}:sample_rate=44100`,
    '-f','lavfi','-t', String(dur), '-i', `sine=frequency=${f2}:sample_rate=44100`,
    '-filter_complex', '[1:a]volume=0.007[a1];[2:a]volume=0.006[a2];[a1][a2]amix=inputs=2:normalize=0[wm];[0:a][wm]amix=inputs=2:normalize=0',
    '-c:a','pcm_s16le', tmpOut
  ]);

  // Return meta for tagging in outer pipeline
  return { out: tmpOut, hash };
}
