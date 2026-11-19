import type { Item } from './types';

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Words people type in questions that shouldn't have to match ("where is the blender?").
const STOP_WORDS = new Set(['where', 'is', 'are', 'the', 'a', 'an', 'my', 'our', 'is', 'do', 'we', 'have', 'of', 'in', 'which', 'what', 'whats', 'home', 'house', 'find']);

export function searchItems(items: Item[], text: string, homeName: (id: string) => string) {
  const words = normalize(text).replace(/[?!.,'"]/g, ' ').split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));
  if (!words.length) return items;
  return items.filter((it) => {
    const hay = normalize([it.name, it.color, it.category, it.subcategory, it.room, it.owner, it.notes, homeName(it.homeId)].join(' '));
    // Simple plural handling: "blenders" also finds "blender".
    return words.every((w) => hay.includes(w) || (w.length > 3 && w.endsWith('s') && hay.includes(w.slice(0, -1))));
  });
}
