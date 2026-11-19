import { addDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { fcol } from '../../../core/family/scope';
import type { Home } from '../types';

const homesCol = () => fcol('homes');

export function subscribeHomes(cb: (homes: Home[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(homesCol(), orderBy('sortOrder')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Home, 'id'>) }))),
    onError,
  );
}

export function addHome(name: string, location: string, sortOrder: number) {
  return addDoc(homesCol(), { name, location, sortOrder, archived: false, createdAt: serverTimestamp() });
}

export function updateHome(id: string, changes: Partial<Omit<Home, 'id'>>) {
  return updateDoc(doc(homesCol(), id), changes);
}
