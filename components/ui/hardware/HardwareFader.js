import React, { useState, useRef } from 'react';
import styles from './HardwareFader.module.css';

export default function HardwareFader({ label, min = 0, max = 100, step = 1, value, onChange, image }) {
  const [pos, setPos] = useState(((value - min) / (max - min)) * 100);
  const trackRef = useRef(null);

  const handlePointerDown = (e) => {
    e.preventDefault();
    const handlePointerMove = (ev) => {
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
      const newVal = max - percent * (max - min);
      setPos((1 - percent) * 100);
      onChange(Math.round(newVal / step) * step);
    };
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className={styles.faderWrap}>
      <div className={styles.label}>{label}</div>
      <div className={styles.track} ref={trackRef} onPointerDown={handlePointerDown}>
        <div
          className={styles.knob}
          style={{ backgroundImage: `url(${image})`, top: `${100 - pos}%` }}
        />
      </div>
    </div>
  );
}
