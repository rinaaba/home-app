import type { AiAnswer } from './ai/ask';

/**
 * Remembers the gallery as you left it (filters, search, AI answer, scroll position),
 * so going back from an item returns you to the same view. Kept in memory while the app is open.
 */
export interface AiState { question: string; loading: boolean; result?: AiAnswer; error?: string }

export const galleryMemory = {
  search: '',
  scroll: 0,
  ai: null as AiState | null,
};

/** The gallery address with the filters/search you had. */
export const galleryLink = () => (galleryMemory.search ? `/homes-inventory?${galleryMemory.search}` : '/homes-inventory');
