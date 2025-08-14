
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req){
  try{
    const { prompt } = await req.json();
    if (!prompt || prompt.length < 3) return NextResponse.json({ ok:false, error:'empty prompt' }, { status:400 });

    // If OPENAI_API_KEY is set, call OpenAI Chat Completions to expand into a concise song brief
    if (process.env.PROMPT_EXPANDER === 'openai' && process.env.OPENAI_API_KEY){
      const sys = "You are a music creative director. Expand the user's idea into a concise, actionable song brief under 120 words with: style tags, vibe adjectives, BPM or range, key or scale, and 2-3 arrangement notes. Keep it tight and concrete.";
      const body = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      };
      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", "authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify(body)
      });
      if (r.ok){
        const j = await r.json();
        const brief = j?.choices?.[0]?.message?.content?.trim();
        if (brief) return NextResponse.json({ ok:true, brief });
      }
      // fallback if API hiccups
    }

    // Local fallback: add structure
    const brief = `Style: ${prompt}. BPM: 120-150. Key: minor. Arrangement: 8-bar intro, 16-bar verse, 8-bar hook.`;
    return NextResponse.json({ ok:true, brief });
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
