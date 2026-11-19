import { deleteObject, getBlob, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/app';
import { photoStorage } from '../firebase/config';
import { resizeImage } from './resize';

/**
 * One small saved picture. Any section can use this.
 * - backend 'database': `url` is the picture itself (a data URL), stored right inside the document. Free plan.
 * - backend 'storage':  `url` is a Firebase Storage link, `path` is the file. Paid plan.
 */
export interface StoredImage {
  backend: 'database' | 'storage';
  url: string;
  path: string;
}

/** Pictures are kept small on purpose: they only need to be recognizable in the gallery. */
const MAX_SIDE = 400;

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

/** Shrink until it fits comfortably inside a database document. */
async function compactDataUrl(blob: Blob, maxChars = 80_000) {
  for (let side = MAX_SIDE, q = 0.75; side >= 160; side = Math.round(side * 0.8), q = Math.max(0.5, q - 0.08)) {
    const url = await blobToDataUrl(await resizeImage(blob, side, q));
    if (url.length <= maxChars) return url;
  }
  throw new Error('Picture is too large to save');
}

/** Save a picture. `key` is unique per picture, e.g. "items/abc/image". */
export async function saveImage(key: string, blob: Blob): Promise<StoredImage> {
  if (photoStorage === 'database') {
    return { backend: 'database', url: await compactDataUrl(blob), path: '' };
  }
  // A new file name each time, so a replaced picture is never served from an old cache.
  const path = `${key}_${Date.now()}.jpg`;
  await uploadBytes(ref(storage, path), await resizeImage(blob, MAX_SIDE, 0.8), {
    contentType: 'image/jpeg',
    cacheControl: 'public, max-age=31536000',
  });
  return { backend: 'storage', url: await getDownloadURL(ref(storage, path)), path };
}

/** The picture as a Blob (e.g. to send to the AI). */
export async function loadImageBlob(img: StoredImage): Promise<Blob> {
  if (img.backend === 'storage') return getBlob(ref(storage, img.path));
  return (await fetch(img.url)).blob();
}

export async function deleteImage(img: StoredImage) {
  if (img.backend === 'storage') await deleteObject(ref(storage, img.path)).catch(() => undefined);
  // 'database' pictures live inside the document and disappear with it.
}
