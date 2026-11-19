import {
  deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, type DocumentData,
} from 'firebase/firestore';
import { currentFamily, fcol } from '../../../core/family/scope';
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
    imageStatus: fallback ? 'pending' : 'none',
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
