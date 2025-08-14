import { spawn } from 'node:child_process';

export function sh(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => (code === 0 ? resolve({ out, err }) : reject(new Error(err || out))));
  });
}

export async function which(bin) {
  try {
    const tool = process.platform === 'win32' ? 'where' : 'which';
    await sh(tool, [bin]);
    return true;
  } catch {
    return false;
  }
}
