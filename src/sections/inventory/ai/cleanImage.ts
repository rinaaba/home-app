import { serverTimestamp } from 'firebase/firestore';
import { getBlob, ref } from 'firebase/storage';
import { generateImage } from '../../../core/ai/gemini';
import { storage } from '../../../core/firebase/app';
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
    await updateItem(itemId, { cleanStatus: 'pending', cleanRequestedAt: serverTimestamp() });
    const input = await resizeImage(photo, 1024);
    const prompt = `Using the attached photo, create ${CLEAN_IMAGE_STYLE}. The item is: ${name}. Keep its real color, shape, material and details exactly as in the photo.`;
    const image = await generateImage(prompt, [input]);
    const clean = await uploadImage(itemId, 'clean', image);
    await updateItem(itemId, { clean, cleanStatus: 'ready' });
  } catch (err) {
    console.error('Clean image failed', err);
    await updateItem(itemId, { cleanStatus: 'failed' }).catch(() => undefined);
  }
}

/** Re-run generation for an existing item, using its stored photo. */
export async function regenerateCleanImage(item: Item) {
  if (!item.photo) return;
  const photo = await getBlob(ref(storage, item.photo.path));
  await generateCleanImage(item.id, item.name, photo);
}

/** A "pending" image older than 3 minutes most likely stopped (e.g. the app was closed). */
export function isStuck(item: Item) {
  if (item.cleanStatus !== 'pending' || !item.cleanRequestedAt) return false;
  return Date.now() - item.cleanRequestedAt.toMillis() > 3 * 60 * 1000;
}
