import React from 'react';

export default function ScreenDisplay({ value, placeholder, onChange }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 12,
        border: '1px solid rgba(0,255,255,.18)',
        background: 'linear-gradient(180deg, rgba(6,22,26,.92), rgba(4,16,20,.92))',
        boxShadow:
          'inset 0 0 22px rgba(0,255,255,.08), 0 6px 24px rgba(0,0,0,.45)',
        display: 'grid',
        gridTemplateRows: '28px 1fr',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* subtle LCD sheen */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background:
            'linear-gradient(15deg, rgba(255,255,255,.06), transparent 35%, transparent 65%, rgba(255,255,255,.03))',
          pointerEvents: 'none'
        }}
      />
      {/* header */}
      <div
        style={{
          height: 28, display: 'flex', alignItems: 'center',
          padding: '0 12px', fontSize: 12, letterSpacing: '.12em',
          color: '#a7fbff', opacity: .9, borderBottom: '1px solid rgba(0,255,255,.12)'
        }}
      >
        PROMPT
      </div>
      {/* text area */}
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', height: '100%', padding: 14,
          border: 'none', outline: 'none', resize: 'none',
          background:
            'repeating-linear-gradient(transparent, transparent 26px, rgba(0,255,255,.03) 27px)',
          color: '#e6feff', fontSize: 16, lineHeight: 1.35
        }}
      />
    </div>
  );
}
