import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icons } from '../../../core/ui/icons';
import { Spinner } from '../../../core/ui/Spinner';
import { useInventory } from '../InventoryContext';
import { ItemCard } from '../components/ItemCard';
import { HomeSwitch } from '../components/HomeSwitch';
import { homeStyle } from '../homeStyle';
import { searchItems } from '../search';

export function GalleryPage() {
  const { items, activeHomes, homes, loading, error, homeName } = useInventory();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const home = params.get('home') ?? '';
  const room = params.get('room') ?? '';
  const cat = params.get('cat') ?? '';
  const sub = params.get('sub') ?? '';
  const [showFilters, setShowFilters] = useState(Boolean(room || cat || sub));

  const setParam = (key: string, value: string, reset: string[] = []) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    reset.forEach((r) => next.delete(r));
    setParams(next, { replace: true });
  };

  const archivedIds = useMemo(() => new Set(homes.filter((h) => h.archived).map((h) => h.id)), [homes]);

  // Filter in steps so each dropdown only offers choices that exist.
  const inHome = useMemo(
    () => items.filter((it) => (home ? it.homeId === home : !archivedIds.has(it.homeId))),
    [items, home, archivedIds],
  );
  const rooms = [...new Set(inHome.map((i) => i.room).filter(Boolean))].sort();
  const inRoom = room ? inHome.filter((i) => i.room === room) : inHome;
  const cats = [...new Set(inRoom.map((i) => i.category).filter(Boolean))].sort();
  const inCat = cat ? inRoom.filter((i) => i.category === cat) : inRoom;
  const subs = [...new Set(inCat.map((i) => i.subcategory).filter(Boolean))].sort();
  const filtered = sub ? inCat.filter((i) => i.subcategory === sub) : inCat;

  // Search looks across all homes (including archived), ignoring the filters, so "where is…?" always works.
  const results = q ? searchItems(items, q, homeName) : filtered;
  const sorted = [...results].sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now()));

  const filterCount = [room, cat, sub].filter(Boolean).length;
  const accent = homeStyle(homes.find((h) => h.id === home)).accent;
  const addLink = home ? `add?home=${home}` : 'add';

  return (
    <div className={`page gallery-page accent-${accent}`}>
      {!q && (
        <div className="home-row-top">
          <HomeSwitch homes={activeHomes} value={home} onChange={(id) => setParam('home', id, ['room'])} allowAll />
        </div>
      )}

      <div className="toolbar">
        <input
          className="search"
          type="search"
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Search, e.g. blender"
          aria-label="Search"
        />
        {!q && (
          <button className={`square-btn ${showFilters || filterCount ? 'on' : ''}`} onClick={() => setShowFilters((s) => !s)} aria-label="Filters">
            <Icons.filter />
            {filterCount > 0 && <span className="dot-count">{filterCount}</span>}
          </button>
        )}
      </div>

      {!q && showFilters && (
        <div className="selects">
          <select value={room} onChange={(e) => setParam('room', e.target.value)} aria-label="Room">
            <option value="">All rooms</option>
            {rooms.map((r) => <option key={r}>{r}</option>)}
          </select>
          <select value={cat} onChange={(e) => setParam('cat', e.target.value, ['sub'])} aria-label="Category">
            <option value="">All categories</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={sub} onChange={(e) => setParam('sub', e.target.value)} aria-label="Sub-category" disabled={!subs.length}>
            <option value="">All sub-categories</option>
            {subs.map((s) => <option key={s}>{s}</option>)}
          </select>
          {filterCount > 0 && (
            <button className="link-btn small" onClick={() => { const n = new URLSearchParams(params); ['room', 'cat', 'sub'].forEach((k) => n.delete(k)); setParams(n, { replace: true }); }}>
              clear filters
            </button>
          )}
        </div>
      )}

      {error && <div className="error">Something went wrong: {error}</div>}

      {loading ? (
        <Spinner label="Loading items" />
      ) : (
        <>
          <div className="count-row">
            <p className="count">
              {sorted.length} {sorted.length === 1 ? 'item' : 'items'}
              {q ? ` matching “${q}”` : home ? ` in ${homeName(home)}` : ''}
            </p>
            <Link to="homes" className="link-btn small">manage homes</Link>
          </div>
          <div className="grid">
            {!q && (
              <Link to={addLink} className="add-card">
                <Icons.plus />
                <span>Add item</span>
              </Link>
            )}
            {sorted.map((it) => (
              <ItemCard key={it.id} item={it} place={[homeName(it.homeId), it.room].filter(Boolean).join(' · ')} />
            ))}
          </div>
          {sorted.length === 0 && (
            <p className="empty">{q ? `Nothing matches “${q}”.` : items.length === 0 ? 'No items yet. Add your first one.' : 'No items match these filters.'}</p>
          )}
        </>
      )}
    </div>
  );
}
