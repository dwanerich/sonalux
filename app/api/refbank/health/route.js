import { getRefbank } from "@/lib/refbankStore";

export async function GET() {
  try {
    const items = await getRefbank();
    const sample = items.slice(0, 3).map(x => ({
      title: x.title, artist: x.artist, traits: x.traits
    }));
    return Response.json({ ok: true, count: items.length, sample });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
  }
}
