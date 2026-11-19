import { Schema } from 'firebase/ai';
import { generateJson } from '../../../core/ai/gemini';
import type { Item } from '../types';

export interface AiAnswer {
  answer: string;
  itemIds: string[];
}

const schema = Schema.object({
  properties: {
    answer: Schema.string({ description: 'A short, friendly answer in one or two sentences, sentence case' }),
    itemIds: Schema.array({ items: Schema.string(), description: 'Ids of the items the answer is about. Empty if none.' }),
  },
});

/** Ask a question about the inventory in plain words ("how many shirts do I have in Deal?"). */
export async function askInventory(question: string, items: Item[], homeName: (id: string) => string, homeNames: string[]): Promise<AiAnswer> {
  // Only text is sent (no pictures), one line per item, to keep it small and fast.
  const lines = items.map((it) =>
    [it.id, it.name, [it.category, it.subcategory].filter(Boolean).join(' > '), it.color, homeName(it.homeId), it.owner, it.notes]
      .map((v) => (v ?? '').replace(/[|\n]/g, ' ').trim())
      .join(' | '),
  );
  const prompt = `You help a family find things in their homes. Their homes: ${homeNames.join(', ')}.
Here is everything they own, one item per line: id | name | category > sub-category | color | home | owner | notes

${lines.join('\n')}

Question: ${question}

Answer only from this list. Understand everyday words and plurals (e.g. "shirts" includes t-shirts and shirts; "tights" may be listed as leggings or stockings). When counting, count the matching items. Mention which home(s) when helpful. If nothing matches, say so kindly. Return the ids of the matching items.`;
  const res = await generateJson<AiAnswer>(prompt, [], schema);
  const known = new Set(items.map((i) => i.id));
  return { answer: res.answer ?? '', itemIds: (res.itemIds ?? []).filter((id) => known.has(id)) };
}
