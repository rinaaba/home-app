import { Icons, type IconName } from '../../core/ui/icons';
import type { Home } from './types';

/** Each home gets its own accent color (see .accent-* in global.css) and icon. */
export const ACCENTS = ['sand', 'sea', 'pine', 'plum', 'coral', 'rose', 'gold', 'slate'] as const;
export type Accent = (typeof ACCENTS)[number];
/** Icons to choose from for a home, with a name for each type of place. */
export const HOME_ICONS: { id: IconName; label: string }[] = [
  { id: 'apartment', label: 'Apartment' },
  { id: 'house', label: 'House' },
  { id: 'city', label: 'City' },
  { id: 'vacation', label: 'Vacation' },
  { id: 'summer', label: 'Summer' },
  { id: 'waves', label: 'Beach' },
  { id: 'mountain', label: 'Mountain' },
  { id: 'cabin', label: 'Cabin' },
  { id: 'tree', label: 'Countryside' },
  { id: 'snow', label: 'Ski' },
];

const DEFAULTS: Record<string, { accent: Accent; icon: IconName }> = {
  'tel-aviv': { accent: 'sand', icon: 'city' },
  evia: { accent: 'sea', icon: 'waves' },
  deal: { accent: 'pine', icon: 'house' },
};

export function homeStyle(home: Home | undefined): { accent: Accent; icon: IconName } {
  if (!home) return { accent: 'sea', icon: 'house' };
  const fallback = DEFAULTS[home.id] ?? { accent: ACCENTS[(home.sortOrder ?? 0) % ACCENTS.length], icon: 'house' as IconName };
  return {
    accent: (ACCENTS as readonly string[]).includes(home.accent ?? '') ? (home.accent as Accent) : fallback.accent,
    icon: home.icon && home.icon in Icons ? (home.icon as IconName) : fallback.icon,
  };
}

export function HomeIcon({ home }: { home: Home | undefined }) {
  const Icon = Icons[homeStyle(home).icon];
  return <Icon />;
}

/** Pick a home's color and icon. */
export function HomeStylePicker({ accent, icon, onChange }: { accent: string; icon: string; onChange: (accent: string, icon: string) => void }) {
  return (
    <div className={`style-picker accent-${accent}`}>
      <div className="label">Color</div>
      <div className="pickers">
        {ACCENTS.map((a) => (
          <button type="button" key={a} className={`swatch-btn accent-${a} ${a === accent ? 'on' : ''}`} onClick={() => onChange(a, icon)} aria-label={a} />
        ))}
      </div>
      <div className="label">Icon</div>
      <div className="icon-grid">
        {HOME_ICONS.map(({ id, label }) => {
          const I = Icons[id];
          return (
            <button type="button" key={id} className={`icon-choice ${id === icon ? 'on' : ''}`} onClick={() => onChange(accent, id)}>
              <I />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
