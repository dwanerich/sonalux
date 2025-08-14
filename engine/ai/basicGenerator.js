import { matchReference } from '../../lib/matchRef.js';
import { refToTargets, uiToEnergy } from './featureTargets.js';
import { expandDrums } from '../generative/drumsExpand.js';
import { expandMelody } from '../generative/melodyExpand.js';
import { expandBass }   from '../generative/bassExpand.js';
import { buildHarmony } from '../generative/harmonyPads.js';
import { buildEnergyCurve, sectionGrid, progForMode } from './targetsExtras.js';
import { applyMatrix } from '../dsp/matrixRouter.js';

export async function basicGenerate({ detected, user }) {
  const genre  = user.genre || detected.genre || 'trap';
  const energy = uiToEnergy(user.intensity || 'med');

  // 1) reference → targets
  const ref     = matchReference(genre, user.mood, energy);
  const targets = refToTargets(ref);
  const progression = progForMode(targets.mode);

  // 2) section plan + energy curve
  const barsTotal = 8;            // keep fast and deterministic for MVP
  const stepsPerBar = 16;         // drum grid
  const beatsPerBar = 4;          // musical grid for melody/bass/pads
  const sections = sectionGrid(targets.structure, barsTotal);   // [{name,bars,tBars}]
  const curve    = buildEnergyCurve(targets.structure, targets.energy); // ['low'|'med'|'high',...]

  // helper converts curve value to intensity per section
  const secIntensity = (secName, idx) => (curve[idx] || 'med');

  // 3) generate per section and concatenate with time offsets
  const concatLayer = (genPerSection) => {
    const events = [];
    sections.forEach((sec, idx) => {
      const local = genPerSection(sec, idx) || { events: [] };
      const tOff = sec.tBars * (secGrid(local) === 'drum' ? stepsPerBar : beatsPerBar);
      for (const e of local.events) events.push({ ...e, t: e.t + tOff });
    });
    return { events, meta: { bars: barsTotal, stepsPerBar } };
  };

  const drums = concatLayer((sec, idx) =>
    expandDrums({ bars: sec.bars, stepsPerBar, intensity: secIntensity(sec.name, idx), seed: 101 + idx })
  );

  const pads = concatLayer((sec, idx) =>
    buildHarmony({
      bars: sec.bars, stepsPerBar: beatsPerBar,
      progression, keyRoot: keyToMidi(targets.root), mode: targets.mode
    })
  );

  const melody = concatLayer((sec, idx) =>
    expandMelody({
      bars: sec.bars, stepsPerBar: beatsPerBar,
      intensity: secIntensity(sec.name, idx), seed: 202 + idx,
      root: keyToMidi(targets.root), mode: targets.mode
    })
  );

  const bass = concatLayer((sec, idx) =>
    expandBass({
      bars: sec.bars, stepsPerBar: beatsPerBar,
      energy: secIntensity(sec.name, idx), seed: 303 + idx,
      keyRoot: keyToMidi(targets.root) - 24, progression
    })
  );

  // 4) pass through a tiny matrix to shape velocities/density by section
  const layered = applyMatrix({ drums, pads, melody, bass }, { sections, stepsPerBar });

  return { ok: true, ref, targets: { ...targets, progression, curve }, layers: layered };
}

// helpers
function keyToMidi(root){
  const map = { C:60,'C#':61,Db:61,D:62,'D#':63,Eb:63,E:64,F:65,'F#':66,Gb:66,G:67,'G#':68,Ab:68,A:69,'A#':70,Bb:70,B:71 };
  return map[root] ?? 60;
}
// crude classifier: drum grid vs beat grid
function secGrid(local){ return (local?.meta?.stepsPerBar || 16) >= 16 ? 'drum' : 'beat'; }
