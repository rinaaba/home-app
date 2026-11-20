import { useState } from 'react';
import { Icons } from '../../../core/ui/icons';
import { useInventory } from '../InventoryContext';
import { addHome, updateHome } from '../data/homes';
import { savePeople } from '../data/people';
import { ACCENTS, HomeStylePicker, homeStyle } from '../homeStyle';
import type { Home } from '../types';
import { DeleteHomeDialog } from '../components/DeleteHomeDialog';
import { isCutoutOn, setCutoutOn } from '../ai/autofill';

function HomeRow({ home, count, onUp, onDown }: { home: Home; count: number; onUp?: () => void; onDown?: () => void }) {
  const style = homeStyle(home);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState(home.name);
  const [location, setLocation] = useState(home.location);
  const [accent, setAccent] = useState<string>(style.accent);
  const [icon, setIcon] = useState<string>(style.icon);

  const save = async () => {
    if (!name.trim()) return;
    await updateHome(home.id, { name: name.trim(), location: location.trim(), accent, icon });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className={`card home-card editing accent-${accent}`}>
        <div className="form">
          <div className="form-row">
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} /></label>
            <label>Location<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" /></label>
          </div>
          <HomeStylePicker accent={accent} icon={icon} onChange={(a, i) => { setAccent(a); setIcon(i); }} />
          <div className="button-row">
            <button type="button" className="btn primary grow" onClick={save}>Save</button>
            <button type="button" className="square-btn" onClick={() => setEditing(false)} aria-label="Cancel"><Icons.close /></button>
          </div>
          <button type="button" className="link-btn delete-link" onClick={() => setDeleting(true)}>delete this home</button>
          {deleting && <DeleteHomeDialog home={home} onClose={() => setDeleting(false)} />}
        </div>
      </li>
    );
  }

  const I = Icons[style.icon];
  return (
    <li className={`card home-card accent-${style.accent}`}>
      <span className="home-icon"><I /></span>
      <div className="grow">
        <div className="card-title">{home.name}</div>
        <div className="meta">{[home.location, `${count} ${count === 1 ? 'item' : 'items'}`].filter(Boolean).join(' · ')}</div>
      </div>
      <div className="row">
        {(onUp || onDown) && (
          <span className="order-btns">
            <button type="button" className="square-btn small" onClick={onUp} disabled={!onUp} aria-label={`Move ${home.name} up`}>↑</button>
            <button type="button" className="square-btn small" onClick={onDown} disabled={!onDown} aria-label={`Move ${home.name} down`}>↓</button>
          </span>
        )}
        <button type="button" className="btn small" onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className={`btn small ${home.archived ? '' : 'danger'}`} onClick={() => updateHome(home.id, { archived: !home.archived })}>
          {home.archived ? 'Restore' : 'Archive'}
        </button>
      </div>
    </li>
  );
}

/** The names items can belong to. Stored in the database (not in the code), so they stay private. */
function People() {
  const { owners } = useInventory();
  const [name, setName] = useState('');
  const add = async () => {
    const n = name.trim();
    if (!n || owners.includes(n)) return setName('');
    await savePeople([...owners, n]);
    setName('');
  };
  const remove = (n: string) => {
    if (confirm(`Remove “${n}” from the list? Items that belong to ${n} keep that owner.`)) void savePeople(owners.filter((o) => o !== n));
  };
  return (
    <>
      <h2>People</h2>
      <p className="meta">Who items can belong to. “All” is picked for new items.</p>
      <div className="chips people">
        {owners.map((o) => (
          <span key={o} className="chip person">
            {o}
            <button type="button" className="chip-x" onClick={() => remove(o)} aria-label={`Remove ${o}`}><Icons.close /></button>
          </span>
        ))}
      </div>
      <form className="add-person" onSubmit={(e) => { e.preventDefault(); void add(); }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Add a name, e.g. Kids" aria-label="Name" />
        <button type="submit" className="btn primary" disabled={!name.trim()}>Add</button>
      </form>
    </>
  );
}

/** Background removal runs on each device; it turns itself off if it ever made the app close. */
function CutoutSetting() {
  const [on, setOn] = useState(isCutoutOn);
  return (
    <>
      <h2>Pictures</h2>
      <label className="switch-row">
        <input type="checkbox" checked={on} onChange={(e) => { setCutoutOn(e.target.checked); setOn(e.target.checked); }} />
        <span>
          Remove backgrounds on this device
          <small className="muted">Makes clean product pictures. If it ever made the app close, it turns itself off; turn it on here to try again.</small>
        </span>
      </label>
    </>
  );
}

/** Inventory's part of the Settings page: homes and people. */
export function InventorySettings() {
  const { homes, items } = useInventory();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [adding, setAdding] = useState(false);
  const [newAccent, setNewAccent] = useState<string>(ACCENTS[homes.length % ACCENTS.length]);
  const [newIcon, setNewIcon] = useState<string>('house');
  const [showArchived, setShowArchived] = useState(false);
  const active = homes.filter((h) => !h.archived);
  const archived = homes.filter((h) => h.archived);
  const countFor = (id: string) => items.filter((i) => i.homeId === id).length;

  /** Swap a home with its neighbor. The first home is listed first and is the default for new items. */
  const move = (i: number, dir: -1 | 1) => {
    const order = [...active];
    [order[i], order[i + dir]] = [order[i + dir], order[i]];
    order.forEach((h, n) => { if (h.sortOrder !== n + 1) void updateHome(h.id, { sortOrder: n + 1 }); });
  };

  const add = async () => {
    if (!name.trim()) return;
    const maxOrder = Math.max(0, ...homes.map((h) => h.sortOrder ?? 0));
    await addHome(name.trim(), location.trim(), maxOrder + 1, newAccent, newIcon);
    setName('');
    setLocation('');
    setAdding(false);
  };

  return (
    <section className="settings-section">
      <h2>Homes</h2>
      <p className="meta">The first home is listed first and is picked for new items. Use the arrows to change the order.</p>
      <ul className="card-list">
        {active.map((h, i) => (
          <HomeRow
            key={h.id}
            home={h}
            count={countFor(h.id)}
            onUp={i > 0 ? () => move(i, -1) : undefined}
            onDown={i < active.length - 1 ? () => move(i, 1) : undefined}
          />
        ))}
      </ul>

      {adding ? (
        <div className="card form">
          <div className="form-row">
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Haifa" autoFocus /></label>
            <label>Location<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" /></label>
          </div>
          <HomeStylePicker accent={newAccent} icon={newIcon} onChange={(a, i) => { setNewAccent(a); setNewIcon(i); }} />
          <div className="button-row">
            <button type="button" className={`btn primary grow accent-${newAccent}`} onClick={add} disabled={!name.trim()}>Add home</button>
            <button type="button" className="square-btn" onClick={() => setAdding(false)} aria-label="Cancel"><Icons.close /></button>
          </div>
        </div>
      ) : (
        <button type="button" className="add-card wide" onClick={() => setAdding(true)}><Icons.plus /><span>Add home</span></button>
      )}

      <People />
      <CutoutSetting />

      {archived.length > 0 && (
        <>
          <button type="button" className="section-toggle" onClick={() => setShowArchived((s) => !s)}>
            <span className={`chev ${showArchived ? 'open' : ''}`}><Icons.chevron /></span>
            <span>Archived</span>
            <span className="pill-count">{archived.length}</span>
          </button>
          {showArchived && (
            <>
              <p className="meta">Archived homes are hidden from filters and pickers. Their items are kept and still show up in search.</p>
              <ul className="card-list">{archived.map((h) => <HomeRow key={h.id} home={h} count={countFor(h.id)} />)}</ul>
            </>
          )}
        </>
      )}
    </section>
  );
}
