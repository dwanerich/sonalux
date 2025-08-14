
'use client';
import { useEffect, useState } from 'react';

export default function Packs(){
  const [packs, setPacks] = useState([]);
  useEffect(()=>{
    fetch('/api/packs').then(r=>r.json()).then(j=>{ if (j.ok) setPacks(j.packs||[]); });
  },[]);
  return (
    <div>
      <h2 className="title">Branded Packs</h2>
      {packs.map(p => (
        <section key={p.slug} style={{margin:'24px 0'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
              <div className="sub">{p.rsg_id}</div>
              <h3 style={{margin:'4px 0 10px', fontSize:22, fontWeight:700}}>{p.title}</h3>
            </div>
            <a className="button" href={`/bank?q=${encodeURIComponent(p.rsg_id)}`}>Open in Bank</a>
          </div>
          <div className="rail">
            {p.items.map((it, i) => (
              <div key={i} className="card--flat" style={{minWidth:260}}>
                <div className="cover-img" style={{height:140, background:'#111', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <span className="sub">{(it.type||'asset').toUpperCase()}</span>
                </div>
                <div className="opacity-70 text-xs" style={{marginTop:6}}>{(it.tags||[]).slice(0,4).join(' • ')}</div>
                <audio controls src={it.url} style={{width:'100%', marginTop:8}} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
