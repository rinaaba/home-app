import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '../InventoryContext';
import { addHome, updateHome } from '../data/homes';
import type { Home } from '../types';

function HomeRow({ home, count }: { home: Home; count: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(home.name);
  const [location, setLocation] = useState(home.location);

  const save = async () => {
    if (!name.trim()) return;
    await updateHome(home.id, { name: name.trim(), location: location.trim() });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="home-row editing">
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Home name" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Location" placeholder="Location" />
        <div className="row">
          <button className="btn primary" onClick={save}>Save</button>
          <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </li>
    );
  }

  return (
    <li className={`home-row ${home.archived ? 'archived' : ''}`}>
      <div>
        <strong>{home.name}</strong> {home.archived && <span className="tag">Archived</span>}
        <div className="muted">{[home.location, `${count} ${count === 1 ? 'item' : 'items'}`].filter(Boolean).join(' · ')}</div>
      </div>
      <div className="row">
        <button className="btn small" onClick={() => setEditing(true)}>Rename</button>
        <button className="btn small" onClick={() => updateHome(home.id, { archived: !home.archived })}>
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

  const add = async () => {
    if (!name.trim()) return;
    const maxOrder = Math.max(0, ...homes.map((h) => h.sortOrder ?? 0));
    await addHome(name.trim(), location.trim(), maxOrder + 1);
    setName('');
    setLocation('');
  };

  return (
    <div className="page narrow">
      <div className="page-head">
        <Link to=".." className="btn link">← Back</Link>
        <h1>Homes</h1>
      </div>
      <p className="muted">Archived homes are hidden from filters and pickers. Their items are kept and still show up in search.</p>
      <ul className="home-list">
        {homes.map((h) => <HomeRow key={h.id} home={h} count={items.filter((i) => i.homeId === h.id).length} />)}
      </ul>
      <h2>Add a home</h2>
      <div className="form">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, e.g. Haifa" />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (optional)" />
        <button className="btn primary" onClick={add} disabled={!name.trim()}>Add home</button>
      </div>
    </div>
  );
}
