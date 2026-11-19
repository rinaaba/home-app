import { doc, getDoc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../firebase/app';
import { currentFamily } from '../family/scope';

/**
 * Daily AI limits, so one family can't use up the app's shared AI allowance.
 * - The original family ("main") has no limit.
 * - Other families get DEFAULT_DAILY_LIMIT, unless another number is set in limits/{familyId}
 *   (in the Firebase console: Firestore → limits → document named after the family id → field daily).
 * The database rules enforce the same numbers (keep them in sync with firestore.rules).
 */
export const DEFAULT_DAILY_LIMIT = 50;
export const UNLIMITED_FAMILY = 'main';

export class AiLimitReached extends Error {}

export const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const usageRef = (familyId: string, day = todayKey()) => doc(db, 'families', familyId, 'usage', day);
const limitRef = (familyId: string) => doc(db, 'limits', familyId);

export async function getDailyLimit(familyId: string): Promise<number> {
  if (familyId === UNLIMITED_FAMILY) return Infinity;
  const snap = await getDoc(limitRef(familyId)).catch(() => null);
  const n = snap?.data()?.daily;
  return typeof n === 'number' ? n : DEFAULT_DAILY_LIMIT;
}

/** Count one AI request for the current family, or refuse if today's limit is reached. */
export async function countAiRequest() {
  const familyId = currentFamily();
  const limit = await getDailyLimit(familyId);
  await runTransaction(db, async (tx) => {
    const ref = usageRef(familyId);
    const snap = await tx.get(ref);
    const count = (snap.data()?.count as number | undefined) ?? 0;
    if (count >= limit) {
      throw new AiLimitReached(
        limit === 0
          ? 'AI is turned off for your family. Ask the app’s owner to turn it on.'
          : `Your family used today’s ${limit} AI requests. It resets tomorrow.`,
      );
    }
    tx.set(ref, { count: count + 1 });
  });
}

/** Live count of today's AI requests for a family. */
export function subscribeTodayUsage(familyId: string, cb: (count: number) => void) {
  return onSnapshot(usageRef(familyId), (s) => cb((s.data()?.count as number | undefined) ?? 0), () => cb(0));
}


