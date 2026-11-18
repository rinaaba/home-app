import type { AppSection } from './sectionTypes';
import { inventorySection } from '../sections/inventory';

/**
 * All sections of the app, in navigation order.
 * To add a new section later: create src/sections/<name>/index.tsx exporting an AppSection, and add it here.
 */
export const sections: AppSection[] = [inventorySection];
