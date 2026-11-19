import { Schema } from 'firebase/ai';
import { generateJson } from '../../../core/ai/gemini';
import { TAXONOMY } from '../taxonomy';

export interface Guess {
  name: string;
  category: string;
  subcategory: string;
  color: string;
  colorHex: string;
  room: string;
  notes: string;
}

const schema = Schema.object({
  properties: {
    name: Schema.string({ description: 'Short everyday name, sentence case, e.g. "Linen shirt" or "Blender"' }),
    category: Schema.string(),
    subcategory: Schema.string(),
    color: Schema.string({ description: 'Main color in plain words, sentence case, e.g. "Navy blue", "Black and white"' }),
    colorHex: Schema.string({ description: 'The main color as a hex code like #1f2a44' }),
    room: Schema.string({ description: 'Most likely room it belongs in, or empty' }),
    notes: Schema.string({ description: 'Brand, size, material or other useful details visible in the photo. Short. Empty if none.' }),
  },
});

export async function classifyPhoto(photo: Blob): Promise<Guess> {
  const taxonomy = Object.entries(TAXONOMY)
    .map(([cat, subs]) => `${cat}: ${subs.join(', ')}`)
    .join('\n');
  const prompt = `You help a family catalog household items. Look at the photo and identify the main item.
Pick the category and sub-category from this list when one fits. If nothing fits, suggest a short new one in sentence case.
${taxonomy}

Use sentence case for every value. Keep the name short (2-4 words) and don't repeat the color in the name.`;
  const g = await generateJson<Guess>(prompt, [photo], schema);
  return { ...g, colorHex: /^#[0-9a-f]{6}$/i.test(g.colorHex ?? '') ? g.colorHex : '' };
}
