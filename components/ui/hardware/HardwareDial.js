'use client';

import React, { useEffect, useRef } from 'react';

/**
 * HardwareDial
 * - Wheel to change value (no passive warning; prevents page scroll while turning).
 * - Props:
 *   id, label, value, min, max, step, onChange, dialImage, tickImage, className
 * - Notes:
 *   • We attach the wheel listener with { passive:false } so preventDefault() is allowed.
 *   • Remove any old inline onWheel from where you render this (the component manages it).
 */
export default function HardwareDial({
  id,
  label,
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange = () => {},
  dialImage,   // required: src for the dial face
  tickImage,   // optional: src for tick marks/plate
  className
}) {
  const rootRef = useRef(null);
  const startYRef = useRef(0);
  const startValRef = useRef(value);
  const draggingRef = useRef(false);

  const clamp = (v) => Math.min(max, Math.max(min, v));
  const quantize = (v) => {
    const n = Math.round((v - min) / step) * step + min;
    return clamp(n);
  };

  // Wheel control — prevent page scroll while using the dial
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const handleWheel = (e) => {
      e.preventDefault(); // legal because passive:false below
      const delta = e.deltaY || 0;
      const dir = delta > 0 ? -1 : 1;    // invert if you prefer
      const next = quantize(value + dir * step);
      if (next !== value) onChange(next);
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [value, step, min, max, onChange]);

  // Optional: click/drag to adjust (vertical motion)
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onPointerDown = (e) => {
      draggingRef.current = true;
      startYRef.current = e.clientY ?? 0;
      startValRef.current = value;
      el.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!draggingRef.current) return;
      const dy = (startYRef.current - (e.clientY ?? startYRef.current)) || 0;
      // sensitivity: 40px per step (tweak as needed)
      const stepsMoved = Math.round(dy / 40);
      const next = quantize(startValRef.current + stepsMoved * step);
      if (next !== value) onChange(next);
    };

    const onPointerUp = (e) => {
      draggingRef.current = false;
      try { el.releasePointerCapture?.(e.pointerId); } catch {}
    };

    el.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [value, step, min, max, onChange]);

  // Optional visual rotation (if your CSS positions images on top of each other)
  // Map value range to -135..135 degrees for a knob arc
  const norm = (value - min) / (max - min || 1);
  const angle = -135 + norm * 270; // degrees

  return (
    <div
      ref={rootRef}
      id={id}
      className={className}
      style={{
        userSelect: 'none',
        touchAction: 'none', // helps with trackpads/touch devices
        position: 'relative',
        display: 'inline-block'
      }}
      aria-label={label || 'Dial'}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      {/* Tick plate (static) */}
      {tickImage && (
        <img
          src={tickImage}
          alt=""
          draggable={false}
          style={{ display: 'block', pointerEvents: 'none' }}
        />
      )}

      {/* Dial face (rotates) */}
      {dialImage && (
        <img
          src={dialImage}
          alt={label || ''}
          draggable={false}
          style={{
            position: tickImage ? 'absolute' : 'static',
            top: tickImage ? 0 : undefined,
            left: tickImage ? 0 : undefined,
            right: tickImage ? 0 : undefined,
            bottom: tickImage ? 0 : undefined,
            margin: 'auto',
            transform: `rotate(${angle}deg)`,
            transformOrigin: '50% 50%',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
}
