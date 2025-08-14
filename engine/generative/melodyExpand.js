import { mulberry32, randInt } from './prng.js';

const scale = { major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10] };
function snapToScale(n, root=60, mode='minor'){ const deg=scale[mode]; const o=Math.floor((n-root)/12); const rel=(n-root)%12; let best=deg[0]; let d=1e9;
  for (const s of deg){ const dd = Math.abs(s-rel); if (dd<d){d=dd; best=s;} }
  return root + o*12 + best;
}

export function expandMelody({ seed=777, bars=8, stepsPerBar=4,
  motif=[ {pitch:64,dur:1},{pitch:67,dur:1},{pitch:69,dur:2} ],
  mode='minor', root=60, intensity='med' }) {

  const r = mulberry32(seed);
  const out=[];

  const reps = intensity==='high'? 3 : intensity==='low'? 1 : 2;

  let t=0;
  for (let b=0;b<bars;b++){
    for (let k=0;k<reps;k++){
      const op = randInt(r,0,3);
      const tr = [-12,-7,-5,0,5,7,12][randInt(r,0,6)];

      motif.forEach((n,i)=>{
        let p = n.pitch;
        let d = n.dur;
        if (op===1) p = p + tr;
        if (op===2) p = (2*root - p) + (randInt(r,0,1)?12:0);
        if (op===3) d = Math.min(2, n.dur + (randInt(r,0,1)?1:0));

        p = snapToScale(p, root, mode);
        out.push({ t, dur:d, pitch:p, vel:80 + randInt(r,-10,10) });
        t += d;
      });
    }
    while (t < (b+1)*stepsPerBar) t += 1;
  }
  return { events: out, meta:{bars,stepsPerBar,root,mode} };
}
