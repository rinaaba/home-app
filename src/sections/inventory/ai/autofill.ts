import { describeAiError } from '../../../core/ai/gemini';
import { cropToItem } from '../../../core/images/crop';
import { cutOutItem } from '../../../core/images/cutout';
import { deleteImage, loadImageBlob } from '../../../core/images/imageStore';
import { getItem, saveItemImage, updateItem } from '../data/items';
import { classifyPhoto } from './classify';

/**
 * After a quick add, the AI fills in each item's details in the background, one item at a time
 * (gentle on the free AI limits), and the picture is upgraded to the cut-out.
 * If the app is closed before it's done, it picks up again next time (using the saved picture).
 */
const photos = new Map<string, Blob>(); // the full photos taken in this session (better than the saved small picture)
const queued = new Set<string>();
let chain: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();
const RETRY_MINUTES = [2, 10, 60];

/** Try filling in an item again (automatically after a failure, or when you tap "Try again"). */
export async function retryAutofill(itemId: string, fromScratch = false) {
  if (queued.has(itemId) || retrying.has(itemId)) return;
  retrying.add(itemId);
  await updateItem(itemId, { aiStatus: 'pending', aiError: '', ...(fromScratch ? { aiAttempts: 0, aiRetryAt: 0 } : {}) });
  retrying.delete(itemId);
  enqueueAutofill(itemId);
}
const retrying = new Set<string>();

const held = new Set<string>();

/** Items still being saved by the add screen: don't start on them yet (it hands them over with the full photo). */
export function holdAutofill(itemId: string) {
  held.add(itemId);
}

export function enqueueAutofill(itemId: string, photo?: Blob) {
  if (photo) { photos.set(itemId, photo); held.delete(itemId); }
  if (held.has(itemId) || queued.has(itemId)) return;
  queued.add(itemId);
  listeners.forEach((l) => l());
  chain = chain.then(() => fill(itemId)).catch(() => undefined);
}

/** How many items are still waiting to be filled in on this device. */
export const autofillPending = () => queued.size;
export function onAutofillChange(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))]);

/**
 * Crash guard for the on-device cut-out: if the app ever closes in the middle of one (e.g. the phone ran out of
 * memory), it stays off on this device and the plain crop is used instead.
 */
const CUTOUT_RUNNING = 'cutout.running';
const CUTOUT_OFF = 'cutout.off';
const store = {
  get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
if (store.get(CUTOUT_RUNNING)) { store.set(CUTOUT_OFF, '1'); store.del(CUTOUT_RUNNING); }
const cutoutAllowed = () => !store.get(CUTOUT_OFF);
/** For Settings: whether this device removes backgrounds, and a way to turn it back on (or off). */
export const isCutoutOn = cutoutAllowed;
export const setCutoutOn = (on: boolean) => (on ? store.del(CUTOUT_OFF) : store.set(CUTOUT_OFF, '1'));

/** One item must not hold up the rest: give up on it after 3 minutes (it's retried later). */
const ITEM_TIME_LIMIT = 3 * 60_000;

async function fill(id: string) {
  try {
    const finished = await withTimeout(fillOne(id).then(() => true), ITEM_TIME_LIMIT);
    if (!finished) await markFailed(id, new Error('The AI took too long to answer'));
  } finally {
    photos.delete(id);
    queued.delete(id);
    listeners.forEach((l) => l());
  }
}

/** Record a failure; it's tried again by itself after 2 minutes, then 10 minutes, then an hour. */
async function markFailed(id: string, e: unknown) {
  const item = await getItem(id).catch(() => null);
  if (!item || item.aiStatus !== 'pending') return;
  const attempts = item.aiAttempts + 1;
  const wait = RETRY_MINUTES[attempts - 1];
  await updateItem(id, {
    aiStatus: 'failed',
    aiError: describeAiError(e),
    aiAttempts: attempts,
    aiRetryAt: wait ? Date.now() + wait * 60_000 : 0,
  }).catch(() => undefined);
}

async function fillOne(id: string) {
  const item = await getItem(id);
  if (!item || item.aiStatus !== 'pending') return;
  const photo = photos.get(id) ?? (item.image ? await loadImageBlob(item.image).catch(() => null) : null);
  if (!photo) {
    await updateItem(id, { aiStatus: 'failed', aiError: 'No picture to look at.', aiAttempts: 99, aiRetryAt: 0 });
    return;
  }

  // 1. The details first, so they never wait on the picture.
  let box: number[] | undefined;
  try {
    const g = await classifyPhoto(photo);
    box = g.box;
    // Fill in only what's still empty, in case someone edited the item meanwhile.
    const now = (await getItem(id)) ?? item;
    const pick = (current: string, guess: string) => current || guess || '';
    await updateItem(id, {
      name: pick(now.name, g.name),
      category: pick(now.category, g.category),
      subcategory: pick(now.subcategory, g.subcategory),
      color: pick(now.color, g.color),
      colorHex: pick(now.colorHex, g.colorHex),
      notes: pick(now.notes, g.notes),
      aiStatus: 'done',
      aiError: '',
      aiAttempts: 0,
      aiRetryAt: 0,
    });
  } catch (e) {
    await markFailed(id, e);
  }

  // 2. Then a better picture: the cut-out (if this device handles it), or else a crop around the item.
  let picture: Blob | null = null;
  if (cutoutAllowed()) {
    store.set(CUTOUT_RUNNING, id);
    picture = await withTimeout(cutOutItem(photo).catch(() => null), 30_000);
    store.del(CUTOUT_RUNNING);
  }
  picture ??= box ? await cropToItem(photo, box).catch(() => null) : null;
  const latest = await getItem(id);
  if (picture && latest && latest.imageKind === 'photo') {
    const image = await saveItemImage(id, picture);
    await updateItem(id, { image });
    if (latest.image) await deleteImage(latest.image);
  }
}
