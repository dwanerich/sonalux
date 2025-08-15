import { getRefbank } from "@/lib/refbankStore";

function cosine(a = [], b = []) {
  let da=0, db=0, dot=0, n=Math.min(a.length,b.length);
  for (let i=0;i<n;i++){ const x=a[i], y=b[i]; dot+=x*y; da+=x*x; db+=y*y; }
  if (!da || !db) return 0;
  return dot / (Math.sqrt(da)*Math.sqrt(db));
}

export async function POST(req) {
  try {
    const { k = 4, sectionVec = null, requiredTraits = [] } = await req.json();
    const K = Math.max(1, Math.min(10, Number(k)||4));
    const items = await getRefbank();
    if (!items.length) return Response.json({ ok:true, refs: [] });

    const haveVec = Array.isArray(sectionVec) && sectionVec.length > 0;

    // Score = cosine(sectionVec, refVec) + small bonus for trait overlap
    const scored = items.map(it => {
      const overlap = Array.isArray(requiredTraits)
        ? it.traits.filter(t => requiredTraits.includes(t)).length
        : 0;
      const traitBonus = 0.1 * overlap;
      const cos = (haveVec && Array.isArray(it.openl3_vec)) ? cosine(sectionVec, it.openl3_vec) : 0;
      return { it, score: cos + traitBonus };
    });

    // If no vectors provided anywhere, just shuffle + pick K
    if (!haveVec && !scored.some(s => s.score > 0)) {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      return Response.json({ ok: true, refs: shuffled.slice(0, K) });
    }

    scored.sort((a,b) => b.score - a.score);
    const refs = scored.slice(0, K).map(s => s.it);
    return Response.json({ ok: true, refs });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false, error: e.message }), { status: 500 });
  }
}
