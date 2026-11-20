import {
  getDoc,
  deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, type DocumentData,
} from 'firebase/firestore';
import { currentFamily, fcol } from '../../../core/family/scope';
import { aiPictures } from '../../../core/firebase/config';
import { deleteImage, saveImage } from '../../../core/images/imageStore';
import type { Item, ItemDetails, StoredImage } from '../types';

const itemsCol = () => fcol('items');

function fromDoc(id: string, d: DocumentData): Item {
  return {
    id,
    name: d.name ?? '',
    homeId: d.homeId ?? '',
    category: d.category ?? '',
    subcategory: d.subcategory ?? '',
    color: d.color ?? '',
    colorHex: d.colorHex ?? '',
    owner: d.owner ?? '',
    notes: d.notes ?? '',
    image: d.image ?? null,
    imageKind: d.imageKind ?? null,
    imageStatus: d.imageStatus ?? 'none',
    imageRequestedAt: d.imageRequestedAt ?? null,
    imageError: d.imageError ?? '',
    aiStatus: d.aiStatus ?? 'done',
    aiError: d.aiError ?? '',
    aiAttempts: d.aiAttempts ?? 0,
    aiRetryAt: d.aiRetryAt ?? 0,
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
    createdBy: d.createdBy ?? '',
  };
}

export function subscribeItems(cb: (items: Item[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    itemsCol(),
    (snap) => cb(snap.docs.map((d) => fromDoc(d.id, d.data()))),
    onError,
  );
}

export function newItemId() {
  return doc(itemsCol()).id;
}

export function saveItemImage(itemId: string, blob: Blob): Promise<StoredImage> {
  return saveImage(`families/${currentFamily()}/items/${itemId}/image`, blob);
}

/** `fallback` is a low-res copy of the photo, shown until (or instead of) the AI picture. */
export async function createItem(id: string, details: ItemDetails, fallback: StoredImage | null, createdBy: string) {
  await setDoc(doc(itemsCol(), id), {
    ...details,
    image: fallback,
    imageKind: fallback ? 'photo' : null,
    imageStatus: fallback ? (aiPictures ? 'pending' : 'ready') : 'none',
    imageRequestedAt: fallback ? serverTimestamp() : null,
    imageError: '',
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function updateItem(id: string, changes: Partial<Omit<Item, 'id' | 'createdAt'>> | Record<string, unknown>) {
  return updateDoc(doc(itemsCol(), id), { ...changes, updatedAt: serverTimestamp() });
}

export function moveItem(id: string, homeId: string) {
  return updateItem(id, { homeId, movedAt: serverTimestamp() });
}

export async function removeItemImage(item: Item) {
  await updateItem(item.id, { image: null, imageKind: null, imageStatus: 'none', imageError: '' });
  if (item.image) await deleteImage(item.image);
}

export async function deleteItem(item: Item) {
  await deleteDoc(doc(itemsCol(), item.id));
  if (item.image) await deleteImage(item.image);
}

/** Use a picture you made elsewhere (e.g. in the Gemini app) as the item's picture. */
export async function replaceItemImage(item: Item, picture: Blob) {
  const image = await saveImage(`families/${currentFamily()}/items/${item.id}/image`, picture);
  await updateItem(item.id, { image, imageKind: 'own', imageStatus: 'ready', imageError: '' });
  if (item.image) await deleteImage(item.image);
}

export async function getItem(id: string): Promise<Item | null> {
  const snap = await getDoc(doc(itemsCol(), id));
  return snap.exists() ? fromDoc(snap.id, snap.data()) : null;
}

/** Quick add: save the item right away with its picture; the AI fills in the details afterwards. */
export async function createQuickItem(id: string, homeId: string, owner: string, image: StoredImage | null, createdBy: string) {
  await setDoc(doc(itemsCol(), id), {
    name: '', homeId, owner, category: '', subcategory: '', color: '', colorHex: '', notes: '',
    image, imageKind: image ? 'photo' : null, imageStatus: image ? 'ready' : 'none', imageRequestedAt: null, imageError: '',
    aiStatus: 'pending', aiError: '', aiAttempts: 0, aiRetryAt: 0,
    createdBy, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  });
}
