'use server';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      prompt = '',
      genre  = 'generic',
      mood   = 'neutral',
      intensity = 50
    } = body || {};

    // rsg_id must match your guide filename pattern: refbank/guides/<genre>_<mood>_v1.json
    const rsg_id = `${String(genre).toLowerCase()}:${String(mood).toLowerCase()}:v1`;

    // Minimal controls your pipeline can log/use
    const controls = {
      genre, mood, intensity,
      // optional: surface a few tags from the prompt
      tags: Array.from(new Set(
        String(prompt).toLowerCase().match(/[a-z0-9\-]+/g) || []
      )).slice(0, 8)
    };

    // Optional targets (leave empty if you rely on the guide file)
    const targets = {}; // e.g., { bpm_target: 140, key_center: "C", scale: "aeolian" }

    // Optional: suggest refs (kept empty for MVP; uncomment below to pull from your Ref Bank)
    const refs_used = [];

    // // If you want to pre-seed refs from your file-based Ref Bank, uncomment:
    // try {
    //   const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/refbank/topk`, {
    //     method: 'POST',
    //     headers: { 'content-type': 'application/json' },
    //     body: JSON.stringify({ k: 4, requiredTraits: controls.tags })
    //   });
    //   const { refs = [] } = await res.json();
    //   refs_used.push(...refs.map(r => ({ title: r.title, artist: r.artist })));
    // } catch {}

    return Response.json({ rsg_id, controls, refs_used, targets });
  } catch (e) {
    // Fallback shape matches what your runFlip already handles on error
    return Response.json(
      { rsg_id: 'generic:neutral:v1', controls: { genre: 'generic', mood: 'neutral', intensity: 50 }, refs_used: [] },
      { status: 200 }
    );
  }
}
