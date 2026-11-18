import { Schema } from 'firebase/ai';
import { generateJson } from '../../../core/ai/gemini';
import { TAXONOMY } from '../taxonomy';

export interface Guess {
  name: string;
  category: string;
  subcategory: string;
  room: string;
  notes: string;
}

const schema = Schema.object({
  properties: {
    name: Schema.string({ description: 'Short everyday name, sentence case, e.g. "Blue linen shirt" or "Blender"' }),
    category: Schema.string(),
    subcategory: Schema.string(),
    room: Schema.string({ description: 'Most likely room it belongs in, or empty' }),
    notes: Schema.string({ description: 'Brand, color, size or other useful details visible in the photo. Short. Empty if none.' }),
  },
});

export async function classifyPhoto(photo: Blob): Promise<Guess> {
  const taxonomy = Object.entries(TAXONOMY)
    .map(([cat, subs]) => `${cat}: ${subs.join(', ')}`)
    .join('\n');
  const prompt = `You help a family catalog household items. Look at the photo and identify the main item.
Pick the category and sub-category from this list when one fits. If nothing fits, suggest a short new one in sentence case.
${taxonomy}

Use sentence case for every value. Keep the name short (2-4 words).`;
  return generateJson<Guess>(prompt, [photo], schema);
}
