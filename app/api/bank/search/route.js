import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function GET(req){
  try{
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') || 'any';
    const r = await fetch(`${process.env.SOUNDBANK_URL || 'http://127.0.0.1:8021'}/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`);
    const j = await r.json();
    return NextResponse.json(j);
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
