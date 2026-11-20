import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { subscribeHomes } from './data/homes';
import { subscribeItems } from './data/items';
import { subscribePeople } from './data/people';
import { enqueueAutofill, retryAutofill } from './ai/autofill';
import { setCustomCategories } from './ai/classify';
import { useAuth } from '../../core/auth/AuthProvider';
import type { Home, Item } from './types';

interface InventoryValue {
  homes: Home[];
  activeHomes: Home[];
  items: Item[];
  loading: boolean;
  error: string;
  homeName: (id: string) => string;
  /** Names items can belong to, in the order they were added. */
  owners: string[];
  /** The owner new items start with. */
  defaultOwner: string;
  categoriesInUse: string[];
}

const Ctx = createContext<InventoryValue | null>(null);

const uniqSorted = (list: string[]) => [...new Set(list.filter(Boolean))].sort((a, b) => a.localeCompare(b));

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [homes, setHomes] = useState<Home[] | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState('');
  const [people, setPeople] = useState<string[]>([]);
  const { user } = useAuth();
  const me = user?.displayName ?? user?.email ?? '';

  useEffect(() => {
    const offHomes = subscribeHomes(setHomes, (e) => setError(`loading homes: ${e.message}`));
    const offItems = subscribeItems(setItems, (e) => setError(`loading items: ${e.message}`));
    const offPeople = subscribePeople(setPeople, (e) => setError(`loading people: ${e.message}`));
    return () => { offHomes(); offItems(); offPeople(); };
  }, []);

  // Let the AI also choose the categories the family added themselves.
  useEffect(() => { if (items) setCustomCategories(items); }, [items]);

  // Items you quick-added whose details aren't filled in yet (e.g. the app was closed): continue now.
  // Items where filling in failed: try again when their retry time has come (checked every minute).
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 60_000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const mine = items?.filter((it) => it.createdBy === me) ?? [];
    mine.filter((it) => it.aiStatus === 'pending').forEach((it) => enqueueAutofill(it.id));
    // (Up to 3 automatic retries; items that failed before retries existed get one too.)
    mine.filter((it) => it.aiStatus === 'failed' && it.aiAttempts <= 3 && it.aiRetryAt <= Date.now()).forEach((it) => void retryAutofill(it.id));
  }, [items, me, tick]);

  const value = useMemo<InventoryValue>(() => {
    const h = homes ?? [];
    const it = items ?? [];
    const byId = new Map(h.map((x) => [x.id, x]));
    return {
      homes: h,
      activeHomes: h.filter((x) => !x.archived),
      items: it,
      loading: homes === null || items === null,
      error,
      homeName: (id) => byId.get(id)?.name ?? 'Unknown home',
      owners: people.length ? people : ['All'],
      defaultOwner: people.includes('All') ? 'All' : people[0] ?? 'All',
      categoriesInUse: uniqSorted(it.map((x) => x.category)),
    };
  }, [homes, items, error, people]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInventory() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInventory must be used inside InventoryProvider');
  return v;
}
