'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react';
import styles from './PlayerPanel.module.css';
import Waveform from './Waveform';
import EngravedLabel from './hardware/EngravedLabel';
import Led from './hardware/Led';
import panel2u from './hw/panel-2u.png';

export default forwardRef(function PlayerPanel(
  { src, title = 'Preview', startPaused = true, onEnded },
  ref
) {
  const audioRef = useRef(null);
  const rafRef = useRef(null);

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(!startPaused);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);

  const fmt = useMemo(
    () => (t) => {
      if (!Number.isFinite(t)) return '0:00';
      const m = Math.floor(t / 60);
      const s = Math.floor(t % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
    },
    []
  );

  // metadata & end events
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onLoaded = () => {
      setDuration(el.duration || 0);
      setReady(true);
    };
    const onEnd = () => {
      setPlaying(false);
      setCurrent(el.duration || 0);
      onEnded?.();
    };

    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('ended', onEnd);

    // kickoff initial settings
    el.volume = muted ? 0 : volume;

    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('ended', onEnd);
    };
  }, [onEnded, muted, volume]);

  // playback loop for smooth time updates
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const loop = () => {
      if (!seeking) setCurrent(el.currentTime || 0);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [seeking]);

  // respond to play/pause state
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [playing]);

  // respond to volume/mute
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.muted = muted;
    el.volume = muted ? 0 : volume;
  }, [muted, volume]);

  /* -------- controls -------- */
  const toggle = () => setPlaying((p) => !p);

  const stop = () => {
    const el = audioRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
    setCurrent(0);
  };

  const nudge = (delta) => {
    const el = audioRef.current;
    if (!el) return;
    const t = Math.max(0, Math.min((el.currentTime || 0) + delta, duration));
    el.currentTime = t;
    setCurrent(t);
  };

  const onSeekPercent = (percent) => {
    const el = audioRef.current;
    if (!el || !duration || !Number.isFinite(percent)) return;
    const next = Math.max(0, Math.min(duration * percent, duration));
    el.currentTime = next;
    setCurrent(next);
  };

  const volLabel = Math.round((muted ? 0 : volume) * 100);

  // expose an imperative API for external controls
  useImperativeHandle(
    ref,
    () => ({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      stop,
      forward: (sec = 5) => nudge(+Math.abs(sec)),
      backward: (sec = 5) => nudge(-Math.abs(sec)),
      get currentTime() {
        return current;
      },
      get duration() {
        return duration;
      },
    }),
    [current, duration]
  );

  return (
    <div
      className={styles.panel}
      style={{
        backgroundImage: panel2u ? `url(${panel2u.src || panel2u})` : undefined,
      }}
      aria-label="SonaLux Player Panel"
    >
      <div className={styles.headerRow}>
        <EngravedLabel text={title} />
        <div className={styles.statusGroup}>
          <span className={styles.statusText}>{ready ? 'READY' : 'LOADING'}</span>
          <Led on={playing} color={playing ? '#7CFF7C' : '#A1A1A1'} />
        </div>
      </div>

      <div className={styles.waveRow}>
        <Waveform
          src={src}
          height={84}
          currentTime={current}
          duration={duration}
          onSeekPercent={onSeekPercent}
          onPointerState={(s) => setSeeking(s === 'down' || s === 'drag')}
        />
      </div>

      <div className={styles.transportRow}>
        <div className={styles.timeBadge} aria-label="Current time">
          {fmt(current)} / {fmt(duration)}
        </div>

        <div className={styles.controls}>
          <button
            className={`${styles.btn} ${styles.alt}`}
            onClick={() => nudge(-5)}
            aria-label="Back 5 seconds"
          >
            ⏪ 5s
          </button>
          <button
            className={`${styles.btn} ${playing ? styles.active : ''}`}
            onClick={toggle}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '⏸' : '▶︎'}
          </button>
          <button
            className={`${styles.btn} ${styles.alt}`}
            onClick={() => nudge(5)}
            aria-label="Forward 5 seconds"
          >
            5s ⏩
          </button>
          <button
            className={`${styles.btn} ${styles.stop}`}
            onClick={stop}
            aria-label="Stop"
            title="Stop"
          >
            ■
          </button>
        </div>

        <div className={styles.volumeBlock}>
          <EngravedLabel text="OUTPUT" small />
          <div className={styles.volumeRow}>
            <button
              className={`${styles.muteBtn} ${muted ? styles.muted : ''}`}
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
            <input
              className={styles.fader}
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Volume"
            />
            <span className={styles.volPct}>{volLabel}%</span>
          </div>
        </div>
      </div>

      <audio ref={audioRef} src={src || ''} preload="metadata" />
    </div>
  );
});
