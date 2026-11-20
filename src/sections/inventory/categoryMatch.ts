import { TAXONOMY } from './taxonomy';

/** Category/sub-category pairs the family added themselves, so they count as known too. Set by the inventory. */
let customPairs: { category: string; subcategory: string }[] = [];
export function setCustomCategories(pairs: { category: string; subcategory: string }[]) {
  customPairs = pairs.filter((p) => p.category && p.subcategory).map((p) => ({ category: p.category, subcategory: p.subcategory }));
}

/** All known categories with their sub-categories: the standard list plus the family's own. */
export function knownTaxonomy(): Record<string, string[]> {
  const t: Record<string, string[]> = Object.fromEntries(Object.entries(TAXONOMY).map(([c, s]) => [c, [...s]]));
  for (const { category, subcategory } of customPairs) {
    t[category] ??= [];
    if (!t[category].includes(subcategory)) t[category].push(subcategory);
  }
  return t;
}

// A few everyday words the AI might use instead of the list's words.
const SYNONYMS: Record<string, string> = {
  tee: 'tshirt', tshirts: 'tshirt', tees: 'tshirt', trousers: 'pants', trainers: 'sneakers', runningshoes: 'sneakers',
  sweatshirt: 'hoodie', jumper: 'sweater', pullover: 'sweater', tank: 'top', tanktop: 'top', blazer: 'jacket',
  stockings: 'tights', pantyhose: 'tights', handbag: 'bag', purse: 'bag', mug: 'dishes', cup: 'dishes', plate: 'dishes',
  pan: 'cookware', pot: 'cookware', clothes: 'clothing', apparel: 'clothing', footwear: 'shoes',
};
const key = (s: string) => {
  let k = s.toLowerCase().replace(/[^a-z0-9֐-׿]/g, '');
  k = SYNONYMS[k] ?? k;
  if (k.length > 3 && k.endsWith('s') && !k.endsWith('ss')) k = k.slice(0, -1); // plural → singular
  return SYNONYMS[k] ?? k;
};

/**
 * Match the AI's words to a known Category → Sub-category, so the same kind of item always lands in the same place.
 * Unknown words are dropped (left empty to pick), never invented.
 */
export function matchCategory(category: string, subcategory: string): { category: string; subcategory: string } {
  const tax = knownTaxonomy();
  const cats = Object.keys(tax);
  const cat = cats.find((c) => key(c) === key(category));
  const subIn = (c: string) => tax[c].find((s) => key(s) === key(subcategory));
  if (cat && subIn(cat)) return { category: cat, subcategory: subIn(cat)! };
  // The sub-category is known, maybe under another category: trust the sub-category.
  const owners = cats.filter((c) => subIn(c));
  if (owners.length) return { category: owners[0], subcategory: subIn(owners[0])! };
  // Only the category is known.
  if (cat) return { category: cat, subcategory: '' };
  return { category: '', subcategory: '' };
}

