export function parseKeyString(str="A minor"){
  const m = /([A-G][b#]?)[-\s]*(major|minor)/i.exec(str)||[];
  return { root: (m[1]||"A"), mode: (m[2]||"minor").toLowerCase() };
}

export function refToTargets(ref, fallback={bpm:140,key:"A minor",energy:"med"}) {
  const bpm = ref?.bpm || fallback.bpm;
  const key = ref?.key || fallback.key;
  const { root, mode } = parseKeyString(key);
  const energy = ref?.energy || fallback.energy;
  const structure = ref?.structure || ["intro","verse","chorus","verse","chorus","outro"];
  return { bpm, key, root, mode, energy, structure };
}

export function uiToEnergy(intensity="med"){
  const v = String(intensity).toLowerCase();
  return (v === "low" || v === "high") ? v : "med";
}
