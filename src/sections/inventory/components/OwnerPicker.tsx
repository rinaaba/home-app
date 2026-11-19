/** Pick who an item belongs to with one tap. The names are set under "Homes and people". */
export function OwnerPicker({ owners, value, onChange }: { owners: string[]; value: string; onChange: (v: string) => void }) {
  // Keep an old owner visible even if it was removed from the list.
  const options = value && !owners.includes(value) ? [...owners, value] : owners;
  return (
    <div className="field">
      <span className="label">Owner</span>
      <div className="chips">
        {options.map((o) => (
          <button type="button" key={o} className={`chip ${o === value ? 'on' : ''}`} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
