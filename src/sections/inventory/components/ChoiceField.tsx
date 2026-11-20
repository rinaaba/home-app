import { useState } from 'react';

const OTHER = '__other__';

/** A dropdown with an "Other…" choice to type something new. A value not in the list is still shown and kept. */
export function ChoiceField({ label, value, options, onChange, otherPlaceholder }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  otherPlaceholder: string;
}) {
  const [typing, setTyping] = useState(false);
  const list = [...new Set([...options, value].filter(Boolean))];
  return (
    <label>
      {label}
      <select
        value={typing ? OTHER : value}
        onChange={(e) => {
          if (e.target.value === OTHER) { setTyping(true); onChange(''); }
          else { setTyping(false); onChange(e.target.value); }
        }}
      >
        <option value="">Choose…</option>
        {list.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER}>Other…</option>
      </select>
      {typing && <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={otherPlaceholder} autoFocus />}
    </label>
  );
}
