export function buildHarmony({ bars=8, stepsPerBar=4, progression=['i','VI','VII','i'], keyRoot=60, mode='minor' }) {
  const map = { 'i':0,'I':0,'ii':2,'II':2,'iii':4,'III':4,'iv':5,'IV':5,'v':7,'V':7,'vi':9,'VI':9,'vii':11,'VII':11 };
  const triad = (deg,minor=true)=> minor? [0,3,7].map(x=>x+deg) : [0,4,7].map(x=>x+deg);
  const events=[]; let t=0;
  for (let b=0;b<bars;b++){
    const deg = map[progression[b % progression.length]] ?? 0;
    const chord = triad(deg, mode==='minor').map(p=> keyRoot+p);
    chord.forEach(p=> events.push({ t, dur: stepsPerBar, pitch: p, vel: 64 }));
    t += stepsPerBar;
  }
  return { events, meta:{bars,stepsPerBar} };
}
