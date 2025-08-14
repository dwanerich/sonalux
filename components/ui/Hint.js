import React, { useState } from "react";

export default function Hint({ label="i", children }) {
  const [open, setOpen] = useState(false);
  const dot = {
    width:18,height:18,borderRadius:"50%", display:"grid", placeItems:"center",
    background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.14)",
    color:"#e7e7e7", fontSize:12, cursor:"default", position:"relative"
  };
  const card = {
    position:"absolute", top:24, right:0, minWidth:180, maxWidth:260,
    padding:"10px 12px", borderRadius:10,
    background:"rgba(12,14,16,.96)", border:"1px solid rgba(255,255,255,.12)",
    boxShadow:"0 10px 24px rgba(0,0,0,.35)", fontSize:12, lineHeight:1.45,
    zIndex:5, pointerEvents:"none", opacity:open?1:0, transform:`translateY(${open?0:4}px)`,
    transition:"opacity .12s ease, transform .12s ease"
  };
  return (
    <div
      style={dot}
      onMouseEnter={()=>setOpen(true)}
      onMouseLeave={()=>setOpen(false)}
      aria-label="Help"
    >
      {label}
      <div style={card}>{children}</div>
    </div>
  );
}
