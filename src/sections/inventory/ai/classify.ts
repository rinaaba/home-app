import { Schema } from 'firebase/ai';
import { generateJson, isRateLimited } from '../../../core/ai/gemini';
import { TAXONOMY } from '../taxonomy';

export interface Guess {
  name: string;
  category: string;
  subcategory: string;
  color: string;
  colorHex: string;
  notes: string;
  /** Where the item is in the photo: [ymin, xmin, ymax, xmax], 0–1000. */
  box?: number[];
}

const schemaWith = (kinds: string[]) => Schema.object({
  properties: {
    kind: Schema.enumString({ enum: kinds, description: 'The category and sub-category, exactly one option from the list' }),
    name: Schema.string({ description: 'Short everyday name, sentence case, e.g. "Linen shirt" or "Striped t-shirt"' }),
    color: Schema.string({ description: 'Main color in plain words, sentence case, e.g. "Navy blue", "Black and white"' }),
    colorHex: Schema.string({ description: 'The main color as a hex code like #1f2a44' }),
    notes: Schema.string({ description: 'Brand, size, material or other useful details visible in the photo. Short. Empty if none.' }),
    box: Schema.array({
      items: Schema.integer(),
      description: 'Bounding box of the main item as [ymin, xmin, ymax, xmax], each 0-1000 relative to the image size. Include the whole item.',
    }),
  },
});

const SEP = ' > ';
const OTHER = `Other${SEP}Other`;

/** Category/sub-category pairs the family added themselves, so the AI can choose them too. Set by the inventory. */
let customPairs: string[] = [];
export function setCustomCategories(pairs: { category: string; subcategory: string }[]) {
  customPairs = pairs.filter((p) => p.category && p.subcategory).map((p) => `${p.category}${SEP}${p.subcategory}`);
}

/** Every option the AI may choose from: the standard list plus the family's own, each exactly once. */
function kindOptions() {
  const standard = Object.entries(TAXONOMY).flatMap(([cat, subs]) => subs.map((s) => `${cat}${SEP}${s}`));
  return [...new Set([...standard, ...customPairs, OTHER])];
}

export async function classifyPhoto(photo: Blob): Promise<Guess> {
  const kinds = kindOptions();
  const schema = schemaWith(kinds);
  const prompt = `You help a family catalog household items. Look at the photo and identify the main item.

For "kind", choose the single best option from the allowed list, written exactly as it appears there ("Category > Sub-category").
Always choose the closest match, even if it isn't perfect: for example a blouse or tank top is "Clothing > Top", a toaster is "Kitchen > Small appliance".
Choose "${OTHER}" only if nothing in the list is even close.

Use sentence case for the name, color and notes. Keep the name short (2-4 words) and don't repeat the color in the name.`;
  // The free plan allows only a few AI requests per minute; wait and retry when we hit that.
  let g: (Omit<Guess, 'category' | 'subcategory'> & { kind?: string }) | undefined;
  for (let attempt = 1; !g; attempt++) {
    try {
      g = await generateJson<Guess>(prompt, [photo], schema);
    } catch (err) {
      if (!isRateLimited(err) || attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, attempt * 15_000));
    }
  }
  const [category = '', subcategory = ''] = kinds.includes(g.kind ?? '') ? (g.kind as string).split(SEP) : [];
  const isOther = g.kind === OTHER || !category;
  return {
    name: g.name ?? '',
    // "Other" means the AI found no match: leave category empty so you can pick one.
    category: isOther ? '' : category,
    subcategory: isOther ? '' : subcategory,
    color: g.color ?? '',
    colorHex: /^#[0-9a-f]{6}$/i.test(g.colorHex ?? '') ? g.colorHex : '',
    notes: g.notes ?? '',
    box: g.box,
  };
}
