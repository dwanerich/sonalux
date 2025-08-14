export async function analyzeAudio(file) {
  // TODO: replace with real analysis/separation
  return {
    bpm: 140,
    key: 'A minor',
    genre: 'trap',
    sections: [{ t0:0, t1:8, role:'intro' }, { t0:8, t1:40, role:'verse' }],
    stems: null
  };
}
