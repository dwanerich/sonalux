import React from "react";

/**
 * Minimal Diva/Minimal-Audio style preset strip.
 * Props:
 * - name: string
 * - onPrev, onNext, onSave, onAB, onOversample: callbacks
 * - abState: 'A' | 'B'
 * - oversample: 'LOW' | 'NORMAL' | 'HIGH'
 */
export default function PresetHeader({
  name = "Init",
  onPrev,
  onNext,
  onSave,
  onAB,
  onOversample,
  abState = "A",
  oversample = "NORMAL",
}) {
  const bar = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 14px",
    borderRadius: 12,
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
  };

  const btn = {
    height: 30,
    padding: "0 10px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e7e7e7",
    letterSpacing: ".04em",
    cursor: "pointer",
  };

  const seg = { display: "flex", alignItems: "center", gap: 8 };

  return (
    <div style={bar}>
      <div style={seg}>
        <button style={btn} onClick={onPrev} aria-label="Previous preset">
          ‹
        </button>
        <div
          style={{
            minWidth: 180,
            textAlign: "center",
            padding: "6px 12px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
          title={name}
        >
          {name}
        </div>
        <button style={btn} onClick={onNext} aria-label="Next preset">
          ›
        </button>
      </div>

      <div style={seg}>
        <button style={btn} onClick={onSave}>Save</button>
        <button style={btn} onClick={onAB}>
          A/B: {abState}
        </button>
        <button style={btn} onClick={onOversample}>
          OS: {oversample}
        </button>
      </div>
    </div>
  );
}
