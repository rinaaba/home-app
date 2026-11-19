import { onSnapshot, setDoc } from 'firebase/firestore';
import { fdoc } from '../../../core/family/scope';

/** The names items can belong to (e.g. family members, "Kids", "All"). Kept in the database, not in the code. */
const ref = () => fdoc('config', 'people');

export function subscribePeople(cb: (names: string[]) => void, onError: (e: Error) => void) {
  return onSnapshot(ref(), (snap) => cb((snap.data()?.owners as string[] | undefined) ?? []), onError);
}

export function savePeople(names: string[]) {
  return setDoc(ref(), { owners: names }, { merge: true });
}
