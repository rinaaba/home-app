import { useId, type FormEvent } from 'react';
import { useInventory } from '../InventoryContext';
import { HomeSwitch } from './HomeSwitch';
import { OwnerPicker } from './OwnerPicker';
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
  const { activeHomes, homes, owners, categoriesInUse } = useInventory();
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
          <input value={value.name} onChange={(e) => set('name', e.target.value)} required placeholder="e.g. Striped t-shirt" />
        </label>

        <div className="field">
          <span className="label">Home</span>
          <HomeSwitch homes={homeOptions.length ? homeOptions : activeHomes} value={value.homeId} onChange={(id) => set('homeId', id)} />
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

        <OwnerPicker owners={owners} value={value.owner} onChange={(v) => set('owner', v)} />


        <label>
          Notes
          <textarea value={value.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Optional" />
        </label>

        <button className="btn primary big" type="submit">{busy ? 'Saving…' : submitLabel}</button>
      </fieldset>
    </form>
  );
}
