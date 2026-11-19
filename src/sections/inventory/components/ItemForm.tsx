import { useId, type FormEvent } from 'react';
import { useInventory } from '../InventoryContext';
import { CATEGORIES, TAXONOMY } from '../taxonomy';
import type { ItemDetails } from '../types';

interface Props {
  value: ItemDetails;
  onChange: (v: ItemDetails) => void;
  onSubmit: () => void;
  submitLabel: string;
  busy?: boolean;
  disabled?: boolean;
}

export function ItemForm({ value, onChange, onSubmit, submitLabel, busy, disabled }: Props) {
  const { activeHomes, homes, roomsFor, owners, categoriesInUse } = useInventory();
  const id = useId();
  const set = <K extends keyof ItemDetails>(k: K, v: ItemDetails[K]) => onChange({ ...value, [k]: v });

  const categories = [...new Set([...CATEGORIES, ...categoriesInUse])];
  const subcategories = TAXONOMY[value.category] ?? [];
  // Keep an archived home selectable if the item is already in it.
  const homeOptions = homes.filter((h) => !h.archived || h.id === value.homeId);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.name.trim() || !value.homeId) return;
    onSubmit();
  };

  return (
    <form className="form" onSubmit={submit}>
      <fieldset disabled={disabled || busy}>
        <label>
          Name
          <input value={value.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Blender" />
        </label>

        <div className="form-row">
          <label>
            Home
            <select value={value.homeId} onChange={(e) => set('homeId', e.target.value)} required>
              <option value="" disabled>Choose a home</option>
              {(homeOptions.length ? homeOptions : activeHomes).map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </label>
          <label>
            Room
            <input list={`${id}-rooms`} value={value.room} onChange={(e) => set('room', e.target.value)} placeholder="Optional" />
            <datalist id={`${id}-rooms`}>{roomsFor(value.homeId).map((r) => <option key={r} value={r} />)}</datalist>
          </label>
        </div>

        <div className="form-row">
          <label>
            Category
            <input list={`${id}-cats`} value={value.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Clothing" />
            <datalist id={`${id}-cats`}>{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label>
            Sub-category
            <input list={`${id}-subs`} value={value.subcategory} onChange={(e) => set('subcategory', e.target.value)} placeholder="e.g. T-shirt" />
            <datalist id={`${id}-subs`}>{subcategories.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
        </div>

        <div className="form-row">
          <label>
            Color
            <div className="color-field">
              <input
                type="color"
                value={value.colorHex || '#cccccc'}
                onChange={(e) => set('colorHex', e.target.value)}
                aria-label="Pick color"
              />
              <input value={value.color} onChange={(e) => set('color', e.target.value)} placeholder="e.g. Navy blue" />
            </div>
          </label>
          <label>
            Owner
            <input list={`${id}-owners`} value={value.owner} onChange={(e) => set('owner', e.target.value)} placeholder="Who it belongs to" />
            <datalist id={`${id}-owners`}>{owners.map((o) => <option key={o} value={o} />)}</datalist>
          </label>
        </div>


        <label>
          Notes
          <textarea value={value.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Optional" />
        </label>

        <button className="btn primary big" type="submit">{busy ? 'Saving…' : submitLabel}</button>
      </fieldset>
    </form>
  );
}
