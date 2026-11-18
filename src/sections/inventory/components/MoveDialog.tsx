import { useState } from 'react';
import { Modal } from '../../../core/ui/Modal';
import { useInventory } from '../InventoryContext';
import { moveItem } from '../data/items';
import type { Item } from '../types';

export function MoveDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const { activeHomes, roomsFor } = useInventory();
  const [homeId, setHomeId] = useState(activeHomes.find((h) => h.id !== item.homeId)?.id ?? item.homeId);
  const [room, setRoom] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await moveItem(item.id, homeId, room.trim());
      onClose();
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Move ${item.name.toLowerCase()}`} onClose={onClose}>
      <p className="muted">Where is it now?</p>
      <div className="chips">
        {activeHomes.map((h) => (
          <button key={h.id} className={`chip big ${h.id === homeId ? 'on' : ''}`} onClick={() => setHomeId(h.id)}>
            {h.name}
          </button>
        ))}
      </div>
      <label className="form">
        Room
        <input list="move-rooms" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Optional" />
        <datalist id="move-rooms">{roomsFor(homeId).map((r) => <option key={r} value={r} />)}</datalist>
      </label>
      <button className="btn primary big" onClick={save} disabled={busy}>{busy ? 'Moving…' : 'Move item'}</button>
    </Modal>
  );
}
