import React from 'react';

export default function Led({ on = true, size = 8, color = '#6BFF93', dimColor = 'rgba(255,255,255,.14)' }) {
  const s = Number(size) || 8;
  const style = {
    width: s,
    height: s,
    borderRadius: s,
    background: on ? color : dimColor,
    boxShadow: on ? `0 0 8px ${color}` : 'none',
    border: '1px solid rgba(255,255,255,.18)',
    display: 'inline-block'
  };
  return React.createElement('span', { style });
}
