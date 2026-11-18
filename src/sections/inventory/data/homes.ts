import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase/app';
import { DEFAULT_HOMES } from '../taxonomy';
import type { Home } from '../types';

const homesCol = collection(db, 'homes');

export function subscribeHomes(cb: (homes: Home[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(homesCol, orderBy('sortOrder')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Home, 'id'>) }))),
    onError,
  );
}

/** First run: create the three homes. Uses fixed IDs, so running it twice is harmless. */
export async function seedHomesIfEmpty() {
  const snap = await getDocs(homesCol);
  if (!snap.empty) return;
  await Promise.all(
    DEFAULT_HOMES.map((h) =>
      setDoc(doc(homesCol, h.id), { name: h.name, location: h.location, sortOrder: h.sortOrder, archived: false, createdAt: serverTimestamp() }),
    ),
  );
}

export function addHome(name: string, location: string, sortOrder: number) {
  return addDoc(homesCol, { name, location, sortOrder, archived: false, createdAt: serverTimestamp() });
}

export function updateHome(id: string, changes: Partial<Omit<Home, 'id'>>) {
  return updateDoc(doc(homesCol, id), changes);
}
