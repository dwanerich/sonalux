import React from "react";

/** values: 'LOW' | 'NORMAL' | 'HIGH' */
export default function QualityRocker({ value="NORMAL", onChange }) {
  const wrap = {
    display:"flex", alignItems:"center", gap:10,
    padding:"8px 10px", borderRadius:12,
    border:"1px solid rgba(255,255,255,.14)",
    background:"radial-gradient(140% 140% at 20% 0%, rgba(45,55,62,.35), rgba(20,25,29,.9))",
    boxShadow:"inset 0 0 0 1px rgba(0,0,0,.35), 0 8px 18px rgba(0,0,0,.35)"
  };
  const opt = (k)=>({
    padding:"6px 10px", borderRadius:8,
    background: value===k ? "rgba(120,200,255,.25)" : "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.14)",
    color:"#e7e7e7", cursor:"pointer", letterSpacing:".06em",
    boxShadow: value===k ? "0 0 10px rgba(120,200,255,.45)" : "none"
  });
  return (
    <div style={wrap} role="radiogroup" aria-label="Quality">
      {["LOW","NORMAL","HIGH"].map(k=>(
        <button key={k} style={opt(k)} onClick={()=>onChange?.(k)} aria-pressed={value===k}>
          {k}
        </button>
      ))}
    </div>
  );
}
