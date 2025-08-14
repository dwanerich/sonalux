import React from 'react';
import HardwareDial from '../hardware/HardwareDial'; // keep your existing path

export default function ControlsRack({
  remixPower, setRemixPower,
  tone, setTone,
  width, setWidth,
}) {
  return (
    <div className="hardwareRow">
      <div className="knobBlock">
        <HardwareDial
          id="remixPower"
          label="Remix Power"
          value={remixPower}
          min={0}
          max={100}
          step={1}
          onChange={setRemixPower}
          dialImage="/hw/dial.png"
          tickImage="/hw/dial-9.png"
        />
      </div>

      <div className="knobBlock">
        <HardwareDial
          id="tone"
          label="Tone"
          value={tone}
          min={-50}
          max={50}
          step={1}
          onChange={setTone}
          dialImage="/hw/dial.png"
          tickImage="/hw/dial-9.png"
        />
      </div>

      <div className="knobBlock">
        <HardwareDial
          id="width"
          label="Width"
          value={width}
          min={0}
          max={100}
          step={1}
          onChange={setWidth}
          dialImage="/hw/dial.png"
          tickImage="/hw/dial-9.png"
        />
      </div>
    </div>
  );
}
