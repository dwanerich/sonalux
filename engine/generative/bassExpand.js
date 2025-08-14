import { mulberry32, choice } from './prng.js';

const ROOT = 36;

export function expandBass({ seed=313, progression=['i','VI','VII','i'], stepsPerBar=4, bars=8, energy='med', keyRoot=ROOT }) {
  const r = mulberry32(seed);
  const dens = energy==='high'? 4 : energy==='low'? 2 : 3;
  const map = { 'i':0,'I':0,'ii':2,'II':2,'iii':4,'III':4,'iv':5,'IV':5,'v':7,'V':7,'vi':9,'VI':9,'vii':11,'VII':11 };

  const events=[]; let t=0;
  for (let b=0;b<bars;b++){
    const deg = map[progression[b % progression.length]] ?? 0;
    const root = keyRoot + deg;
    const pattern = [
      root,
      choice(r,[root+7, root+12]),
      root,
      choice(r,[root-1, root+2, root+5])
    ];

    for (let i=0;i<dens;i++){
      const p = pattern[i % pattern.length];
      events.push({ t: t + Math.floor(i*(stepsPerBar/dens)), dur: Math.max(1, Math.floor(stepsPerBar/dens)), pitch: p, vel: 96 });
    }
    t += stepsPerBar;
  }
  return { events, meta:{bars,stepsPerBar} };
}
