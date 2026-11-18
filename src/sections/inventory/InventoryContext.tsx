import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { seedHomesIfEmpty, subscribeHomes } from './data/homes';
import { subscribeItems } from './data/items';
import type { Home, Item } from './types';
import { DEFAULT_ROOMS } from './taxonomy';
import { useAuth } from '../../core/auth/AuthProvider';

interface InventoryValue {
  homes: Home[];
  activeHomes: Home[];
  items: Item[];
  loading: boolean;
  error: string;
  homeName: (id: string) => string;
  roomsFor: (homeId?: string) => string[];
  owners: string[];
  categoriesInUse: string[];
}

const Ctx = createContext<InventoryValue | null>(null);

const uniqSorted = (list: string[]) => [...new Set(list.filter(Boolean))].sort((a, b) => a.localeCompare(b));

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { firstName } = useAuth();
  const [homes, setHomes] = useState<Home[] | null>(null);
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    seedHomesIfEmpty().catch((e) => setError(e.message));
    const offHomes = subscribeHomes(setHomes, (e) => setError(e.message));
    const offItems = subscribeItems(setItems, (e) => setError(e.message));
    return () => { offHomes(); offItems(); };
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
      roomsFor: (homeId) =>
        uniqSorted([...DEFAULT_ROOMS, ...it.filter((x) => !homeId || x.homeId === homeId).map((x) => x.room)]),
      owners: uniqSorted(['Shared', firstName, ...it.map((x) => x.owner)]),
      categoriesInUse: uniqSorted(it.map((x) => x.category)),
    };
  }, [homes, items, error, firstName]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInventory() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInventory must be used inside InventoryProvider');
  return v;
}
