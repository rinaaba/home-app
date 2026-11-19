import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Spinner } from '../../../core/ui/Spinner';
import { useInventory } from '../InventoryContext';
import { ItemCard } from '../components/ItemCard';
import { searchItems } from '../search';

export function GalleryPage() {
  const { items, activeHomes, homes, loading, error, homeName } = useInventory();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const home = params.get('home') ?? '';
  const room = params.get('room') ?? '';
  const cat = params.get('cat') ?? '';
  const sub = params.get('sub') ?? '';

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
  const results = q
    ? searchItems(items, q, homeName)
    : filtered;
  const sorted = [...results].sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now()));

  const anyFilter = home || room || cat || sub;

  return (
    <div className="page gallery-page">
      <div className="toolbar">
        <input
          className="search"
          type="search"
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Search all homes, e.g. blender"
          aria-label="Search"
        />
        <Link to="add" className="btn primary add-btn">+ Add item</Link>
      </div>

      {!q && (
        <div className="filters">
          <div className="chips">
            <button className={`chip ${!home ? 'on' : ''}`} onClick={() => setParam('home', '', ['room'])}>All homes</button>
            {activeHomes.map((h) => (
              <button key={h.id} className={`chip ${home === h.id ? 'on' : ''}`} onClick={() => setParam('home', h.id, ['room'])}>
                {h.name}
              </button>
            ))}
            <Link to="homes" className="chip ghost">Manage homes</Link>
          </div>
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
            {anyFilter && <button className="btn link" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}
          </div>
        </div>
      )}

      {error && <div className="error">Something went wrong: {error}</div>}

      {loading ? (
        <Spinner label="Loading items" />
      ) : sorted.length === 0 ? (
        <div className="empty">
          {q ? <p>Nothing matches “{q}”.</p> : items.length === 0 ? (
            <>
              <p>No items yet.</p>
              <Link to="add" className="btn primary big">Add your first item</Link>
            </>
          ) : <p>No items match these filters.</p>}
        </div>
      ) : (
        <>
          <p className="count">{sorted.length} {sorted.length === 1 ? 'item' : 'items'}</p>
          <div className="grid">
            {sorted.map((it) => (
              <ItemCard key={it.id} item={it} place={[homeName(it.homeId), it.room].filter(Boolean).join(' · ')} />
            ))}
          </div>
        </>
      )}

      <Link to="add" className="fab" aria-label="Add item">+</Link>
    </div>
  );
}
