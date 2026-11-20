import { useId, type FormEvent } from 'react';
import { useInventory } from '../InventoryContext';
import { HomeSwitch } from './HomeSwitch';
import { OwnerPicker } from './OwnerPicker';
import { ChoiceField } from './ChoiceField';
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
  const { activeHomes, homes, owners, categoriesInUse, items } = useInventory();
  const id = useId();
  const set = <K extends keyof ItemDetails>(k: K, v: ItemDetails[K]) => onChange({ ...value, [k]: v });

  const categories = [...new Set([...CATEGORIES, ...categoriesInUse])];
  // Sub-categories for a category: the standard ones plus any used before with that category.
  const subsFor = (cat: string) => [...new Set([...(TAXONOMY[cat] ?? []), ...items.filter((i) => i.category === cat).map((i) => i.subcategory).filter(Boolean)])];
  const subcategories = subsFor(value.category);
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
          <ChoiceField
            label="Category"
            value={value.category}
            options={categories}
            otherPlaceholder="New category"
            // A new category usually means a different sub-category too.
            onChange={(c) => onChange({ ...value, category: c, subcategory: subsFor(c).includes(value.subcategory) ? value.subcategory : '' })}
          />
          <ChoiceField
            key={value.category}
            label="Sub-category"
            value={value.subcategory}
            options={subcategories}
            otherPlaceholder="New sub-category"
            onChange={(v) => set('subcategory', v)}
          />
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
