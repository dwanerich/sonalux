// components/ui/StepFader.js
import React from 'react';
import Fader from './Fader';

export default function StepFader({
  steps = [0, 25, 50, 75, 100], // or ['Dry','25%','50%','75%','Wet']
  valueIndex = 0,
  onChangeIndex,
  vertical = true,
  label = 'Mix',
}) {
  const numericSteps = steps.map(s => (typeof s === 'number' ? s : null));
  const isNumeric = numericSteps.every(n => typeof n === 'number');

  const currentValue = isNumeric
    ? numericSteps[valueIndex]
    : Math.round((valueIndex / (steps.length - 1)) * 100);

  const handleChange = (v) => {
    // Convert raw 0..100 → closest step index
    const idx = isNumeric
      ? numericSteps.reduce((best, n, i) =>
          Math.abs(v - n) < Math.abs(v - numericSteps[best]) ? i : best, 0)
      : Math.round((v / 100) * (steps.length - 1));
    onChangeIndex(idx);
  };

  return (
    <Fader
      value={currentValue}
      onChange={handleChange}
      vertical={vertical}
      label={isNumeric ? `${label}` : `${label}: ${steps[valueIndex]}`}
    />
  );
}
