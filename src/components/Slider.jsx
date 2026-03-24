import React from 'react';

export default function Slider({ label, value, min, max, step, onChange, unit = '' }) {
  return (
    <div className="slider-container">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
