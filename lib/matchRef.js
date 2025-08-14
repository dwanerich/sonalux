import { REF_BANK } from '../data/refBank.js';

export function matchReference(genre, mood, energy) {
  const list = REF_BANK[genre] || [];
  if (!list.length) return null;
  // simple heuristic: energy match first
  const exact = list.find(r => r.energy === energy) || list[0];
  return exact;
}
