import type { AppSection } from './sectionTypes';
import { inventorySection } from '../sections/inventory';

/**
 * All sections of the app, in navigation order.
 * To add a new section later: create src/sections/<name>/index.tsx exporting an AppSection, and add it here.
 */
export const sections: AppSection[] = [inventorySection];

/** Other family apps shown on the menu until they move in here. */
export const otherApps: { title: string; icon: string; url: string; note: string }[] = [
  { title: 'Home pay', icon: '💶', url: 'https://homepay-orpin.vercel.app/', note: 'Payments for the people who help at home' },
];
