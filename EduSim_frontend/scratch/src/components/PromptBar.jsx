import React, { useState } from 'react';

export default function PromptBar({ onSubmit }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(value);
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: 12, display: 'flex', gap: 8, alignItems: 'center', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0))', backdropFilter: 'blur(6px)' }}>
      <input
        aria-label="AI Prompt"
        placeholder="Generate a truck hitting a barrier at high speed"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', color: '#e6eef6' }}
      />
      <button type="submit" style={{ padding: '8px 12px', borderRadius: 8 }}>Generate</button>
    </form>
  );
}
