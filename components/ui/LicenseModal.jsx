'use client';


import React from "react";

export default function LicenseModal({ open, onClose, onPurchase }) {
  if (!open) return null;
  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", display:"grid", placeItems:"center", zIndex:9999}}>
      <div style={{background:"#111", color:"#fff", padding:24, borderRadius:16, width:420}}>
        <h3 style={{marginTop:0}}>License required</h3>
        <p>To export HQ audio, purchase a commercial license or upgrade to Pro.</p>
        <div style={{display:"flex", gap:12, marginTop:16}}>
          <button onClick={onPurchase} style={{flex:1, padding:"10px 14px"}}>Purchase</button>
          <button onClick={onClose} style={{flex:1, padding:"10px 14px", opacity:.8}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
