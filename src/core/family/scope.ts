import { collection, doc } from 'firebase/firestore';
import { db } from '../firebase/app';

/**
 * Every family's data lives under families/{familyId}/... so families never see each other's things.
 * Sections use fcol/fdoc instead of collection/doc to stay inside the signed-in family.
 */
let currentFamilyId = '';

export function setCurrentFamily(id: string) {
  currentFamilyId = id;
}

export function currentFamily() {
  if (!currentFamilyId) throw new Error('No family selected');
  return currentFamilyId;
}

/** A collection inside the current family, e.g. fcol('items'). */
export const fcol = (name: string, ...more: string[]) => collection(db, 'families', currentFamily(), name, ...more);

/** A document inside the current family, e.g. fdoc('config', 'people'). */
export const fdoc = (name: string, ...more: string[]) => doc(db, 'families', currentFamily(), name, ...more);
