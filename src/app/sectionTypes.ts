import type { ComponentType } from 'react';

/**
 * A "section" is one area of the home app (inventory today; lists, tasks, calendar later).
 * Each section owns its pages under /<path>/... and its own Firestore collections.
 */
export interface AppSection {
  id: string;
  title: string;
  /** An emoji or short text shown in the navigation. */
  icon: string;
  /** URL path, e.g. "inventory" → /#/inventory */
  path: string;
  /** Renders the section's own pages (it can use nested <Routes>). */
  Component: ComponentType;
}
