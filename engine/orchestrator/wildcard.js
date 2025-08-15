// engine/orchestrator/wildcard.js
import { cosine } from "../utils/cosine";

// map intensity → small config (Clean/Bold/Rebel)
function intensityToCfg(intensity) {
  if (intensity <= 33) return { topK: 2, candidates: 2, margin: 0.18, refWeight: 0.40 };
  if (intensity <= 66) return { topK: 3, candidates: 4, margin: 0.14, refWeight: 0.50 };
  return { topK: 4, candidates: 6, margin: 0.10, refWeight: 0.60 };
}

function score(vec, baseline, refs, refW) {
  const raw = cosine(vec, baseline);
  const ref = refs.length ? refs.reduce((s,r)=>s+cosine(vec,r),0)/refs.length : 0;
  return (1 - refW) * raw + refW * ref;
}

function pickWinner(baseline, candidates, refs, { margin, refWeight }) {
  const baseScore = score(baseline, baseline, refs, refWeight);
  let bestIdx = -1, bestScore = baseScore;
  for (let i=0; i<candidates.length; i++) {
    const s = score(candidates[i], baseline, refs, refWeight);
    if (s > bestScore) { bestScore = s; bestIdx = i; }
  }
  const delta = bestScore - baseScore;
  const improved = bestIdx >= 0 && delta >= margin;
  return { improved, bestIdx, delta };
}

// This is the “Wildcard pass”
export async function runWildcardPass({
  stems,          // [{ id, sections:[{ id, openl3_vec, ... }] }]
  wildcard,       // boolean
  intensity,      // 0..100
  moods = [],     // ['reforge','joker-chip',...]
  getTopRefs,     // async ({ sectionVec, k, moods }) => [{ openl3_vec, ... }]
  generator       // async (stemId, sectionId, { refs, moods, count }) => Vec[]
}) {
  if (!wildcard && !moods.includes("joker-chip"))
    return { decisions: [], dominance: 0, netLift: 0 };

  const lvl = intensityToCfg(Number(intensity||0));
  const decisions = [];
  let wins = 0, lift = 0;

  for (const stem of stems) {
    for (const sec of stem.sections) {
      // ⬇️ THIS is the snippet you quoted:
      const refItems = await getTopRefs({ sectionVec: sec.openl3_vec, k: lvl.topK, moods });
      const refVecs  = refItems.map(r => r.openl3_vec).filter(Boolean);

      // Ask your generator for challenger VECTORS (audio render can be internal)
      const candVecs = await generator(stem.id, sec.id, {
        refs: refVecs, moods, count: lvl.candidates
      });

      const { improved, bestIdx, delta } =
        pickWinner(sec.openl3_vec, candVecs, refVecs, { margin: lvl.margin, refWeight: lvl.refWeight });

      decisions.push({ stemId: stem.id, sectionId: sec.id, improved, bestIdx, delta });
      if (improved) { wins++; lift += delta; }
    }
  }
  const total = Math.max(1, decisions.length);
  return { decisions, dominance: wins/total, netLift: wins ? (lift/wins) : 0 };
}
