import { useState } from 'react';
import { Modal } from '../../../core/ui/Modal';
import { useInventory } from '../InventoryContext';
import { moveItem } from '../data/items';
import { HomeSwitch } from './HomeSwitch';
import { homeStyle } from '../homeStyle';
import type { Item } from '../types';

export function MoveDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const { activeHomes, homes } = useInventory();
  const [homeId, setHomeId] = useState(activeHomes.find((h) => h.id !== item.homeId)?.id ?? item.homeId);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await moveItem(item.id, homeId);
      onClose();
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Move ${item.name.toLowerCase()}`} onClose={onClose}>
      <p className="label">Where is it now?</p>
      <HomeSwitch homes={activeHomes} value={homeId} onChange={setHomeId} />
      <button type="button" className={`btn primary big accent-${homeStyle(homes.find((h) => h.id === homeId)).accent}`} onClick={save} disabled={busy}>{busy ? 'Moving…' : 'Move item'}</button>
    </Modal>
  );
}
