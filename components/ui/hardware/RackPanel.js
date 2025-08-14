import React from 'react';

export default function RackPanel({
  backgroundSrc,
  className,
  innerClassName,
  children,
  padding = '14px 16px'
}) {
  const shellStyle = {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,.12)',
    boxShadow: '0 12px 28px rgba(0,0,0,.45)',
    background: '#111'
  };

  const innerStyle = {
    position: 'relative',
    padding
  };

  const bgImg = backgroundSrc
    ? React.createElement('img', {
        src: backgroundSrc,
        alt: '',
        style: {
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.35,
          pointerEvents: 'none'
        }
      })
    : null;

  return React.createElement(
    'div',
    { className, style: shellStyle },
    bgImg,
    React.createElement('div', { className: innerClassName, style: innerStyle }, children)
  );
}
