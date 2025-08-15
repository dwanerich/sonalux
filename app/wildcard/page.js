'use client';

import { useState, useRef } from 'react';

export default function WildcardPage() {
  const [file, setFile] = useState(null);
  const [genre, setGenre] = useState('trap');
  const [mood, setMood]   = useState('glossy');
  const [intensity, setIntensity] = useState(72);
  const [wildcard, setWildcard]   = useState(true);
  const [moods, setMoods] = useState(['reforge']); // add 'joker-chip' to force
  const [status, setStatus] = useState('');
  const [result, setResult] = useState(null);
  const playingRef = useRef(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) { alert('Choose a file'); return; }

    setStatus('Uploading & processing…');
    setResult(null);

    const fd = new FormData();
    fd.append('file', file);
    fd.append('genre', genre);
    fd.append('mood', mood);
    fd.append('intensity', String(intensity));
    fd.append('wildcard', String(wildcard));
    fd.append('moods', moods.join(',')); // simple CSV

    const r = await fetch('/api/wildcard-upload', { method: 'POST', body: fd });
    const j = await r.json();
    if (!r.ok || !j.ok) {
      setStatus('Error: ' + (j.error || r.statusText));
      return;
    }
    setResult(j);
    setStatus('Done');
  }

  return (
    <div style={{ maxWidth: 720, margin: '40px auto', fontFamily: 'ui-sans-serif,system-ui' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Wildcard Test</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Upload audio → runFlip → Wildcard (drums MVP) → play the results.
      </p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <input type="file" accept="audio/*" onChange={e=>setFile(e.target.files?.[0] || null)} />

        <div style={{ display:'flex', gap:12 }}>
          <label>Genre <input value={genre} onChange={e=>setGenre(e.target.value)} /></label>
          <label>Mood <input value={mood} onChange={e=>setMood(e.target.value)} /></label>
        </div>

        <label>Intensity: {intensity}
          <input type="range" min="0" max="100" value={intensity}
                 onChange={e=>setIntensity(Number(e.target.value))} />
        </label>

        <label style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="checkbox" checked={wildcard} onChange={e=>setWildcard(e.target.checked)} />
          Wildcard
        </label>

        <label>Mood chips (comma):
          <input value={moods.join(',')} onChange={e=>setMoods(e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} />
        </label>

        <button type="submit" style={{ padding:'10px 14px', borderRadius:8 }}>
          Run Wildcard
        </button>
      </form>

      <div style={{ marginTop: 12, opacity: 0.8 }}>{status}</div>

      {result && (
        <div style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Results</h2>
          <div style={{ display:'grid', gap: 16, marginTop: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Base mix</div>
              {result.base?.finalMp3 && (
                <audio controls src={result.base.finalMp3} style={{ width: '100%' }} />
              )}
              <div style={{ fontSize:12, opacity:0.7 }}>{result.base?.finalMp3}</div>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Wildcard mix</div>
              {result.wild?.finalMp3 && (
                <audio controls src={result.wild.finalMp3} style={{ width: '100%' }} />
              )}
              <div style={{ fontSize:12, opacity:0.7 }}>{result.wild?.finalMp3}</div>
            </div>
          </div>

          {result.telemetry && (
            <div style={{ marginTop: 12, fontSize: 14 }}>
              <strong>Telemetry:</strong>{' '}
              Dominance {Math.round((result.telemetry.dominance||0)*100)}% ·
              Net Lift {(result.telemetry.netLift||0).toFixed(2)} ·
              Level {result.telemetry.wildcard?.level || '—'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
