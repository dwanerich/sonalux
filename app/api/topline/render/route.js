
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { sh } from '../../../../../engine/utils/shell.js';

export async function POST(req){
  try{
    const form = await req.formData();
    const mid = form.get('midi');
    const session = String(form.get('session')||'');
    if (!mid || !session) return NextResponse.json({ ok:false, error:'missing midi or session' }, { status:400 });
    if (!process.env.FLUID_SF2) return NextResponse.json({ ok:false, error:'FLUID_SF2 not set' }, { status:500 });

    const buf = Buffer.from(await mid.arrayBuffer());
    const midPath = path.join(process.cwd(), 'public', session, 'user_topline.mid');
    await writeFile(midPath, buf);

    const outWav = path.join(process.cwd(), 'public', session, 'user_topline.wav');
    await sh('python', ['services/adapters/resynth_fluidsynth.py','--sf2', process.env.FLUID_SF2, '--mid', midPath, '--out', outWav]);

    // simple mix on top of final.wav
    const final = path.join(process.cwd(), 'public', session, 'final.wav');
    const finalTop = path.join(process.cwd(), 'public', session, 'final_topline.wav');
    await sh('ffmpeg', ['-y','-i', final, '-i', outWav, '-filter_complex','amix=inputs=2:normalize=0,alimiter=limit=0.89','-c:a','pcm_s16le', finalTop]);
    const mp3 = path.join(process.cwd(), 'public', session, 'final_topline.mp3');
    await sh('ffmpeg', ['-y','-i', finalTop, '-c:a','libmp3lame','-q:a','2', mp3]);

    return NextResponse.json({ ok:true, finalWav: session + '/final_topline.wav', finalMp3: session + '/final_topline.mp3' });
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e.message||e) }, { status:500 });
  }
}
