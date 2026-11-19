import { Icons } from '../../../core/ui/icons';
import { HomeIcon, homeStyle } from '../homeStyle';
import type { Home } from '../types';

/** A segmented switch of homes with icons. `value` '' means all homes (when `allowAll`). */
export function HomeSwitch({ homes, value, onChange, allowAll }: {
  homes: Home[]; value: string; onChange: (id: string) => void; allowAll?: boolean;
}) {
  return (
    <div className="segmented" role="tablist">
      {allowAll && (
        <button type="button" role="tab" aria-selected={!value} className={`seg ${!value ? 'on' : ''}`} onClick={() => onChange('')}>
          <Icons.all /> <span>All</span>
        </button>
      )}
      {homes.map((h) => (
        <button type="button"
          key={h.id}
          role="tab"
          aria-selected={value === h.id}
          className={`seg accent-${homeStyle(h).accent} ${value === h.id ? 'on' : ''}`}
          onClick={() => onChange(h.id)}
        >
          <HomeIcon home={h} /> <span>{h.name}</span>
        </button>
      ))}
    </div>
  );
}
