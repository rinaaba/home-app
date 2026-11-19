import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from '../../../core/ui/icons';
import { useInventory } from '../InventoryContext';
import { addHome, updateHome } from '../data/homes';
import { ACCENTS, HOME_ICONS, homeStyle } from '../homeStyle';
import type { Home } from '../types';

function HomeRow({ home, count }: { home: Home; count: number }) {
  const style = homeStyle(home);
  const [editing, setEditing] = useState(false);
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
          <div className="label">Color</div>
          <div className="pickers">
            {ACCENTS.map((a) => (
              <button key={a} className={`swatch-btn accent-${a} ${a === accent ? 'on' : ''}`} onClick={() => setAccent(a)} aria-label={a} />
            ))}
          </div>
          <div className="label">Icon</div>
          <div className="pickers">
            {HOME_ICONS.map((i) => {
              const I = Icons[i];
              return <button key={i} className={`square-btn ${i === icon ? 'on' : ''}`} onClick={() => setIcon(i)} aria-label={i}><I /></button>;
            })}
          </div>
          <div className="button-row">
            <button className="btn primary grow" onClick={save}>Save</button>
            <button className="square-btn" onClick={() => setEditing(false)} aria-label="Cancel"><Icons.close /></button>
          </div>
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
        <button className="btn small" onClick={() => setEditing(true)}>Edit</button>
        <button className={`btn small ${home.archived ? '' : 'danger'}`} onClick={() => updateHome(home.id, { archived: !home.archived })}>
          {home.archived ? 'Restore' : 'Archive'}
        </button>
      </div>
    </li>
  );
}

export function HomesPage() {
  const { homes, items } = useInventory();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [adding, setAdding] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const active = homes.filter((h) => !h.archived);
  const archived = homes.filter((h) => h.archived);
  const countFor = (id: string) => items.filter((i) => i.homeId === id).length;

  const add = async () => {
    if (!name.trim()) return;
    const maxOrder = Math.max(0, ...homes.map((h) => h.sortOrder ?? 0));
    await addHome(name.trim(), location.trim(), maxOrder + 1);
    setName('');
    setLocation('');
    setAdding(false);
  };

  return (
    <div className="page narrow">
      <div className="page-head">
        <Link to=".." className="link-btn">← Back</Link>
      </div>
      <h1>Homes</h1>
      <ul className="card-list">
        {active.map((h) => <HomeRow key={h.id} home={h} count={countFor(h.id)} />)}
      </ul>

      {adding ? (
        <div className="card form">
          <div className="form-row">
            <label>Name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Haifa" autoFocus /></label>
            <label>Location<input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" /></label>
          </div>
          <div className="button-row">
            <button className="btn primary grow" onClick={add} disabled={!name.trim()}>Add home</button>
            <button className="square-btn" onClick={() => setAdding(false)} aria-label="Cancel"><Icons.close /></button>
          </div>
        </div>
      ) : (
        <button className="add-card wide" onClick={() => setAdding(true)}><Icons.plus /><span>Add home</span></button>
      )}

      {archived.length > 0 && (
        <>
          <button className="section-toggle" onClick={() => setShowArchived((s) => !s)}>
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
    </div>
  );
}
