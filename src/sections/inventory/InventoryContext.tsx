import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seedHomesIfEmpty, subscribeHomes } from './data/homes';
import { subscribeItems } from './data/items';
import { subscribePeople } from './data/people';
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

  useEffect(() => {
    seedHomesIfEmpty().catch((e) => setError(e.message));
    const offHomes = subscribeHomes(setHomes, (e) => setError(e.message));
    const offItems = subscribeItems(setItems, (e) => setError(e.message));
    const offPeople = subscribePeople(setPeople, (e) => setError(e.message));
    return () => { offHomes(); offItems(); offPeople(); };
  }, []);

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
