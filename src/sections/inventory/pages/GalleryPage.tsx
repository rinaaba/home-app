import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Icons } from '../../../core/ui/icons';
import { Spinner } from '../../../core/ui/Spinner';
import { useInventory } from '../InventoryContext';
import { ItemCard } from '../components/ItemCard';
import { HomeSwitch } from '../components/HomeSwitch';
import { homeStyle } from '../homeStyle';
import { searchItems } from '../search';
import { autofillPending, onAutofillChange } from '../ai/autofill';
import { askInventory } from '../ai/ask';
import { galleryMemory, type AiState } from '../galleryMemory';
import { describeAiError } from '../../../core/ai/gemini';

export function GalleryPage() {
  const { items, activeHomes, homes, loading, error, homeName } = useInventory();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const home = params.get('home') ?? '';
  const cat = params.get('cat') ?? '';
  const sub = params.get('sub') ?? '';
  const owner = params.get('owner') ?? '';
  const [showFilters, setShowFilters] = useState(Boolean(cat || sub || owner));
  const [ai, setAiState] = useState<AiState | null>(() => galleryMemory.ai);
  const setAi = (next: AiState | null | ((a: AiState | null) => AiState | null)) =>
    setAiState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      galleryMemory.ai = value;
      return value;
    });

  // Remember filters/search, and the scroll position when leaving, so Back from an item returns here.
  useEffect(() => { galleryMemory.search = params.toString(); }, [params]);
  useEffect(() => () => { galleryMemory.scroll = window.scrollY; }, []);
  const aiCurrent = ai && ai.question === q.trim() ? ai : null; // an answer only counts for the question it was asked for

  const ask = async () => {
    const question = q.trim();
    if (!question) return;
    setAi({ question, loading: true });
    try {
      const result = await askInventory(question, items, homeName, homes.map((h) => h.name));
      setAi((a) => (a?.question === question ? { question, loading: false, result } : a));
    } catch (e) {
      setAi((a) => (a?.question === question ? { question, loading: false, error: describeAiError(e) } : a));
    }
  };

  const setParam = (key: string, value: string, reset: string[] = []) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    reset.forEach((r) => next.delete(r));
    setParams(next, { replace: true });
  };

  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (loading || restored) return;
    setRestored(true);
    if (galleryMemory.scroll && params.toString() === galleryMemory.search) {
      requestAnimationFrame(() => window.scrollTo({ top: galleryMemory.scroll }));
    }
  }, [loading, restored, params]);

  // How many quick-added items the AI is still filling in (shown as a small progress line).
  const [filling, setFilling] = useState(autofillPending());
  useEffect(() => onAutofillChange(() => setFilling(autofillPending())), []);
  const pendingItems = items.filter((i) => i.aiStatus === 'pending').length;
  const fillingCount = Math.max(filling, pendingItems);

  const archivedIds = useMemo(() => new Set(homes.filter((h) => h.archived).map((h) => h.id)), [homes]);

  // Filter in steps so each dropdown only offers choices that exist.
  const inHome = useMemo(
    () => items.filter((it) => (home ? it.homeId === home : !archivedIds.has(it.homeId))),
    [items, home, archivedIds],
  );
  const cats = [...new Set(inHome.map((i) => i.category).filter(Boolean))].sort();
  const inCat = cat ? inHome.filter((i) => i.category === cat) : inHome;
  const subs = [...new Set(inCat.map((i) => i.subcategory).filter(Boolean))].sort();
  const inSub = sub ? inCat.filter((i) => i.subcategory === sub) : inCat;
  const ownersHere = [...new Set(inHome.map((i) => i.owner).filter(Boolean))].sort();
  const filtered = owner ? inSub.filter((i) => i.owner === owner) : inSub;

  // Search looks across all homes (including archived), ignoring the filters, so "where is…?" always works.
  const aiIds = aiCurrent?.result ? new Set(aiCurrent.result.itemIds) : null;
  const results = aiIds ? items.filter((i) => aiIds.has(i.id)) : q ? searchItems(items, q, homeName) : filtered;
  const sorted = [...results].sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now()));

  const filterCount = [cat, sub, owner].filter(Boolean).length;
  const accent = homeStyle(homes.find((h) => h.id === home)).accent;
  const addLink = home ? `add?home=${home}` : 'add';

  return (
    <div className={`page gallery-page accent-${accent}`}>
      {!q && (
        <div className="home-row-top">
          <HomeSwitch homes={activeHomes} value={home} onChange={(id) => setParam('home', id, ['cat', 'sub'])} allowAll />
        </div>
      )}

      <form className="toolbar" onSubmit={(e) => { e.preventDefault(); if (q.trim().split(/\s+/).length > 2) void ask(); }}>
        <input
          className="search"
          type="search"
          value={q}
          onChange={(e) => setParam('q', e.target.value)}
          placeholder="Search or ask, e.g. t-shirt"
          aria-label="Search"
          enterKeyHint="search"
        />
        {q && (
          <button type="button" className="btn primary ask-btn" onClick={() => void ask()} disabled={aiCurrent?.loading}>
            <Icons.sparkle /> Ask AI
          </button>
        )}
        {!q && (
          <button type="button" className={`square-btn ${showFilters || filterCount ? 'on' : ''}`} onClick={() => setShowFilters((s) => !s)} aria-label="Filters">
            <Icons.filter />
            {filterCount > 0 && <span className="dot-count">{filterCount}</span>}
          </button>
        )}
      </form>

      {aiCurrent && (
        <div className={`ai-answer ${aiCurrent.error ? 'is-error' : ''}`} role="status">
          <span className="ai-icon"><Icons.sparkle /></span>
          <div>
            {aiCurrent.loading ? 'Thinking…' : aiCurrent.error ? `Couldn’t answer: ${aiCurrent.error}` : aiCurrent.result?.answer}
          </div>
        </div>
      )}

      {!q && showFilters && (
        <div className="selects">
          <select value={cat} onChange={(e) => setParam('cat', e.target.value, ['sub'])} aria-label="Category">
            <option value="">All categories</option>
            {cats.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={sub} onChange={(e) => setParam('sub', e.target.value)} aria-label="Sub-category" disabled={!subs.length}>
            <option value="">All sub-categories</option>
            {subs.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select value={owner} onChange={(e) => setParam('owner', e.target.value)} aria-label="Owner" disabled={!ownersHere.length}>
            <option value="">All owners</option>
            {ownersHere.map((o) => <option key={o}>{o}</option>)}
          </select>
          {filterCount > 0 && (
            <button type="button" className="link-btn small" onClick={() => { const n = new URLSearchParams(params); ['cat', 'sub', 'owner'].forEach((k) => n.delete(k)); setParams(n, { replace: true }); }}>
              clear filters
            </button>
          )}
        </div>
      )}

      {error && <div className="error">Something went wrong: {error}</div>}
      {fillingCount > 0 && (
        <div className="filling-line" role="status">
          <span className="spinner small" /> Filling in {fillingCount} {fillingCount === 1 ? 'item' : 'items'}…
        </div>
      )}

      {loading ? (
        <Spinner label="Loading items" />
      ) : homes.length === 0 ? (
        <div className="card start-card">
          <h2>Start by adding your homes</h2>
          <Link to="/settings" className="btn primary big">Add homes</Link>
        </div>
      ) : (
        <>
          <div className="count-row">
            <p className="count">
              {sorted.length} {sorted.length === 1 ? 'item' : 'items'}
              {aiIds ? ' found by AI' : q ? ` matching “${q}”` : home ? ` in ${homeName(home)}` : ''}
            </p>
            <Link to="/settings" className="link-btn small">homes and people</Link>
          </div>
          <div className="grid">
            {!q && (
              <Link to={addLink} className="add-card">
                <Icons.plus />
                <span>Add item</span>
              </Link>
            )}
            {sorted.map((it) => (
              <ItemCard key={it.id} item={it} place={homeName(it.homeId)} />
            ))}
          </div>
          {sorted.length === 0 && (
            <p className="empty">{aiIds ? 'No matching items.' : q ? `Nothing found. Try Ask AI.` : items.length === 0 ? 'No items yet. Add your first one.' : 'No items match these filters.'}</p>
          )}
        </>
      )}
    </div>
  );
}
