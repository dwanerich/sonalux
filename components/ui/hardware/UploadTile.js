import React, { useRef, useState, useMemo } from 'react';

/**
 * hardware/UploadTile
 * - Plain JS (no JSX)
 * - Click to pick, drag & drop support
 * - Shows selected file name + size with a "Clear" action
 * - Matches your original hardware styling (gradient panel + neon-ish shadow)
 *
 * Props:
 *  - value?: File|null
 *  - onChange?: (file|null)=>void
 *  - accept?: string (default "audio/*")
 *  - label?: string (default "Upload")
 *  - hint?: string (default "Drop file here or click to browse")
 *  - disabled?: boolean
 *  - width?: number (default 220)
 *  - height?: number (default 160)
 */
export default function UploadTile(props) {
  const {
    value = null,
    onChange,
    accept = 'audio/*',
    label = 'Upload',
    hint = 'Drop file here or click to browse',
    disabled = false,
    width = 220,
    height = 160,
  } = props || {};

  const inputRef = useRef(null);
  const [isOver, setIsOver] = useState(false);

  const tileStyle = useMemo(() => ({
    width,
    height,
    borderRadius: 14,
    border: '1.5px solid rgba(26,55,66,.9)',
    background: 'linear-gradient(180deg, rgba(10,14,17,.9), rgba(8,12,15,.92))',
    boxShadow: isOver
      ? 'inset 0 0 14px rgba(0,229,255,.09), 0 10px 26px rgba(0,0,0,.6)'
      : 'inset 0 0 12px rgba(0,229,255,.05), 0 8px 24px rgba(0,0,0,.55)',
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    userSelect: 'none',
    outline: 'none',
  }), [width, height, isOver, disabled]);

  function openPicker() {
    if (disabled) return;
    if (inputRef.current) inputRef.current.click();
  }

  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);
    if (disabled) return;
    const file = e?.dataTransfer?.files?.[0];
    if (file && onChange) onChange(file);
  }

  function onDragOver(e) {
    e.preventDefault();
    if (!disabled) setIsOver(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    setIsOver(false);
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  }

  function onInputChange(e) {
    const file = e?.target?.files?.[0];
    if (file && onChange) onChange(file);
  }

  function clearFile(ev) {
    ev?.stopPropagation?.();
    if (disabled) return;
    if (onChange) onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function bytesToHuman(n) {
    if (!Number.isFinite(n)) return '';
    const u = ['B','KB','MB','GB'];
    let i = 0, v = n;
    while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
    return v.toFixed(v >= 10 || i === 0 ? 0 : 1) + ' ' + u[i];
  }

  const hasFile = !!value;

  const labelStyle = { fontSize: 12, letterSpacing: '.08em', opacity: .9, marginBottom: 6, color: '#cfe9ef' };
  const hintStyle  = { fontSize: 12, opacity: .75, color: '#a9bcc3' };

  const pill = React.createElement(
    'div',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 999,
        background: '#0f1519',
        border: '1px solid rgba(0,229,255,.2)',
        color: '#d9f6ff',
        maxWidth: width - 32,
      }
    },
    React.createElement('span', {
      style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: width - 120 }
    }, (value && value.name) || 'Selected file'),
    React.createElement('span', { style: { opacity: .7 } }, value ? bytesToHuman(value.size) : ''),
    React.createElement('button', {
      type: 'button',
      onClick: clearFile,
      style: {
        padding: '4px 8px',
        fontSize: 11,
        letterSpacing: '.04em',
        borderRadius: 8,
        border: '1px solid rgba(0,229,255,.25)',
        background: 'rgba(0,229,255,.08)',
        color: '#d9f6ff',
        cursor: 'pointer'
      }
    }, 'Clear')
  );

  const iconWrap = React.createElement(
    'div',
    {
      style: {
        width: 40, height: 40, borderRadius: 10,
        display: 'grid', placeItems: 'center',
        background: 'rgba(0,229,255,.06)',
        border: '1px solid rgba(0,229,255,.2)',
        marginBottom: 6
      }
    },
    React.createElement('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
      React.createElement('path', { key: 'p1', d: 'M12 3v12m0 0l-4-4m4 4l4-4', stroke: '#cfe9ef', strokeWidth: 1.5, strokeLinecap: 'round' }),
      React.createElement('rect', { key: 'p2', x: 4, y: 15, width: 16, height: 6, rx: 2, stroke: 'rgba(207,233,239,.9)', strokeWidth: 1.2 })
    ])
  );

  return React.createElement(
    'div',
    {
      role: 'button',
      tabIndex: disabled ? -1 : 0,
      onClick: openPicker,
      onKeyDown,
      onDragOver,
      onDragLeave,
      onDrop,
      'aria-disabled': disabled || undefined,
      style: tileStyle
    },
    // content
    React.createElement('div', null,
      React.createElement('div', { style: labelStyle }, label),
      iconWrap,
      hasFile
        ? pill
        : React.createElement('div', { style: hintStyle }, hint)
    ),
    // hidden input
    React.createElement('input', {
      ref: inputRef,
      type: 'file',
      accept,
      hidden: true,
      onChange: onInputChange,
      tabIndex: -1
    })
  );
}
