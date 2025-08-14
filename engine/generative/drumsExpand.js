import { mulberry32, randInt } from './prng.js';

function euclid(k,n){ const out=Array(n).fill(0); let p=0; for(let i=0;i<n;i++){p+=k; if(p>=n){p-=n; out[i]=1;} } return out;}

export function expandDrums({ bars=8, stepsPerBar=16, intensity='med', seed=123 }) {
  const r = mulberry32(seed);
  const n = bars*stepsPerBar;

  const kickHits = intensity==='high'? randInt(r,10,14) : intensity==='low'? randInt(r,4,7) : randInt(r,7,10);
  const snrHits  = intensity==='high'? randInt(r,8,12)  : intensity==='low'? randInt(r,4,6) : randInt(r,6,9);
  const hatHits  = intensity==='high'? randInt(r,28,36) : intensity==='low'? randInt(r,14,20): randInt(r,20,28);

  const K = euclid(kickHits, n);
  const S = euclid(snrHits,  n).map((v,i)=> (i%stepsPerBar===4||i%stepsPerBar===12) ? 1 : v);
  const H = Array(n).fill(0).map((_,i)=> (i%2===0?1:0));
  let hatExtra = hatHits - H.reduce((a,b)=>a+b,0);
  while (hatExtra-- > 0) { H[randInt(r,0,n-1)] = 1; }

  const ghosts=[];
  for (let b=0;b<bars;b++){
    const gPos=b*stepsPerBar + randInt(r,1,stepsPerBar-2);
    ghosts.push({t:gPos, vel:40});
  }

  const events=[];
  for (let i=0;i<n;i++){
    if (K[i]) events.push({ t:i, dur:1, pitch:'kick', vel:110 });
    if (S[i]) events.push({ t:i, dur:1, pitch:'snare', vel:105 });
    if (H[i]) events.push({ t:i, dur:1, pitch:'hat',   vel:80 + (i%4===0?10:0) });
  }
  ghosts.forEach(g=>events.push({ t:g.t, dur:1, pitch:'snare_ghost', vel:g.vel }));
  for (let j=n-4;j<n;j++) events.push({ t:j, dur:1, pitch:'tom', vel:90 });

  return { events, meta:{bars,stepsPerBar} };
}
