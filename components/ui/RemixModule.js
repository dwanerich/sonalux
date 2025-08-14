'use client';

import React, { useRef, useState, useEffect } from 'react';
import styles from './RemixModule.module.css';

import MoodBank from './MoodBank';
import { GENRES } from '../../lib/constants/genres';
import { VOCALS } from '../../lib/constants/vocals';
import { ENERGIES } from '../../lib/constants/energies';

// Hardware / accents (keep if you’ve got these components+assets in the repo)
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

// Player + waveform
import ReactH5AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import Waveform from './Waveform';
import PlayerPanel from './PlayerPanel';


/* ---------------- helpers ---------------- */

async function safeFetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('application/json')) {
    const text = await res.text().catch(() => '');
    const snippet = text.slice(0, 200);
    throw new Error(`${res.status} ${res.statusText} - non-JSON response: ${snippet}`);
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || `${res.status} ${res.statusText}`);
  return json;
}

function derivePeaksFromPreview(previewPath) {
  if (!previewPath) return null;
  const i = previewPath.lastIndexOf('.');
  return i > -1 ? `${previewPath.slice(0, i)}.json` : null;
}

/* ========================================================= */

export default function RemixModule() {
  // form state
  const [prompt, setPrompt] = useState('');
  const [moods, setMoods] = useState([]);
  const [genre, setGenre] = useState((GENRES && GENRES[0]) || 'Trap');
  const [vocal, setVocal] = useState((VOCALS && VOCALS[0]) || 'No Vocals');
  const [energy, setEnergy] = useState((ENERGIES && ENERGIES[1]) || 'Medium');
  const [file, setFile] = useState(null);

  // knobs
  const [remixPower, setRemixPower] = useState(60);
  const [tone, setTone] = useState(0);
  const [width, setWidth] = useState(75);
  const [wildcards, setWildcards] = useState(false);

  // job + ui status
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [pipeline, setPipeline] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [peaksUrl, setPeaksUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fileInputRef = useRef(null);

  // player refs
  const playerRef = useRef(null);
  const [audioEl, setAudioEl] = useState(null);
  useEffect(() => {
    // grab the underlying <audio> element so Waveform can control it
    setAudioEl(playerRef.current?.audio?.current || null);
  }, [previewUrl]);

  /* ---------------- drag/drop ---------------- */
  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.[0]) setFile(e.dataTransfer.files[0]);
  };
  const onDragOver = (e) => e.preventDefault();

  /* ---------------- core submit ---------------- */
  const doSubmit = async () => {
    setLoading(true);
    setError(null);
    setStatus('Submitting…');
    setPipeline('');
    setPreviewUrl(null);
    setPeaksUrl(null);

    try {
      let activeJobId = jobId;

      // 1) If a new file is present and we don't have a job yet, ingest it.
      if (file && !activeJobId) {
        const fd = new FormData();
        fd.append('file', file);
        // (optionally) pass user selections to tag the asset
        fd.append('genre', genre);
        fd.append('energy', energy);
        fd.append('vocals', vocal);
        fd.append('moods', JSON.stringify(moods));

        setStatus('Uploading…');
        const ingestJson = await safeFetchJson('/api/ingest', { method: 'POST', body: fd });
        activeJobId = ingestJson?.jobId;
        setJobId(activeJobId);
      }

      // 2) Compose (text-only if no file/job; Demucs remix if job exists server-side)
      setStatus('Composing…');
      const body = {
        jobId: activeJobId || undefined,
        prompt,
        genre,
        moods,
        energy,
        vocals: vocal,
        remixPower,
        tone,
        width,
        wildcards,
      };

      const compJson = await safeFetchJson('/api/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (compJson.previewPath) {
        setPreviewUrl(compJson.previewPath);
        setPeaksUrl(compJson.peaksPath || derivePeaksFromPreview(compJson.previewPath));
        const dur = compJson.durationSec != null ? `${Math.round(compJson.durationSec)}s` : '';
        setStatus(`${compJson.pipeline || 'Preview ready'}${dur ? ` • ${dur}` : ''}`);
      } else {
        setStatus('Preview ready');
      }
      setPipeline(compJson.pipeline || '');
    } catch (err) {
      console.error(err);
      setError(err?.message || 'Something went wrong');
      setStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    await doSubmit();
  };

  /* ---------------- render ---------------- */
  return (
    <div className={styles.virtualModulePanel}>
      <RackPanel
        backgroundSrc={panel2u?.src || ''}
        className={styles.fullPanelShell}
        innerClassName={styles.fullPanelInner}
        padding="16px 18px"
      >
        {/* PROMPT */}
        <section className={styles.promptRow}>
          <label className={styles.inputLabel}>Remix Prompt</label>

          <div className={styles.statusTools}>
            <div className={styles.statusLeds}>
              <Led on={status === 'Preview ready'} color="#6BFF93" />
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

        {/* Selectors */}
        <section className={styles.row3}>
          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>Genre</label>
            <select className={styles.select} value={genre} onChange={(e) => setGenre(e.target.value)}>
              {(GENRES || []).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>Vocals</label>
            <select className={styles.select} value={vocal} onChange={(e) => setVocal(e.target.value)}>
              {(VOCALS || []).map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className={styles.selectGroup}>
            <label className={styles.inputLabel}>Energy</label>
            <select className={styles.select} value={energy} onChange={(e) => setEnergy(e.target.value)}>
              {(ENERGIES || []).map((en) => (
                <option key={en} value={en}>{en}</option>
              ))}
            </select>
          </div>
        </section>

        {/* Moods */}
        <section className={styles.moodFrame}>
          <div className={styles.moodHeader}>Moods</div>
          <MoodBank
            value={moods}
            onChange={setMoods}
            classes={{ wrap: styles.moodWrap, chip: styles.moodChip, active: styles.moodChipActive }}
          />
        </section>

        {/* Knobs */}
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
            onClick={doSubmit}
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </section>

        {/* File + Status + Player */}
        <form onSubmit={onSubmit} className={styles.formGrid}>
          <div className={styles.fullRow} onDrop={onDrop} onDragOver={onDragOver}>
            <div
              className={styles.virtualDropzone}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
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

          <div className={styles.actionRow} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div>
              {error && <span className={styles.errorText}>{error}</span>}
              {status && <span className={styles.statusText} style={{ marginLeft: 8 }}>{status}</span>}
              {pipeline && <span className={styles.statusText} style={{ marginLeft: 8 }}>({pipeline})</span>}
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
                {peaksUrl && (
                  <div style={{ marginTop: 6, width: '100%' }}>
                    <Waveform jsonUrl={peaksUrl} audioRef={{ current: audioEl }} height={64} />
                  </div>
                )}
              </>
            )}
          </div>
        </form>
      </RackPanel>
    </div>
  );
}
