/**
 * Compute section cut points from a Style Guide ({sections}) and bpm_target.
 * Returns array of { name, start, duration } in seconds.
 */
export function computeSections(guide, totalSeconds){
  const bpm = guide?.bpm_target || 120;
  const barSec = 240 / bpm; // 4/4
  const seq = guide?.sections?.length ? guide.sections : [{name:'full', bars: Math.max(8, Math.floor((totalSeconds/barSec)))}];
  const timeline = [];
  let t = 0;
  for (const s of seq){
    const dur = (s.bars || 8) * barSec;
    if (t + dur > totalSeconds) { timeline.push({ name: s.name, start: t, duration: Math.max(0, totalSeconds - t) }); break; }
    timeline.push({ name: s.name, start: t, duration: dur });
    t += dur;
  }
  return timeline;
}
