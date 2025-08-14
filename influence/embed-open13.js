// Minimal OpenL3 embedding wrapper via ONNX Runtime (CPU)
import { InferenceSession, Tensor } from 'onnxruntime-node';

let session;
/** Load model once (call at server boot) */
export async function loadOpenL3(modelPath = 'models/openl3.onnx') {
  session = await InferenceSession.create(modelPath, { executionProviders: ['cpu'] });
}

/** audioF32: mono Float32Array normalized ~[-1,1] */
export async function embedAudioOpenL3(audioF32) {
  if (!session) await loadOpenL3();
  const t = new Tensor('float32', audioF32, [1, audioF32.length]); // adjust shape if your checkpoint differs
  const out = await session.run({ audio: t });
  const vec = Float32Array.from(out.embedding?.data || out.output?.data); // name can vary
  // L2 normalize for cosine search
  let n = 0; for (let i=0;i<vec.length;i++) n += vec[i]*vec[i];
  n = Math.sqrt(n)||1; for (let i=0;i<vec.length;i++) vec[i] /= n;
  return vec;
}
