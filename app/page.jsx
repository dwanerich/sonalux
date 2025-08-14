'use client';

import { useState } from "react";

const FORCE_ENABLE = true;



/** SONALUX Theme Preview (safe to keep alongside main home) */
const DSP = [
  { title: 'Top Songs • Global', sub: 'Weekly Music Charts' },
  { title: 'Top 50 • Global', sub: 'Most played, daily' },
  { title: 'Rap Now', sub: 'Current rap heat' },
  { title: 'R&B Hits', sub: 'Warm melodies' },
  { title: 'Viral 50', sub: 'Most viral tracks' },
];

const ARTISTS = [
  { name: 'HELLA HANDY', tagline: 'Neo soul • nocturnal', img: '/images/artists/hella_handsy.png' },
  { name: 'DIE EMPTY', tagline: 'Dystopian trap wave', img: '/images/artists/die_empty.png' },
  { name: 'ANTI', tagline: 'Alt-pop shimmer', img: '/images/artists/anti.png' },
  { name: 'ANARCHY', tagline: 'Afro bounce & gold', img: '/images/artists/anarchy.png' },
  { name: 'MALARIA MILLIONS', tagline: 'EDM chrome', img: '/images/artists/malaria_millions.png' },
];

export default function ThemePage(){
  // state + submit handler
  const [file, setFile] = useState(null);
  const [genre, setGenre] = useState('trap');
  const [mood, setMood] = useState('dark');
  const [intensity, setIntensity] = useState('med');
  const [vocalPref, setVocalPref] = useState('none');
  const [status, setStatus] = useState('');
  async function onSubmit(e){
    e.preventDefault();
    if (!file) { alert('Pick a file'); return; }
    setStatus('Uploading…');
  
    try {
      const fd = new FormData();
      fd.append('audio', file);
      fd.append('genre', genre);
      fd.append('mood', mood);
      fd.append('intensity', intensity);
      fd.append('vocal_pref', vocalPref);
      fd.append('prompt', ''); // optional
  
      const res = await fetch('/api/generate', { method:'POST', body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Generate failed');
  
      setStatus('Done');
      const el = document.getElementById('site-player');
      if (el && json.finalMp3) 
        {
      // normalize to a public URL and attempt immediate playback (same user gesture)
      const url = json.finalMp3.startsWith('/') ? json.finalMp3 : `/${json.finalMp3.replace(/^\/+/, '')}`;
      el.src = url;
      el.load();
      try { await el.play(); } catch { /* autoplay may be blocked; controls will still work */ }
}

    } catch (err) {
      console.error(err);
      setStatus(err.message || 'Error');
    }
  }
  return (
    <section className="slx-snap">
      {/* Panel 1 — Hero */}
      <section className="slx-panel">
        <div className="slx-hero">
          <div className="slx-cover slx-hero-art" />
          <div>
            <div className="slx-sub">SONALUX</div>
            <h1 className="slx-title">REFORGE. <br />RE-IMAGINE. RELEASE-READY.</h1>
            <p style={{opacity:.75, marginTop:10, fontWeight:200}}>
              Style-Guided AI That Turns Uploads Into Releases.
            </p>
            <div style={{display:'flex', gap:10, marginTop:14}}>
              <a className="button" href="/">Use Generator</a>
              <a className="button" href="/bank">Open Bank</a>
            </div>
          </div>
        </div>
      </section>

      {/* Panel 2 — Create vibe (ENABLED) */}
<section className="slx-panel">
  <div className="slx-grid">
    <div className="slx-card">
      <div className="slx-sub">Create</div>
      <h2 className="slx-section">Upload • Genre • Mood • Intensity</h2>

      <form onSubmit={onSubmit} style={{ display:'grid', gap:10, marginTop:12 }}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10}}>
          <select value={genre} onChange={e=>setGenre(e.target.value)}>
            <option>trap</option><option>pop</option><option>rnb</option><option>afro</option><option>edm</option>
          </select>
          <select value={mood} onChange={e=>setMood(e.target.value)}>
            <option>dark</option><option>moody</option><option>hype</option><option>chill</option><option>bright</option>
          </select>
          <select value={intensity} onChange={e=>setIntensity(e.target.value)}>
            <option value="low">low</option><option value="med">med</option><option value="high">high</option>
          </select>
          <select value={vocalPref} onChange={e=>setVocalPref(e.target.value)}>
            <option value="none">none</option><option value="male">male</option>
            <option value="female">female</option><option value="duo">duo</option>
          </select>
        </div>

        <div style={{display:'flex', gap:10}}>
          <input
            className="input"
            type="file"
            accept="audio/*"
            onChange={e=>setFile(e.target.files?.[0] || null)}
          />
          <button className="button" type="submit">Generate</button>
        </div>

        <div className="slx-sub" style={{marginTop:6}}>{status}</div>
      </form>
    </div>

    <div className="slx-card">
      
      <div className="slx-sub">Preview</div>
      <h2 className="slx-section">Player</h2>
      <div className="slx-cover" style={{height:180, marginBottom:12}} />
      {/* Ensure this ID exists so we can set src from JS */}
      
      <audio id="site-player" controls style={{width:'100%'}} onContextMenu={e=>e.preventDefault()} />
    </div>
  </div>
<>
</> 
  
</section>


      {/* Panel 3 — Featured rails */}
      <section className="slx-panel">
        <div>
          <div className="slx-sub">Featured</div>
          <h2 className="slx-section" style={{marginBottom:16}}>Charts & Playlists</h2>
          <div className="slx-rail">
            {DSP.map((t, i)=>(
              <div key={i} className="slx-flat slx-tile">
                <div className="slx-cover" />
                <div style={{marginTop:8, fontWeight:700}}>{t.title}</div>
                <div style={{opacity:.65, fontSize:12}}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Panel 4 — Artist spotlights */}
      <section className="slx-panel">
        <div>
          <div className="slx-sub">Spotlight</div>
          <h2 className="slx-section" style={{marginBottom:16}}>Artists</h2>
          <div className="slx-rail">
            {ARTISTS.map((a, i)=>(
              <div key={i} className="slx-flat slx-artist">
                <div className="slx-cover" style={{
                  backgroundImage: a.img ? `url(${a.img})` : undefined,
                  backgroundSize:'cover', backgroundPosition:'center'
                }} />
                <div className="name">{a.name}</div>
                <div style={{opacity:.65, fontSize:12}}>{a.tagline}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Panel 5 — Packs + Bank link */}
      <section className="slx-panel">
        <div className="slx-grid">
          <div className="slx-card">
            <div className="slx-sub">Packs</div>
            <h2 className="slx-section">Branded Packs</h2>
            <div className="slx-rail">
              {[1,2,3,4,5,6].map(i=>(
                <div key={i} className="slx-flat" style={{minWidth:260}}>
                  <div className="slx-cover" style={{height:140}} />
                  <div style={{marginTop:8, fontWeight:700}}>Pack #{i}</div>
                  <div style={{opacity:.65, fontSize:12}}>genre • mood • curated</div>
                </div>
              ))}
            </div>
          </div>
          <div className="slx-card">
            <div className="slx-sub">Sound Bank</div>
            <h2 className="slx-section">Chop+Bop</h2>
            <p style={{opacity:.75}}>
              Every flip seeds the bank with loops & one-shots (openl3 + FAISS). Browse the collection, build packs, license your sound.
            </p>
            <div style={{display:'flex', gap:10, marginTop:10}}>
              <a className="button" href="/bank">Open Bank</a>
              <a className="button" href="/packs">Browse Packs</a>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
