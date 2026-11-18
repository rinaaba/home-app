import {
  collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, type DocumentData,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../../../core/firebase/app';
import { resizeImage } from '../../../core/images/resize';
import type { Item, ItemDetails, StoredImage } from '../types';

const itemsCol = collection(db, 'items');

function fromDoc(id: string, d: DocumentData): Item {
  return {
    id,
    name: d.name ?? '',
    homeId: d.homeId ?? '',
    room: d.room ?? '',
    category: d.category ?? '',
    subcategory: d.subcategory ?? '',
    owner: d.owner ?? '',
    notes: d.notes ?? '',
    photo: d.photo ?? null,
    clean: d.clean ?? null,
    cleanStatus: d.cleanStatus ?? 'none',
    cleanRequestedAt: d.cleanRequestedAt ?? null,
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
    createdBy: d.createdBy ?? '',
  };
}

export function subscribeItems(cb: (items: Item[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    itemsCol,
    (snap) => cb(snap.docs.map((d) => fromDoc(d.id, d.data()))),
    onError,
  );
}

export function newItemId() {
  return doc(itemsCol).id;
}

/** Upload an image in two sizes: full (for the detail page) and thumbnail (for the gallery). */
export async function uploadImage(itemId: string, name: 'photo' | 'clean', blob: Blob): Promise<StoredImage> {
  const [full, thumb] = await Promise.all([resizeImage(blob, 1600), resizeImage(blob, 480, 0.8)]);
  const path = `items/${itemId}/${name}.jpg`;
  const thumbPath = `items/${itemId}/${name}_thumb.jpg`;
  const meta = { contentType: 'image/jpeg', cacheControl: 'public, max-age=31536000' };
  await Promise.all([uploadBytes(ref(storage, path), full, meta), uploadBytes(ref(storage, thumbPath), thumb, meta)]);
  const [url, thumbUrl] = await Promise.all([getDownloadURL(ref(storage, path)), getDownloadURL(ref(storage, thumbPath))]);
  // Add a version so a regenerated image isn't served from the old cache.
  const v = `&v=${Date.now()}`;
  return { url: url + v, thumbUrl: thumbUrl + v, path, thumbPath };
}

export async function createItem(id: string, details: ItemDetails, photo: StoredImage | null, createdBy: string) {
  await setDoc(doc(itemsCol, id), {
    ...details,
    photo,
    clean: null,
    cleanStatus: photo ? 'pending' : 'none',
    cleanRequestedAt: photo ? serverTimestamp() : null,
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateItem(id: string, changes: Partial<Omit<Item, 'id' | 'createdAt'>> | Record<string, unknown>) {
  return updateDoc(doc(itemsCol, id), { ...changes, updatedAt: serverTimestamp() });
}

export function moveItem(id: string, homeId: string, room: string) {
  return updateItem(id, { homeId, room, movedAt: serverTimestamp() });
}

export async function deleteItem(item: Item) {
  await deleteDoc(doc(itemsCol, item.id));
  const paths = [item.photo, item.clean].flatMap((img) => (img ? [img.path, img.thumbPath] : []));
  await Promise.all(paths.map((p) => deleteObject(ref(storage, p)).catch(() => undefined)));
}
