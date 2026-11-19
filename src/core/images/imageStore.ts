import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, getBlob, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../firebase/app';
import { photoStorage } from '../firebase/config';
import { resizeImage } from './resize';

/**
 * A saved image. Any section can use this to keep pictures.
 * - backend 'storage':  url/thumbUrl are Firebase Storage links.
 * - backend 'database': thumbUrl is the small image itself (data URL); the full image is in the
 *                       Firestore document at `path` and loaded on demand.
 */
export interface StoredImage {
  backend?: 'storage' | 'database';
  url: string;
  thumbUrl: string;
  path: string;
  thumbPath: string;
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/** Resize until the encoded image fits under a Firestore-friendly size. */
async function compactDataUrl(blob: Blob, maxSide: number, quality: number, maxChars: number) {
  for (let side = maxSide, q = quality; side >= 200; side = Math.round(side * 0.8), q = Math.max(0.5, q - 0.1)) {
    const url = await blobToDataUrl(await resizeImage(blob, side, q));
    if (url.length <= maxChars) return url;
  }
  throw new Error('Photo is too large to save');
}

/** Save an image in two sizes (full + thumbnail). `key` is unique per image, e.g. "items/abc/photo". */
export async function saveImage(key: string, blob: Blob): Promise<StoredImage> {
  if (photoStorage === 'database') {
    const [full, thumb] = await Promise.all([
      compactDataUrl(blob, 1024, 0.8, 700_000),
      compactDataUrl(blob, 360, 0.7, 60_000),
    ]);
    const path = `images/${key.replaceAll('/', '_')}`;
    await setDoc(doc(db, path), { data: full });
    return { backend: 'database', url: '', thumbUrl: thumb, path, thumbPath: '' };
  }

  const [full, thumb] = await Promise.all([resizeImage(blob, 1600), resizeImage(blob, 480, 0.8)]);
  const path = `${key}.jpg`;
  const thumbPath = `${key}_thumb.jpg`;
  const meta = { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' };
  await Promise.all([uploadBytes(ref(storage, path), full, meta), uploadBytes(ref(storage, thumbPath), thumb, meta)]);
  const [url, thumbUrl] = await Promise.all([getDownloadURL(ref(storage, path)), getDownloadURL(ref(storage, thumbPath))]);
  // A version marker so a replaced image isn't served from the old cache.
  const v = `&v=${Date.now()}`;
  return { backend: 'storage', url: url + v, thumbUrl: thumbUrl + v, path, thumbPath };
}

/** A URL for showing the full-size image. */
export async function fullImageUrl(img: StoredImage): Promise<string> {
  if (img.backend !== 'database') return img.url;
  const snap = await getDoc(doc(db, img.path));
  return (snap.data()?.data as string | undefined) ?? img.thumbUrl;
}

/** The full-size image as a Blob (e.g. to send to the AI). */
export async function loadImageBlob(img: StoredImage): Promise<Blob> {
  if (img.backend !== 'database') return getBlob(ref(storage, img.path));
  return (await fetch(await fullImageUrl(img))).blob();
}

export async function deleteImage(img: StoredImage) {
  if (img.backend === 'database') {
    await deleteDoc(doc(db, img.path)).catch(() => undefined);
    return;
  }
  await Promise.all([img.path, img.thumbPath].map((p) => deleteObject(ref(storage, p)).catch(() => undefined)));
}
