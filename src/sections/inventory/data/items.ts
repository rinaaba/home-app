import {
  collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, type DocumentData,
} from 'firebase/firestore';
import { db } from '../../../core/firebase/app';
import { deleteImage, saveImage } from '../../../core/images/imageStore';
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
    cleanError: d.cleanError ?? '',
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

/** Save one of an item's images (the photo or the clean image). */
export function uploadImage(itemId: string, name: 'photo' | 'clean', blob: Blob): Promise<StoredImage> {
  return saveImage(`items/${itemId}/${name}`, blob);
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
  await Promise.all([item.photo, item.clean].map((img) => (img ? deleteImage(img) : undefined)));
}
