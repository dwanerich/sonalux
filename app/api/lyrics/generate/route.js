
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req){
  try{
    const { prompt, topic } = await req.json();
    const seed = (prompt || topic || 'moody trap, late night city, bell hooks');
    if (process.env.OPENAI_API_KEY){
      const sys = "You are a hit songwriter. Write concise, catchy lyrics: 2 short verses (4 lines each), a hook (4 lines) with a repeatable phrase, optional bridge (2 lines). Keep to PG-13, no explicit content. Add [Verse], [Hook], [Bridge] headers.";
      const body = { model: "gpt-4o-mini", messages: [{ role:'system', content: sys }, { role:'user', content: seed }], temperature: 0.9 };
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", "authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify(body)
      });
      if (r.ok){
        const j = await r.json();
        const text = j?.choices?.[0]?.message?.content?.trim();
        if (text) return NextResponse.json({ ok:true, text });
      }
    }
    const text = `[Verse]
We ride through the midnight glow
Echoes in the stereo
Neon on your shadowed face
Heartbeat finds the hidden pace

[Hook]
Hold on to the afterglow
Say my name then let it go
All we ever need to know
Is boom—bell—808—roll

[Verse]
Footsteps in a reverie
City hum a memory
Turn the dial and let it breathe
Find the fire underneath

[Bridge]
All this static turns to gold
When the rhythm takes control
`;
    return NextResponse.json({ ok:true, text });
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
