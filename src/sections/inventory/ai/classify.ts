import { Schema } from 'firebase/ai';
import { generateJson, isRateLimited } from '../../../core/ai/gemini';
import { knownTaxonomy, matchCategory } from '../categoryMatch';

export { setCustomCategories } from '../categoryMatch';

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

const schema = Schema.object({
  properties: {
    name: Schema.string({ description: 'Short everyday name, sentence case, e.g. "Linen shirt" or "Striped t-shirt"' }),
    category: Schema.string({ description: 'Category, copied exactly from the list' }),
    subcategory: Schema.string({ description: 'Sub-category, copied exactly from the list, belonging to that category' }),
    color: Schema.string({ description: 'Main color in plain words, sentence case, e.g. "Navy blue", "Black and white"' }),
    colorHex: Schema.string({ description: 'The main color as a hex code like #1f2a44' }),
    notes: Schema.string({ description: 'Brand, size, material or other useful details visible in the photo. Short. Empty if none.' }),
    box: Schema.array({
      items: Schema.integer(),
      description: 'Bounding box of the main item as [ymin, xmin, ymax, xmax], each 0-1000 relative to the image size. Include the whole item.',
    }),
  },
});

export async function classifyPhoto(photo: Blob): Promise<Guess> {
  const tax = knownTaxonomy();
  const list = Object.entries(tax).map(([cat, subs]) => `${cat}: ${subs.join(', ')}`).join('\n');
  const prompt = `You help a family catalog household items. Look at the photo and identify the main item.

Choose the category and sub-category from this list. Copy the words exactly, and the sub-category must belong to that category:
${list}

Always choose the closest match, even if it isn't perfect: for example a blouse or tank top is Clothing / Top, a toaster is Kitchen / Small appliance.
Use sentence case for the name, color and notes. Keep the name short (2-4 words) and don't repeat the color in the name.`;
  // The free plan allows only a few AI requests per minute; wait and retry when we hit that.
  let g: Guess | undefined;
  for (let attempt = 1; !g; attempt++) {
    try {
      g = await generateJson<Guess>(prompt, [photo], schema);
    } catch (err) {
      if (!isRateLimited(err) || attempt >= 3) throw err;
      await new Promise((r) => setTimeout(r, attempt * 15_000));
    }
  }
  return {
    name: g.name ?? '',
    ...matchCategory(g.category ?? '', g.subcategory ?? ''),
    color: g.color ?? '',
    colorHex: /^#[0-9a-f]{6}$/i.test(g.colorHex ?? '') ? g.colorHex : '',
    notes: g.notes ?? '',
    box: g.box,
  };
}
