'use client';
import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import css from './Modal.module.css';

export default function Modal({ open, onClose, children, title }) {
  const mount = useMemo(() => (typeof window !== 'undefined' ? document.body : null), []);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !mount) return null;

  return createPortal(
    <div className={css.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={css.card} onClick={(e) => e.stopPropagation()}>
        {title && <div className={css.head}>{title}</div>}
        <div className={css.body}>{children}</div>
      </div>
    </div>,
    mount
  );
}
