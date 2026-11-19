/** Small line icons shared across the app. */
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };

export const Icons = {
  city: () => <svg {...base}><path d="M3 21h18M5 21V10h4v11M9 21V5h5v16M14 21v-8h5v8" /><path d="M11 8h1M11 11h1M11 14h1" /></svg>,
  waves: () => <svg {...base}><path d="M3 9c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 14c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0" /></svg>,
  house: () => <svg {...base}><path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5" /></svg>,
  vacation: () => <svg {...base}><path d="M13 21c0-4 .3-8 1.5-11.5" /><path d="M14.5 9.5C13 7 10 6.3 7 7.3c2.3-.3 4.4.6 5.5 2.4M14.5 9.5c1.2-2.7 4-3.8 7-3-2.3.1-4.3 1.2-5.2 3M14.5 9.5c-3 .3-5.3 2.2-6 5 1-1.8 3-3 5-3.2M14.5 9.5c2.8.6 4.8 2.7 5.2 5.5-1.1-1.8-3-2.8-5-3" /><path d="M4 21h16" /></svg>,
  snow: () => <svg {...base}><path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M9.5 3.5L12 6l2.5-2.5M9.5 20.5L12 18l2.5 2.5" /></svg>,
  mountain: () => <svg {...base}><path d="M2 20l7-12 4 6 3-4 6 10z" /></svg>,
  tree: () => <svg {...base}><path d="M12 3l6 9h-4l4 6H6l4-6H6zM12 18v3" /></svg>,
  all: () => <svg {...base}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>,
  moon: () => <svg {...base}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>,
  sun: () => <svg {...base}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  gear: () => <svg {...base}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
  sparkle: () => <svg {...base}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>,
  filter: () => <svg {...base}><path d="M4 6h16M7 12h10M10 18h4" /></svg>,
  plus: () => <svg {...base}><path d="M12 5v14M5 12h14" /></svg>,
  close: () => <svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  chevron: () => <svg {...base} width={16} height={16}><path d="M9 6l6 6-6 6" /></svg>,
};

export type IconName = keyof typeof Icons;
