'use client';
import { useEffect, useState } from 'react';

export default function BankPage(){
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('any');

  async function load(){
    const res = await fetch(`/api/bank/search?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`);
    const json = await res.json();
    if (json.ok) setItems(json.items || []);
  }
  useEffect(()=>{ load(); }, []);

  return (
    <div>
      <br /> <br /><br /> <br /> <br /> <br /> <br /> <br /> <br />
      <h2 className="text-xl font-semibold mb-2">Chop+Bop Sound Bank</h2>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <input className="input" placeholder="search tags (e.g., trap dark kick loop)"
               value={q} onChange={e=>setQ(e.target.value)} />
        <select value={type} onChange={e=>setType(e.target.value)}>
          <option value="any">any</option>
          <option value="one_shot">one_shot</option>
          <option value="loop">loop</option>
        </select>
        <button className="button" onClick={load}>Search</button>
      </div>
      <div className="grid">
        {items.map(it => (
          <div key={it.id} className="card">
            <div className="opacity-70 text-xs">{it.tags?.join(' • ')}</div>
            <div className="mt-1 text-sm">{it.type} · {Math.round(it.bpm || 0)} bpm · {it.key || '—'}</div>
            <audio controls src={it.url} style={{width:'100%', marginTop:8}} />
          </div>
        ))}
      </div>
    </div>
  );
}
