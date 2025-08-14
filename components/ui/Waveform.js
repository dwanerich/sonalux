'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Waveform with playhead + click/drag seek.
 * Props:
 *  - src | url: audio source (string)
 *  - height: canvas height in px (default 64)
 *  - currentTime: number (sec)
 *  - duration: number (sec)
 *  - onSeekPercent: fn(percent: 0..1)
 *  - onPointerState: fn('down'|'drag'|'up') optional
 */
export default function Waveform({
  src,
  url,
  height = 64,
  currentTime = 0,
  duration = 0,
  onSeekPercent,
  onPointerState,
}) {
  const canvasRef = useRef(null);
  const offscreenRef = useRef(null);
  const [waveReady, setWaveReady] = useState(false);
  const audioSrc = src || url;

  // 1) Pre-render the waveform bars once to an offscreen canvas
  useEffect(() => {
    let cancelled = false;
    if (!audioSrc || typeof window === 'undefined') return;

    const AC = window.AudioContext || window.webkitAudioContext;
    const ac = new AC();

    (async () => {
      try {
        const res = await fetch(audioSrc, { cache: 'no-store' });
        const buf = await res.arrayBuffer();
        const audio = await ac.decodeAudioData(buf);
        if (cancelled) return;

        const container = canvasRef.current?.parentElement;
        const width = container ? Math.floor(container.clientWidth) : 600;
        const h = height;

        // offscreen canvas to cache waveform
        const off = document.createElement('canvas');
        off.width = width;
        off.height = h;
        const octx = off.getContext('2d');

        const data = audio.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = h / 2;

        // background
        octx.fillStyle = '#0d0e11';
        octx.fillRect(0, 0, width, h);

        // static bars (unplayed)
        octx.fillStyle = 'rgba(255,255,255,0.2)';
        for (let i = 0; i < width; i++) {
          let min = 1.0, max = -1.0;
          for (let j = 0; j < step; j++) {
            const v = data[i * step + j] ?? 0;
            if (v < min) min = v;
            if (v > max) max = v;
          }
          const y = (1 + min) * amp;
          const heightPx = Math.max(1, (max - min) * amp);
          octx.fillRect(i, y, 1, heightPx);
        }

        offscreenRef.current = off;
        setWaveReady(true);
      } catch {
        setWaveReady(false);
      } finally {
        ac.close();
      }
    })();

    return () => {
      cancelled = true;
      ac.close();
    };
  }, [audioSrc, height]);

  // 2) Draw composed frame (cached waveform + progress overlay + playhead)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    const width = parent ? Math.floor(parent.clientWidth) : 600;
    const h = height;
    canvas.width = width;
    canvas.height = h;

    const ctx = canvas.getContext('2d');

    // base: cached waveform if ready
    if (offscreenRef.current) {
      ctx.drawImage(offscreenRef.current, 0, 0);
    } else {
      // fallback baseline
      ctx.fillStyle = '#0d0e11';
      ctx.fillRect(0, 0, width, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(width, h / 2);
      ctx.stroke();
    }

    // progress overlay
    if (duration > 0 && Number.isFinite(currentTime)) {
      const pct = Math.max(0, Math.min(currentTime / duration, 1));
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(124,255,124,0.9)');
      grad.addColorStop(1, 'rgba(59,185,59,0.6)');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = grad;
      ctx.globalAlpha = 0.45;
      ctx.fillRect(0, 0, Math.floor(width * pct), h);
      ctx.globalAlpha = 1;

      // playhead
      const x = Math.floor(width * pct);
      ctx.strokeStyle = 'rgba(124,255,124,0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
  }, [currentTime, duration, height, waveReady]);

  // 3) Pointer handling for seek
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onSeekPercent) return;

    let dragging = false;

    const pctFromEvent = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX ?? (e.touches?.[0]?.clientX || 0)) - rect.left;
      return Math.max(0, Math.min(x / rect.width, 1));
    };

    const down = (e) => {
      dragging = true;
      onPointerState?.('down');
      onSeekPercent(pctFromEvent(e));
    };
    const move = (e) => {
      if (!dragging) return;
      onPointerState?.('drag');
      onSeekPercent(pctFromEvent(e));
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      onPointerState?.('up');
    };

    canvas.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);

    canvas.addEventListener('touchstart', down, { passive: true });
    window.addEventListener('touchmove', move, { passive: true });
    window.addEventListener('touchend', up);

    return () => {
      canvas.removeEventListener('mousedown', down);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);

      canvas.removeEventListener('touchstart', down);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [onSeekPercent, onPointerState]);

  return (
    <div style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height, display: 'block', borderRadius: 10 }}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration || 0}
        aria-valuenow={currentTime || 0}
        aria-label="Waveform seek slider"
      />
    </div>
  );
}
