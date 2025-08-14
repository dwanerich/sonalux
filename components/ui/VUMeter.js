import React, { useEffect, useRef } from "react";

/** level: 0..1  |  peak: 0..1 (optional) */
export default function VUMeter({ level=0, peak=0, width=320, height=16 }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if(!c) return;
    const ctx = c.getContext("2d"); ctx.clearRect(0,0,c.width,c.height);

    // bg
    roundRect(ctx, 0,0,width,height,8); ctx.fillStyle = "rgba(20,22,26,1)"; ctx.fill();

    // fill
    const w = Math.max(2, Math.min(width-2, Math.floor(level * (width-2))));
    const grad = ctx.createLinearGradient(0,0,width,0);
    grad.addColorStop(0, "#78c88f"); grad.addColorStop(.7, "#e4b764"); grad.addColorStop(1, "#e07171");
    roundRect(ctx, 1,1,w,height-2,7); ctx.fillStyle = grad; ctx.fill();

    // peak line
    const px = Math.max(2, Math.min(width-2, Math.floor(peak * (width-2))));
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillRect(px, 2, 2, height-4);
  }, [level, peak, width, height]);

  return <canvas ref={ref} width={width} height={height} style={{
    display:"block", filter:"drop-shadow(0 6px 12px rgba(0,0,0,.35))", borderRadius:8
  }}/>;
}

function roundRect(ctx, x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}
