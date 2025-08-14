
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';

export async function POST(req){
  try{
    const { session } = await req.json();
    if (!session) return NextResponse.json({ ok:false, error:'missing session' }, { status:400 });
    // For now, we emit a placeholder MIDI file; rendering requires Fluidsynth + SF2 which we'll wire later.
    const midiPath = path.join(process.cwd(), 'public', session, 'topline.mid');
    // Minimal empty Type-0 MIDI (header + single empty track):  MThd ... MTrk ... EndOfTrack
    const hex = '4d546864000000060000000001e04d54726b0000000400ff2f00';
    await writeFile(midiPath, Buffer.from(hex, 'hex'));
    return NextResponse.json({ ok:true, midi: session + '/topline.mid', note: 'MIDI stub created. To render, set FLUID_SF2 and we will wire Fluidsynth next.' });
  }catch(e){
    return NextResponse.json({ ok:false, error:String(e) }, { status:500 });
  }
}
