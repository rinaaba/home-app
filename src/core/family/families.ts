import {
  addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp,
  setDoc, updateDoc, where, writeBatch, type DocumentData,
} from 'firebase/firestore';
import { db } from '../firebase/app';

export interface Family {
  id: string;
  name: string;
  members: string[];
}

const familiesCol = collection(db, 'families');
const toFamily = (id: string, d: DocumentData): Family => ({ id, name: d.name ?? 'Family', members: d.members ?? [] });

/** Families this email belongs to. */
export function subscribeMyFamilies(email: string, cb: (f: Family[]) => void, onError: (e: Error) => void) {
  return onSnapshot(
    query(familiesCol, where('members', 'array-contains', email)),
    { includeMetadataChanges: true },
    (snap) => {
      // An empty answer from the offline cache isn't final: wait for the server.
      if (snap.empty && snap.metadata.fromCache) return;
      cb(snap.docs.map((d) => toFamily(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name)));
    },
    onError,
  );
}

export async function createFamily(name: string, email: string) {
  const ref = await addDoc(familiesCol, { name, members: [email], createdBy: email, createdAt: serverTimestamp() });
  return ref.id;
}

export function renameFamily(id: string, name: string) {
  return updateDoc(doc(familiesCol, id), { name });
}

/** Invite someone: they can then sign in to the app and land in this family. */
export async function addMember(familyId: string, email: string, invitedBy: string) {
  const e = email.trim().toLowerCase();
  await updateDoc(doc(familiesCol, familyId), { members: arrayUnion(e) });
  await setDoc(doc(db, 'invites', e), { familyId, invitedBy, createdAt: serverTimestamp() });
}

/** Invite a friend to use the app with their own, separate family space. */
export function inviteFriend(email: string, invitedBy: string) {
  const e = email.trim().toLowerCase();
  return setDoc(doc(db, 'invites', e), { familyId: '', invitedBy, createdAt: serverTimestamp() }, { merge: true });
}

/** Whether this email is on the app's access list (only they can invite friends). */
export async function isOnAccessList(email: string) {
  try {
    const snap = await getDoc(doc(db, 'config', 'access'));
    return ((snap.data()?.emails as string[] | undefined) ?? []).map((x) => x.toLowerCase()).includes(email);
  } catch {
    return false;
  }
}

export async function removeMember(familyId: string, email: string) {
  await updateDoc(doc(familiesCol, familyId), { members: arrayRemove(email) });
  await deleteDoc(doc(db, 'invites', email)).catch(() => undefined);
}

/**
 * One-time move: before families existed, everything was stored at the top level (homes, items, config/people).
 * Copy it into a family (fixed id "main", so two people opening the app at once can't make two), then delete the old copy.
 * Returns true if there was something to move.
 */
export async function migrateLegacyData(): Promise<boolean> {
  let homes, items;
  try {
    [homes, items] = await Promise.all([getDocs(collection(db, 'homes')), getDocs(collection(db, 'items'))]);
  } catch {
    return false; // not allowed to see old data (e.g. an invited friend): nothing to move
  }
  if (homes.empty && items.empty) return false;

  // The members are everyone on the app's access list at the time of the move (the original family).
  const access = await getDoc(doc(db, 'config', 'access'));
  const members = ((access.data()?.emails as string[] | undefined) ?? []).map((e) => e.toLowerCase());
  const familyRef = doc(familiesCol, 'main');
  const existing = await getDoc(familyRef).catch(() => null);
  if (!existing?.exists()) {
    await setDoc(familyRef, { name: 'Our family', members, createdAt: serverTimestamp(), migrated: true });
  }

  const people = await getDoc(doc(db, 'config', 'people'));
  const copies: [string[], DocumentData][] = [
    ...homes.docs.map((d) => [['homes', d.id], d.data()] as [string[], DocumentData]),
    ...items.docs.map((d) => [['items', d.id], d.data()] as [string[], DocumentData]),
    ...(people.exists() ? [[['config', 'people'], people.data()] as [string[], DocumentData]] : []),
  ];
  // Small batches: items carry their small picture, and a batch has a size limit.
  for (let i = 0; i < copies.length; i += 40) {
    const batch = writeBatch(db);
    copies.slice(i, i + 40).forEach(([path, data]) => batch.set(doc(db, 'families', 'main', ...(path as [string, string])), data));
    await batch.commit();
  }
  const olds = [...homes.docs.map((d) => d.ref), ...items.docs.map((d) => d.ref), ...(people.exists() ? [people.ref] : [])];
  for (let i = 0; i < olds.length; i += 200) {
    const batch = writeBatch(db);
    olds.slice(i, i + 200).forEach((r) => batch.delete(r));
    await batch.commit();
  }
  return true;
}
