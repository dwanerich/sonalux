import path from 'node:path';
import fs from 'node:fs/promises';

async function writeSilentWav(filePath, seconds = 3, sampleRate = 44100) {
  const numChannels = 2, bps = 2;
  const n = seconds * sampleRate;
  const dataSize = n * numChannels * bps;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + dataSize, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(numChannels, 22); buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * numChannels * bps, 28);
  buf.writeUInt16LE(numChannels * bps, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(dataSize, 40);
  await fs.writeFile(filePath, buf);
  return filePath;
}

export async function mixAndMaster({ session }) {
  const wav = path.join(session.sessionDir, 'final.wav');
  await writeSilentWav(wav, 3);
  return wav;
}
