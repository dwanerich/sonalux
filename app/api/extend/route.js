
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { sh } from '../../../../engine/utils/shell.js';

async function loadGuideFromSessionPub(sessionPubPath){
  const sessionDir = path.join(process.cwd(), 'public', sessionPubPath);
  const reportPath = path.join(sessionDir, 'report.json');
  const j = JSON.parse(await readFile(reportPath, 'utf8'));
  const rsgId = j.rsg_id || 'trap:dark:v1';
  const [g,m] = rsgId.split(':');
  const guidePath = path.join(process.cwd(), 'refbank', 'guides', `${g}_${m}_v1.json`);
  const guide = JSON.parse(await readFile(guidePath, 'utf8'));
  return { guide, sessionDir, report: j };
}

export async function POST(req){
  try{
    const { session, bars = 8 } = await req.json();
    if (!session) return NextResponse.json({ ok:false, error:'missing session' }, { status:400 });
    const { guide, sessionDir } = await loadGuideFromSessionPub(session);
    const bpm = guide?.bpm_target || 120;
    const barSec = 240 / bpm;
    const extSec = Math.max(1, Math.floor(barSec * bars));

    const final = path.join(sessionDir, 'final.wav');
    const finalNorm = path.join(sessionDir, 'final_norm.wav');
    const base = await (async()=>{ try{ await readFile(finalNorm); return finalNorm; } catch{ return final; }})();

    const { out:durStr } = await sh('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nk=1:nw=1', base]);
    const dur = Math.max(0, Math.floor(parseFloat((durStr||'0').trim())));
    const start = Math.max(0, dur - extSec);

    const tail = path.join(sessionDir, 'tail.wav');
    await sh('ffmpeg', ['-y','-i', base, '-ss', String(start), '-t', String(extSec), '-c:a','pcm_s16le', tail]);

    const concatList = path.join(sessionDir, 'concat_extend.txt');
    const extPre = path.join(sessionDir, 'final_pre_ext.wav');
    await writeFile(concatList, `file '${base}'\nfile '${tail}'\n`);
    await sh('ffmpeg', ['-y','-f','concat','-safe','0','-i', concatList, '-c','copy', extPre]);

    const finalExt = path.join(sessionDir, 'final_ext.wav');
    const I = guide?.mix_targets?.lufs_i ?? -12;
    const TP = guide?.mix_targets?.true_peak_db ?? -1.0;
    await sh('ffmpeg', ['-y','-i', extPre, '-filter:a', `loudnorm=I=${I}:TP=${TP}:LRA=7,alimiter=limit=${Math.min(0.89, 10 ** (TP/20))}`, '-c:a','pcm_s16le', finalExt]);
    const finalMp3 = path.join(sessionDir, 'final_ext.mp3');
    await sh('ffmpeg', ['-y','-i', finalExt, '-c:a','libmp3lame','-q:a','2', finalMp3]);

    return NextResponse.json({ ok:true, finalWav: session + '/final_ext.wav', finalMp3: session + '/final_ext.mp3' });
  }catch(e){
    console.error(e);
    return NextResponse.json({ ok:false, error:String(e.message||e) }, { status:500 });
  }
}
