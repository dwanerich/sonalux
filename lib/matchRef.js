export async function getTopRefs({ sectionVec, k = 4, moods = [] }) {
  // Use mood chips as "requiredTraits" if you want to bias results
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/refbank/topk`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ k, sectionVec, requiredTraits: moods })
  });
  const j = await r.json();
  return j.refs || [];
}
