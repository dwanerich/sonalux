import fs from 'fs/promises';
import { embedAudioOpenL3, loadOpenL3 } from '../lib/influence/embed-openl3.js';
import { decodeToMonoF32 } from '../lib/audio/decode.js'; // tiny decode helper (ffmpeg/ffprobe)
await loadOpenL3('models/openl3.onnx');

const refs = JSON.parse(await fs.readFile('data/refBank/index.json', 'utf8')); // [{id, path, meta}]
const out = [];
for (const r of refs) {
  const mono = await decodeToMonoF32(r.path, { seconds: 30, loudestWindow: true });
  const vec = await embedAudioOpenL3(mono);
  out.push({ id: r.id, vec: Array.from(vec) });
}
await fs.writeFile('data/refBank/embeds.json', JSON.stringify(out));
console.log('embeddings written:', out.length);
