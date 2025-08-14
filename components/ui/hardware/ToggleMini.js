import React from 'react';

export default function ToggleMini({ value = false, onChange }) {
  const wrap = {
    width: 40, height: 20, borderRadius: 12, position: 'relative',
    background: value ? 'rgba(0,229,255,.25)' : 'rgba(255,255,255,.08)',
    border: '1px solid rgba(255,255,255,.18)', cursor: 'pointer',
    boxShadow: value ? '0 0 10px rgba(0,229,255,.25) inset' : 'inset 0 0 0 1px rgba(0,0,0,.3)'
  };
  const knob = {
    position: 'absolute', top: 2, left: value ? 22 : 2,
    width: 16, height: 16, borderRadius: 10, background: '#fff',
    transition: 'left .15s ease'
  };
  return React.createElement('div', {
    style: wrap,
    role: 'switch',
    'aria-checked': !!value,
    tabIndex: 0,
    onClick: () => onChange && onChange(!value),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onChange && onChange(!value);
      }
    }
  }, React.createElement('div', { style: knob }));
}
