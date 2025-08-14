'use client';


import React from 'react';

// Minimal default list; pass your own via props.moodsList if you want 50.
const DEFAULT_MOODS = [
  'Dark', 'Bright', 'Chill', 'Hype', 'Moody', 'Gritty', 'Dreamy', 'Aggressive',
  'Groove', 'Ethereal', 'Epic', 'Minimal'
];

export default function MoodBank(props) {
  const {
    value,
    selectedMoods,
    onChange,
    setSelected,      // legacy name
    moodsList
  } = props || {};

  // Normalize inputs + handlers
  const selected = Array.isArray(value) ? value
                  : Array.isArray(selectedMoods) ? selectedMoods
                  : [];
  const setSelectedMoods = typeof onChange === 'function' ? onChange
                          : typeof setSelected === 'function' ? setSelected
                          : () => {};
  const MOODS = Array.isArray(moodsList) && moodsList.length ? moodsList : DEFAULT_MOODS;

  const styles = {
    wrap: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
      maxWidth: 820
    },
    moodButton: {
      padding: '8px 12px',
      borderRadius: 10,
      border: '1px solid rgba(255,255,255,.15)',
      fontSize: 12,
      letterSpacing: '.04em',
      cursor: 'pointer',
      userSelect: 'none',
      background: '#222',
      color: '#ccc'
    },
    header: { marginTop: 6, marginBottom: 4, opacity: 0.9, fontSize: 13 }
  };

  const toggle = (mood) => {
    const isOn = selected.includes(mood);
    const next = isOn ? selected.filter((m) => m !== mood) : selected.concat(mood);
    setSelectedMoods(next);
  };

  return React.createElement(
    'div',
    null,
    React.createElement('div', { style: styles.header }, 'Moods'),
    React.createElement(
      'div',
      { style: styles.wrap },
      MOODS.map((mood) =>
        React.createElement(
          'button',
          {
            key: mood,
            type: 'button',
            onClick: () => toggle(mood),
            style: Object.assign({}, styles.moodButton, {
              backgroundColor: selected.includes(mood) ? '#fff' : '#222',
              color: selected.includes(mood) ? '#000' : '#ccc'
            })
          },
          mood
        )
      )
    )
  );
}
