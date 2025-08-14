// Derive more guidance from ref targets (cheap heuristics until annotated)
export function buildEnergyCurve(structure = [], base = 'med') {
  // map common sections to intensity; fall back to base
  const map = {
    intro: 'low', verse: 'med', pre: 'med', build: 'high',
    chorus: 'high', drop: 'high', hook: 'high', break: 'low', bridge: 'med', outro: 'low'
  };
  return structure.map(s => map[s] || base);
}

export function sectionGrid(structure = [], barsTotal = 8) {
  // Evenly divide bars across sections (simple, deterministic)
  const n = Math.max(1, structure.length);
  const per = Math.max(1, Math.floor(barsTotal / n));
  const out = [];
  let start = 0;
  for (let i=0;i<n;i++){
    const bars = (i === n-1) ? (barsTotal - start) : per;
    out.push({ name: structure[i], bars, tBars: start });
    start += bars;
  }
  return out;
}

export function progForMode(mode='minor') {
  return mode === 'minor' ? ['i','VI','VII','i'] : ['I','V','vi','IV'];
}
