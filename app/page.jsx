'use client';

import dynamic from "next/dynamic";

// Browser-only bits (audio, drag/drop) → no-SSR
const RemixModule = dynamic(() => import("../components/ui/RemixModule"), {
  ssr: false,
});

// If you need this later, re-add it; leaving it out avoids unused-var linting
// const FORCE_ENABLE = true;

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

export default function ThemePage() {
  // Old form state/handler kept only for reference; remove if not needed
  /*
  import { useState } from "react";
  const [file, setFile] = useState(null);
  const [genre, setGenre] = useState('trap');
  const [mood, setMood] = useState('dark');
  const [intensity, setIntensity] = useState('med');
  const [vocalPref, setVocalPref] = useState('none');
  const [status, setStatus] = useState('');
  async function onSubmit(e) { ... }
  */

  return (
    <section className="slx-snap">
      {/* Panel 1 — Hero (unchanged; includes RemixModule like your snippet) */}
      <section className="slx-panel">
          {/* <RemixModule targetAudioSelector="#site-player" /> */}
        <div className="slx-hero">
          <div className="slx-cover slx-hero-art" />
          <div>
            <div className="slx-sub">SONALUX</div>
            <h1 className="slx-title">REFORGE. <br />RE-IMAGINE. RELEASE-READY.</h1>
            <p style={{ opacity: .75, marginTop: 10, fontWeight: 200 }}>
              Style-Guided AI That Turns Uploads Into Releases.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <a className="button" href="/">Use Generator</a>
              <a className="button" href="/bank">Open Bank</a>
            </div>
          </div>
        </div>
      </section>

      {/* Panel 2 — Create vibe (form swapped for RemixModule; layout intact) */}
      <section className="slx-panel">
        <div className="slx-grid">
          <div className="slx-card">
            <div className="slx-sub">Create</div>
            <h2 className="slx-section">Upload • Genre • Mood • Intensity</h2>

            {/* NEW: RemixModule replaces the old form and updates #site-player on success */}
            <RemixModule targetAudioSelector="#site-player" />

            {/* OLD FORM kept for reference (commented out) */}
            {/*
            <form onSubmit={onSubmit} style={{ display:'grid', gap:10, marginTop:12 }}>
              ... original selects + file input + button + status ...
            </form>
            */}
          </div>

          <div className="slx-card">
            <div className="slx-sub">Preview</div>
            <h2 className="slx-section">Player</h2>
            <div className="slx-cover" style={{ height: 180, marginBottom: 12 }} />
            {/* Ensure this ID exists so RemixModule can set src */}
            <audio
              id="site-player"
              controls
              style={{ width: '100%' }}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
      </section>

      {/* Panel 3 — Featured rails (unchanged) */}
      <section className="slx-panel">
        <div>
          <div className="slx-sub">Featured</div>
          <h2 className="slx-section" style={{ marginBottom: 16 }}>Charts & Playlists</h2>
          <div className="slx-rail">
            {DSP.map((t, i) => (
              <div key={i} className="slx-flat slx-tile">
                <div className="slx-cover" />
                <div style={{ marginTop: 8, fontWeight: 700 }}>{t.title}</div>
                <div style={{ opacity: .65, fontSize: 12 }}>{t.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Panel 4 — Artist spotlights (unchanged) */}
      <section className="slx-panel">
        <div>
          <div className="slx-sub">Spotlight</div>
          <h2 className="slx-section" style={{ marginBottom: 16 }}>Artists</h2>
          <div className="slx-rail">
            {ARTISTS.map((a, i) => (
              <div key={i} className="slx-flat slx-artist">
                <div
                  className="slx-cover"
                  style={{
                    backgroundImage: a.img ? `url(${a.img})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <div className="name">{a.name}</div>
                <div style={{ opacity: .65, fontSize: 12 }}>{a.tagline}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Panel 5 — Packs + Bank link (unchanged) */}
      <section className="slx-panel">
        <div className="slx-grid">
          <div className="slx-card">
            <div className="slx-sub">Packs</div>
            <h2 className="slx-section">Branded Packs</h2>
            <div className="slx-rail">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="slx-flat" style={{ minWidth: 260 }}>
                  <div className="slx-cover" style={{ height: 140 }} />
                  <div style={{ marginTop: 8, fontWeight: 700 }}>Pack #{i}</div>
                  <div style={{ opacity: .65, fontSize: 12 }}>genre • mood • curated</div>
                </div>
              ))}
            </div>
          </div>

          <div className="slx-card">
            <div className="slx-sub">Sound Bank</div>
            <h2 className="slx-section">Chop+Bop</h2>
            <p style={{ opacity: .75 }}>
              Every flip seeds the bank with loops & one-shots (openl3 + FAISS). Browse the collection, build packs, license your sound.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <a className="button" href="/bank">Open Bank</a>
              <a className="button" href="/packs">Browse Packs</a>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}
