import { serverTimestamp } from 'firebase/firestore';
import { generateImage } from '../../../core/ai/gemini';
import { loadImageBlob } from '../../../core/images/imageStore';
import { resizeImage } from '../../../core/images/resize';
import { updateItem, uploadImage } from '../data/items';
import type { Item } from '../types';

/**
 * The look of every generated item image. Change this text to change the style of the whole gallery.
 */
export const CLEAN_IMAGE_STYLE =
  'a clean catalog-style product photo: the single item only, centered, fully visible, square framing, ' +
  'plain soft light-gray background, soft even studio lighting, gentle shadow, no people, no hands, no text, no logos added';

/** Generate the clean image for an item and save it. Runs in the background; errors are recorded on the item. */
export async function generateCleanImage(itemId: string, name: string, photo: Blob) {
  try {
    await updateItem(itemId, { cleanStatus: 'pending', cleanRequestedAt: serverTimestamp(), cleanError: '' });
    const input = await resizeImage(photo, 1024);
    const prompt = `Using the attached photo, create ${CLEAN_IMAGE_STYLE}. The item is: ${name}. Keep its real color, shape, material and details exactly as in the photo.`;
    const image = await generateImage(prompt, [input]);
    const clean = await uploadImage(itemId, 'clean', image);
    await updateItem(itemId, { clean, cleanStatus: 'ready', cleanError: '' });
  } catch (err) {
    console.error('Clean image failed', err);
    await updateItem(itemId, { cleanStatus: 'failed', cleanError: friendlyError(err) }).catch(() => undefined);
  }
}

/** Re-run generation for an existing item, using its stored photo. */
export async function regenerateCleanImage(item: Item) {
  if (!item.photo) return;
  const photo = await loadImageBlob(item.photo);
  await generateCleanImage(item.id, item.name, photo);
}

/** A "pending" image older than 3 minutes most likely stopped (e.g. the app was closed). */
export function isStuck(item: Item) {
  if (item.cleanStatus !== 'pending' || !item.cleanRequestedAt) return false;
  return Date.now() - item.cleanRequestedAt.toMillis() > 3 * 60 * 1000;
}

function friendlyError(err: unknown) {
  const msg = String((err as Error)?.message ?? err);
  const lower = msg.toLowerCase();
  if (lower.includes('quota') || lower.includes('billing') || lower.includes('429') || lower.includes('free tier') || lower.includes('resource_exhausted')) {
    return 'AI pictures need the pay-as-you-go plan (or the daily free limit was reached).';
  }
  return msg.slice(0, 200);
}
