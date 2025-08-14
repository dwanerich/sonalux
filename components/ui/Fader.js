// components/ui/Fader.js
'use client';


import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function Fader({
  value = 50,            // 0..100
  onChange,
  vertical = true,
  label = 'Mix',
  ariaLabel,
  min = 0,
  max = 100,
  trackSize = 200,       // px length of track
  thumbSize = 16,        // px
}) {
  const trackRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const clamp = (v) => Math.min(max, Math.max(min, v));

  const posToValue = useCallback((clientX, clientY) => {
    const rect = trackRef.current.getBoundingClientRect();
    let pct;
    if (vertical) {
      const y = clientY - rect.top;
      pct = 1 - (y / rect.height); // bottom=0, top=1
    } else {
      const x = clientX - rect.left;
      pct = x / rect.width;        // left=0, right=1
    }
    return clamp(Math.round(min + pct * (max - min)));
  }, [vertical, min, max]);

  useEffect(() => {
    const move = (e) => {
      if (!dragging || !trackRef.current) return;
      const isTouch = e.touches && e.touches.length;
      const p = isTouch ? e.touches[0] : e;
      onChange(posToValue(p.clientX, p.clientY));
    };
    const up = () => setDragging(false);

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [dragging, onChange, posToValue]);

  const pct = (value - min) / (max - min); // 0..1
  const thumbStyle = vertical
    ? { bottom: `calc(${pct * 100}% - ${thumbSize/2}px)` }
    : { left:   `calc(${pct * 100}% - ${thumbSize/2}px)` };

  return (
    <div className="faderRoot">
      <div className="faderHeader">
        <div className="faderLabel">{label}</div>
        <div className="faderReadout">{value}</div>
      </div>

      <div
        ref={trackRef}
        className={`faderTrack ${vertical ? 'is-vertical' : 'is-horizontal'}`}
        style={vertical ? { height: trackSize } : { width: trackSize }}
        role="slider"
        aria-label={ariaLabel || label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp'   || e.key === 'ArrowRight') onChange(clamp(value + 1));
          if (e.key === 'ArrowDown' || e.key === 'ArrowLeft')  onChange(clamp(value - 1));
          if (e.key === 'Home') onChange(min);
          if (e.key === 'End')  onChange(max);
        }}
        onMouseDown={(e) => { setDragging(true); onChange(posToValue(e.clientX, e.clientY)); }}
        onTouchStart={(e) => { setDragging(true); const t = e.touches[0]; onChange(posToValue(t.clientX, t.clientY)); }}
      >
        <div className="faderRail" />
        <div className="faderFill" style={vertical ? { height: `${pct * 100}%` } : { width: `${pct * 100}%` }} />
        <div className="faderThumb" style={{ ...thumbStyle, width: thumbSize, height: thumbSize }} />
      </div>
    </div>
  );
}
