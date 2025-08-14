// Tiny matrix pass to shape per-layer events by section intensity
// layers = { drums:{events}, pads:{events}, melody:{events}, bass:{events} }
export function applyMatrix(layers, { sections, stepsPerBar = 16 }) {
  if (!layers) return layers;
  const secAtStep = buildSectionLookup(sections, stepsPerBar);

  for (const [name, layer] of Object.entries(layers)) {
    if (!layer?.events) continue;
    for (const ev of layer.events) {
      const sec = secAtStep(ev.t) || 'med';
      // velocity shaping
      ev.vel = clamp(40, 127, Math.round((ev.vel ?? 90) * velScale(name, sec)));
      // density trim for hats/melody in low energy sections
      if (name === 'melody' && sec === 'low' && Math.random() < 0.35) ev._drop = true;
      if (name === 'drums'  && sec === 'low' && Math.random() < 0.15 && ev.pitch === 'hat') ev._drop = true;
    }
    layer.events = layer.events.filter(e => !e._drop);
  }
  return layers;
}

function buildSectionLookup(sections, stepsPerBar) {
  // sections: [{name, bars, tBars}]
  const ranges = sections.map(s => ({
    name: s.name,
    t0: s.tBars * stepsPerBar,
    t1: (s.tBars + s.bars) * stepsPerBar,
  }));
  return (t) => {
    const r = ranges.find(r => t >= r.t0 && t < r.t1);
    if (!r) return 'med';
    // map section names to intensity buckets similar to buildEnergyCurve()
    const hi = new Set(['chorus','hook','drop','build']);
    const lo = new Set(['intro','break','outro']);
    if (hi.has(r.name)) return 'high';
    if (lo.has(r.name)) return 'low';
    return 'med';
  };
}
function velScale(layer, intensity) {
  // gentle differences per layer
  const table = {
    drums:  { low: 0.85, med: 1.00, high: 1.08 },
    bass:   { low: 0.90, med: 1.00, high: 1.10 },
    melody: { low: 0.88, med: 1.00, high: 1.12 },
    pads:   { low: 0.95, med: 1.00, high: 1.05 },
    default:{ low: 0.95, med: 1.00, high: 1.05 },
  };
  return (table[layer] || table.default)[intensity] || 1.0;
}
const clamp = (a,b,x)=>Math.max(a,Math.min(b,x));
