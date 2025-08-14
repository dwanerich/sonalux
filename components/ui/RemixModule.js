'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './RemixModule.module.css';

// Hardware / accents (visuals)
import panel2u from './hw/panel-2u.png';
import dialMain from './hw/dial.png';
import dialTicks from './hw/dial-9.png';
import xfadePng from './hw/crossfader.png';

import RackPanel from './hardware/RackPanel';
import HardwareDial from './hardware/HardwareDial';
import CrossFader from './hardware/CrossFader';
import Led from './hardware/Led';
import EngravedLabel from './hardware/EngravedLabel';
import ToggleMini from './hardware/ToggleMini';

// Optional in-module player (ok to keep)
import ReactH5AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
// If Waveform isn’t in your project yet, you can comment the import and its usage.
// import Waveform from './Waveform';

/* Canonical options to mirror the Home form */
const FORM_GENRES = ['trap', 'pop', 'rnb', 'afro', 'edm'];
const FORM_MOODS = ['dark', 'moody', 'hype', 'chill', 'bright'];
const FORM_INTENSITIES = ['low', 'med', 'high'];
const FORM_VOCALS = ['none', 'male', 'female', 'duo'];

/* Helpers */
function derivePeaksFromPreview(previewPath) {
  if (!previewPath) return null;
  const i = previewPath.lastIndexOf('.');
  return i > -1 ? `${previewPath.slice(0, i)}.json` : null;
}

export default function RemixModule({ targetAudioSelector = '#site-player' }) {
  // Form state (exactly like the new Home form)
  const [file, setFile] = useState(null);
  const [genre, setGenre] = useState('trap');
  const [mood, setMood] = useState('dark');
  const [intensity, setIntensity] = useState('med');
  const [vocalPref, setVocalPref] = useState('none');
  const [prompt, setPrompt] = useState('');

  // Visual controls (not required by API, but kept for UI)
  const [remixPower, setRemixPower] = useState(60);
  const [tone, setTone] = useState(0);
  const [width, setWidth] = useState(75);
  const [wildcards, setWildcards] = useState(false);

  // Status & preview
  const [status, setStatus] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [peaksUrl, setPeaksUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // Player refs (for in-module preview)
  const playerRef = useRef(null);
  const [audioEl, setAudioEl] = useState(null);
  useEffect(() => {
    setAudioEl(playerRef.current?.audio?.current || null);
  }, [previewUrl]);

  /* Drag & drop */
  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.[0]) setFile(e.dataTransfer.files[0]);
  };
  const onDragOver = (e) => e.preventDefault();

  /* Submit to /api/generate (new form behavior) */
  const doGenerate = async () => {
    if (!file) {
      alert('Pick a file');
      return;
    }
    setLoading(true);
    setError(null);
    setStatus('Uploading…');
    setPreviewUrl(null);
    setPeaksUrl(null);

    try {
      const fd = new FormData();
      fd.append('audio', file);
      fd.append('genre', genre);
      fd.append('mood', mood);
      fd.append('intensity', intensity);
      fd.append('vocal_pref', vocalPref);
      fd.append('prompt', prompt || '');

      const res = await fetch('/api/generate', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Generate failed');
      }

      setStatus('Done');

      if (json.finalMp3) {
        const url = json.finalMp3.startsWith('/')
          ? json.finalMp3
          : `/${json.finalMp3.replace(/^\/+/, '')}`;

        // in-module preview
        setPreviewUrl(url);
        setPeaksUrl(derivePeaksFromPreview(url));

        // update external site player
        const ext = document.querySelector(targetAudioSelector);
        if (ext) {
          ext.src = url;
          ext.load();
          try {
            await ext.play();
          } catch {
            /* autoplay may be blocked */
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Error');
      setStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    await doGenerate();
  };

  /* Mood chip (visual mirror of the select) */
  const MoodChip = ({ value }) => {
    const active = mood === value;
    return (
      <button
        type="button"
        className={`${styles.moodChip} ${active ? styles.moodChipActive : ''}`}
        onClick={() => setMood(value)}
        aria-pressed={active}
      >
        {value}
      </button>
    );
  };

  return (
    <div className={styles.virtualModulePanel}>
      <RackPanel
        backgroundSrc={panel2u?.src || ''}
        className={styles.fullPanelShell}
        innerClassName={styles.fullPanelInner}
        padding="16px 18px"
      >
        {/* Prompt */}
        <section className={styles.promptRow}>
          <label className={styles.inputLabel}>Remix Prompt</label>

          <div className={styles.statusTools}>
            <div className={styles.statusLeds}>
              <Led on={status === 'Done'} color="#6BFF93" />
              <Led on={!!loading} color="#00E5FF" />
              <Led on={false} color="#FFD166" />
              <Led on={!!error} color="#FF6B6B" />
            </div>

            <div className={styles.statusToggle}>
              <ToggleMini value={wildcards} onChange={setWildcards} />
              <span className={styles.statusToggleLabel}>Wildcards</span>
            </div>
          </div>

          <textarea
            className={styles.virtualTextarea}
            placeholder="Describe the vibe, references, and any must-hit moments..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
          />
        </section>

        {/* Selects (mirror Home form exactly) */}
        <section className={styles.row3}>
          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>Genre</label>
            <select
              className={styles.select}
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              {FORM_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>Mood</label>
            <select
              className={styles.select}
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            >
              {FORM_MOODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>Intensity</label>
            <select
              className={styles.select}
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
            >
              {FORM_INTENSITIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>Vocals</label>
            <select
              className={styles.select}
              value={vocalPref}
              onChange={(e) => setVocalPref(e.target.value)}
            >
              {FORM_VOCALS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Mood chips (single-select visual sugar) */}
        <section className={styles.moodFrame}>
          <div className={styles.moodHeader}>Moods</div>
          <div className={styles.moodWrap}>
            {FORM_MOODS.map((m) => (
              <MoodChip key={m} value={m} />
            ))}
          </div>
        </section>

        {/* Knobs — keep visuals/UX */}
        <section className={styles.knobRow}>
          <div className={styles.knobCell}>
            <HardwareDial
              id="remixPower"
              label="Remix Power"
              value={remixPower}
              min={0}
              max={100}
              step={1}
              onChange={setRemixPower}
              dialImage={dialMain?.src}
              tickImage={dialTicks?.src}
            />
            <EngravedLabel>Remix Power</EngravedLabel>
          </div>

          <div className={styles.knobCell}>
            <HardwareDial
              id="tone"
              label="Tone"
              value={tone}
              min={-50}
              max={50}
              step={1}
              onChange={setTone}
              dialImage={dialMain?.src}
              tickImage={dialTicks?.src}
            />
            <EngravedLabel>Tone</EngravedLabel>
          </div>

          <div className={styles.knobCell}>
            <HardwareDial
              id="width"
              label="Width"
              value={width}
              min={0}
              max={100}
              step={1}
              onChange={setWidth}
              dialImage={dialMain?.src}
              tickImage={dialTicks?.src}
            />
            <EngravedLabel>Width</EngravedLabel>
          </div>
        </section>

        {/* Crossfader + Generate */}
        <section className={styles.faderBar}>
          <div className={styles.crossfaderContainer}>
            <div className={styles.crossfaderInner}>
              <CrossFader imageSrc={xfadePng?.src} />
            </div>
          </div>
          <button
            type="button"
            className={styles.genBtn}
            disabled={!!loading}
            onClick={onSubmit}
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </section>

        {/* File + Status + (optional) in-module player */}
        <form onSubmit={onSubmit} className={styles.formGrid}>
          <div className={styles.fullRow} onDrop={onDrop} onDragOver={onDragOver}>
            <div
              className={styles.virtualDropzone}
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? <p>{file.name}</p> : <p>Drop audio here or click to browse</p>}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={(e) => setFile(e.target?.files?.[0] || null)}
              />
            </div>
          </div>

          <div
            className={styles.actionRow}
            style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}
          >
            <div>
              {error && <span className={styles.errorText}>{error}</span>}
              {status && (
                <span className={styles.statusText} style={{ marginLeft: 8 }}>
                  {status}
                </span>
              )}
            </div>

            {previewUrl && (
              <>
                <ReactH5AudioPlayer
                  key={previewUrl}
                  ref={playerRef}
                  src={previewUrl}
                  autoPlayAfterSrcChange={false}
                  customAdditionalControls={[]}
                  showSkipControls={false}
                  style={{ width: '100%', borderRadius: 12 }}
                />
                {/* If Waveform exists in your project, uncomment this block
                {peaksUrl && (
                  <div style={{ marginTop: 6, width: '100%' }}>
                    <Waveform jsonUrl={peaksUrl} audioRef={{ current: audioEl }} height={64} />
                  </div>
                )} */}
              </>
            )}
          </div>
        </form>
      </RackPanel>
    </div>
  );
}
