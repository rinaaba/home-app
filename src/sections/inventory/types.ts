import type { Timestamp } from 'firebase/firestore';

export interface Home {
  id: string;
  name: string;
  location: string;
  archived: boolean;
  sortOrder: number;
}

export interface StoredImage {
  url: string;
  thumbUrl: string;
  path: string;
  thumbPath: string;
}

export type CleanStatus = 'none' | 'pending' | 'ready' | 'failed';

export interface Item {
  id: string;
  name: string;
  homeId: string;
  room: string;
  category: string;
  subcategory: string;
  owner: string;
  notes: string;
  /** The photo you took. */
  photo: StoredImage | null;
  /** The AI-generated clean product-style image. */
  clean: StoredImage | null;
  cleanStatus: CleanStatus;
  cleanRequestedAt: Timestamp | null;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
}

/** The fields you fill in on the add/edit form. */
export type ItemDetails = Pick<Item, 'name' | 'homeId' | 'room' | 'category' | 'subcategory' | 'owner' | 'notes'>;
