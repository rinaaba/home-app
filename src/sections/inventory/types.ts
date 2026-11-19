import type { Timestamp } from 'firebase/firestore';
import type { StoredImage } from '../../core/images/imageStore';

export type { StoredImage };

export interface Home {
  id: string;
  name: string;
  location: string;
  archived: boolean;
  sortOrder: number;
  /** Color name, e.g. "sand" (optional; a default is picked per home). */
  accent?: string;
  /** Icon name, e.g. "waves" (optional). */
  icon?: string;
}

/**
 * - none:    no picture (e.g. socks: a color tile is shown instead)
 * - pending: the AI is making a picture
 * - ready:   the AI picture is there
 * - failed:  the AI picture didn't work; a small copy of the photo is shown instead
 */
export type ImageStatus = 'none' | 'pending' | 'ready' | 'failed';

export interface Item {
  id: string;
  name: string;
  homeId: string;
  room: string;
  category: string;
  subcategory: string;
  /** Color in words, e.g. "Navy blue". */
  color: string;
  /** The same color as a hex code, used for the color tile, e.g. "#1f2a44". */
  colorHex: string;
  owner: string;
  notes: string;
  /** The one small picture: AI-made, or a low-res copy of the photo if the AI picture failed. */
  image: StoredImage | null;
  imageKind: 'ai' | 'photo' | null;
  imageStatus: ImageStatus;
  imageRequestedAt: Timestamp | null;
  imageError: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
}

/** The fields you fill in on the add/edit form. */
export type ItemDetails = Pick<
  Item,
  'name' | 'homeId' | 'room' | 'category' | 'subcategory' | 'color' | 'colorHex' | 'owner' | 'notes'
>;
