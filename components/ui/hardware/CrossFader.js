import React, { useState } from 'react';

export default function CrossFader({ imageSrc, value = 50, onChange }) {
  const [pos, setPos] = useState(value);

  const set = (v) => {
    const next = Math.min(100, Math.max(0, Math.round(v)));
    setPos(next);
    onChange?.(next);
  };

  const wrapStyle = { position: 'relative', width: 300, height: 42, userSelect: 'none' };
  const sliderStyle = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    background: 'transparent',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer'
  };

  return React.createElement(
    'div',
    { style: wrapStyle },
    React.createElement('img', {
      src: imageSrc,
      alt: 'Crossfader',
      style: { width: '100%', height: '100%', display: 'block' }
    }),
    React.createElement('input', {
      type: 'range',
      min: 0,
      max: 100,
      value: pos,
      onChange: (e) => set(Number(e.target.value)),
      style: sliderStyle,
      className: 'crossfader-slider'
    }),
    // Inline style for the track/handle to make it a stick
    React.createElement('style', {
      dangerouslySetInnerHTML: {
        __html: `
        .crossfader-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 4px;
          height: 36px;
          background: #fff;
          border-radius: 2px;
          border: none;
          margin-top: -18px;
          cursor: grab;
        }
        .crossfader-slider:active::-webkit-slider-thumb {
          cursor: grabbing;
        }
        .crossfader-slider::-moz-range-thumb {
          width: 16px;
          height: 36px;
          background: #fff;
          border-radius: 2px;
          border: none;
          cursor: grab;
        }
        .crossfader-slider::-webkit-slider-runnable-track {
          height: 100%;
          background: transparent;
        }
        .crossfader-slider::-moz-range-track {
          height: 100%;
          background: transparent;
        }
      `
      }
    })
  );
}
