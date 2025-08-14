
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
// import Asset from '../../../../lib/models/Asset.js';
// import Pack from '../../../../lib/models/Pack.js';

async function buildFromMeta(){
  try{
    const metaPath = path.join(process.cwd(), 'public', 'bank', 'bank_meta.jsonl');
    const lines = (await readFile(metaPath, 'utf8')).trim().split('\n').filter(Boolean);
    const items = lines.map(l=>{ try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    // quick group by rsg_id
    const group = {};
    for (const it of items){
      const rsg = (it.tags||[]).find(t=>t.includes(':')) || 'misc:misc:v1';
      group[rsg] ||= []; group[rsg].push(it);
    }
    const packs = Object.entries(group).map(([rsg, arr], i)=>({
      slug: rsg.replace(/[:]/g,'-'),
      title: rsg.toUpperCase().replace(/[:]/g,' • '),
      rsg_id: rsg,
      cover: `/images/packs/${rsg.replace(/[:]/g,'-')}.png`,
      items: arr.slice(0,48)
    }));
    return packs;
  }catch{
    return [];
  }
}

export async function GET(){
  try{
    const packs = await buildFromMeta();
    return NextResponse.json({ ok:true, packs });
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
