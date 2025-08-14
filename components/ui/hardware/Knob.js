import React, { useEffect, useRef, useState } from "react";

/**
 * Hardware-like knob with vertical drag, inertia feel, dbl-click reset, keyboard fine-tune.
 * Props:
 * - value (0..1)
 * - onChange(next: number)
 * - size (px)
 * - label
 * - min=0, max=1, step=0.001, defaultValue=0.5
 * - src: optional PNG/SVG background (centered circle). If omitted, draws a simple knob.
 */
export default function Knob({
  value,
  onChange,
  size = 80,
  label,
  min = 0,
  max = 1,
  step = 0.001,
  defaultValue = 0.5,
  src,
}) {
  const ref = useRef(null);
  const [internal, setInternal] = useState(
    clamp(typeof value === "number" ? value : defaultValue, min, max)
  );
  const [dragging, setDragging] = useState(false);
  const start = useRef({ y: 0, v: internal });

  // controlled/uncontrolled sync
  useEffect(() => {
    if (typeof value === "number") setInternal(clamp(value, min, max));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (v) => {
    const next = quantize(clamp(v, min, max), step);
    setInternal(next);
    onChange && onChange(next);
  };

  const onPointerDown = (e) => {
    e.preventDefault();
    const y = getY(e);
    start.current = { y, v: internal };
    setDragging(true);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
  };

  const onPointerMove = (e) => {
    const dy = start.current.y - getY(e);
    // sensitivity ~ 0.004 per px, with slight acceleration
    const accel = Math.sign(dy) * Math.pow(Math.abs(dy) / 100, 1.05) * 0.25;
    const delta = dy * 0.004 + accel * 0.004;
    emit(start.current.v + delta);
  };

  const onPointerUp = () => {
    setDragging(false);
    window.removeEventListener("pointermove", onPointerMove);
  };

  const onDoubleClick = () => emit(defaultValue);

  const onKeyDown = (e) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      emit(internal + step * (e.shiftKey ? 10 : 1));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      emit(internal - step * (e.shiftKey ? 10 : 1));
    } else if (e.key.toLowerCase() === "r") {
      emit(defaultValue);
    }
  };

  // 300° travel (-150° .. +150°) for pointer line
  const angle = -150 + 300 * norm(internal, min, max);

  const wrapperStyle = {
    width: size,
    height: size + 18,
    userSelect: "none",
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    outline: "none",
  };

  const faceStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    position: "relative",
    background: src
      ? `center/contain no-repeat url(${src})`
      : "radial-gradient(circle at 30% 30%, #e7e7e9 0%, #8a8d93 55%, #4b4e52 100%)",
    boxShadow: dragging
      ? "0 10px 22px rgba(0,0,0,0.45)"
      : "0 6px 16px rgba(0,0,0,0.35)",
    cursor: "ns-resize",
  };

  const pointerStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: 2,
    height: size * 0.42,
    background: "#111",
    transformOrigin: "50% calc(100% - 2px)",
    transform: `translate(-50%, -100%) rotate(${angle}deg)`,
    borderRadius: 2,
  };

  const labelStyle = {
    marginTop: 8,
    fontSize: 12,
    letterSpacing: ".08em",
    color: "rgba(231,231,231,.9)",
    textTransform: "uppercase",
  };

  return (
    <div
      ref={ref}
      style={wrapperStyle}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onDoubleClick={onDoubleClick}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={internal}
      aria-label={label || "Knob"}
    >
      <div
        style={faceStyle}
        onPointerDown={onPointerDown}
        aria-hidden="true"
      >
        {!src && <div style={pointerStyle} />}
      </div>
      {label && <div style={labelStyle}>{label}</div>}
    </div>
  );
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}
function norm(v, a, b) {
  return (v - a) / (b - a || 1);
}
function quantize(v, step) {
  const s = step || 0.001;
  return Math.round(v / s) * s;
}
function getY(e) {
  if (e.touches && e.touches[0]) return e.touches[0].clientY;
  return e.clientY ?? 0;
}
