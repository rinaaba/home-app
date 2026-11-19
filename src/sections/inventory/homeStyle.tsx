import { Icons, type IconName } from '../../core/ui/icons';
import type { Home } from './types';

/** Each home gets its own accent color (see .accent-* in global.css) and icon. */
export const ACCENTS = ['sand', 'sea', 'pine', 'plum', 'coral'] as const;
export type Accent = (typeof ACCENTS)[number];
export const HOME_ICONS: IconName[] = ['city', 'waves', 'house', 'mountain', 'tree'];

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
