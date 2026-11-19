import { serverTimestamp } from 'firebase/firestore';
import { generateImage } from '../../../core/ai/gemini';
import { deleteImage, loadImageBlob } from '../../../core/images/imageStore';
import { resizeImage } from '../../../core/images/resize';
import { saveItemImage, updateItem } from '../data/items';
import type { Item, StoredImage } from '../types';

/**
 * The look of every AI picture. Change this text to change the style of the whole gallery.
 */
export const PICTURE_STYLE =
  'a simple, flat-color illustration of the single item, like an icon in a catalog: centered, fully visible, ' +
  'square, plain white background, minimal detail but true to the real color, shape and pattern, no shadows, no text, no people';

/**
 * Make the AI picture from a photo and save it in place of `previous` (the low-res photo copy).
 * Runs in the background; if it fails, the item keeps the photo copy and records why.
 */
export async function makeItemPicture(itemId: string, name: string, photo: Blob, previous: StoredImage | null) {
  try {
    await updateItem(itemId, { imageStatus: 'pending', imageRequestedAt: serverTimestamp(), imageError: '' });
    const input = await resizeImage(photo, 1024);
    const prompt = `Using the attached photo, create ${PICTURE_STYLE}. The item is: ${name}.`;
    const picture = await generateImage(prompt, [input]);
    const image = await saveItemImage(itemId, picture);
    await updateItem(itemId, { image, imageKind: 'ai', imageStatus: 'ready', imageError: '' });
    if (previous) await deleteImage(previous); // the photo copy isn't needed anymore
  } catch (err) {
    console.error('AI picture failed', err);
    await updateItem(itemId, { imageStatus: 'failed', imageError: friendlyError(err) }).catch(() => undefined);
  }
}

/** Retry for an item that still shows a photo copy. */
export async function retryItemPicture(item: Item) {
  if (!item.image || item.imageKind !== 'photo') return;
  await makeItemPicture(item.id, item.name, await loadImageBlob(item.image), item.image);
}

/** A "pending" picture older than 3 minutes most likely stopped (e.g. the app was closed). */
export function isStuck(item: Item) {
  if (item.imageStatus !== 'pending' || !item.imageRequestedAt) return false;
  return Date.now() - item.imageRequestedAt.toMillis() > 3 * 60 * 1000;
}

function friendlyError(err: unknown) {
  const msg = String((err as Error)?.message ?? err);
  const lower = msg.toLowerCase();
  if (['quota', 'billing', '429', 'free tier', 'resource_exhausted'].some((w) => lower.includes(w))) {
    return 'AI pictures need the pay-as-you-go plan (or the daily free limit was reached).';
  }
  return msg.slice(0, 200);
}

// Make AI pictures one at a time, so adding many items at once doesn't hit the AI's rate limit.
let pictureQueue: Promise<void> = Promise.resolve();
export function queueItemPicture(itemId: string, name: string, photo: Blob, previous: StoredImage | null) {
  pictureQueue = pictureQueue.then(() => makeItemPicture(itemId, name, photo, previous));
}
