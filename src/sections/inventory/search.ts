import type { Item } from './types';

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Words people type in questions that shouldn't have to match ("where is the blender?").
const STOP_WORDS = new Set(['where', 'is', 'are', 'the', 'a', 'an', 'my', 'our', 'is', 'do', 'we', 'have', 'of', 'in', 'which', 'what', 'whats', 'home', 'house', 'find', 'how', 'many', 'much', 'i', 'any', 'pair', 'pairs', 'there', 'got', 'own', 'show', 'me', 'at', 'for', 'some']);

export function searchItems(items: Item[], text: string, homeName: (id: string) => string) {
  const words = normalize(text).replace(/[?!.,'"]/g, ' ').split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));
  if (!words.length) return items;
  return items.filter((it) => {
    // Match the start of words, so "rina" finds Rina but not Orina, and "shirt" finds "t-shirt".
    const hay = normalize([it.name, it.color, it.category, it.subcategory, it.notes, homeName(it.homeId)].join(' '))
      .split(/[^a-z0-9\u0590-\u05ff]+/)
      .filter(Boolean);
    // Owner names must match exactly, so "or" finds Or but not Orina.
    const owner = normalize(it.owner);
    const has = (w: string) => w === owner || hay.some((h) => h.startsWith(w));
    // Simple plural handling: "blenders" also finds "blender".
    return words.every((w) => has(w) || (w.length > 3 && w.endsWith('s') && has(w.slice(0, -1))));
  });
}
