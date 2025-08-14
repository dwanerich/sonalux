import React from 'react';

export default function EngravedLabel({ children, size = 11, opacity = .7, letter = '.14em' }) {
  return React.createElement(
    'span',
    {
      style: {
        display: 'inline-block',
        marginTop: 8,
        fontSize: size,
        letterSpacing: letter,
        textTransform: 'uppercase',
        color: `rgba(231,231,231,${opacity})`,
        textShadow: '0 1px 0 rgba(0,0,0,.6), 0 -1px 0 rgba(255,255,255,.06)'
      }
    },
    children
  );
}
