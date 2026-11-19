import { useState } from 'react';
import { Modal } from '../../../core/ui/Modal';
import { useToast } from '../../../core/ui/toast';
import { useInventory } from '../InventoryContext';
import { deleteHome } from '../data/homes';
import { deleteItem, moveItem } from '../data/items';
import type { Home } from '../types';
import { HomeSwitch } from './HomeSwitch';

/** Delete a home. Its items are either moved to another home or deleted too. */
export function DeleteHomeDialog({ home, onClose }: { home: Home; onClose: () => void }) {
  const { items, activeHomes } = useInventory();
  const toast = useToast();
  const inHome = items.filter((i) => i.homeId === home.id);
  const others = activeHomes.filter((h) => h.id !== home.id);
  const [choice, setChoice] = useState<'move' | 'delete'>(others.length ? 'move' : 'delete');
  const [target, setTarget] = useState(others[0]?.id ?? '');
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (inHome.length && choice === 'delete' && !confirm(`Delete ${home.name} and its ${inHome.length} items? This can’t be undone.`)) return;
    setBusy(true);
    try {
      if (choice === 'move') await Promise.all(inHome.map((i) => moveItem(i.id, target)));
      else await Promise.all(inHome.map((i) => deleteItem(i)));
      await deleteHome(home.id);
      toast(`Deleted ${home.name}`);
      onClose();
    } catch (e) {
      alert(`Couldn’t delete: ${(e as Error).message}`);
      setBusy(false);
    }
  };

  return (
    <Modal title={`Delete ${home.name}`} onClose={onClose}>
      {inHome.length === 0 ? (
        <p>This home has no items. Delete it?</p>
      ) : (
        <>
          <p>{home.name} has {inHome.length} {inHome.length === 1 ? 'item' : 'items'}. What should happen to {inHome.length === 1 ? 'it' : 'them'}?</p>
          <div className="chips">
            {others.length > 0 && (
              <button type="button" className={`chip ${choice === 'move' ? 'on' : ''}`} onClick={() => setChoice('move')}>Move to another home</button>
            )}
            <button type="button" className={`chip ${choice === 'delete' ? 'on' : ''}`} onClick={() => setChoice('delete')}>Delete them too</button>
          </div>
          {choice === 'move' && <HomeSwitch homes={others} value={target} onChange={setTarget} />}
        </>
      )}
      <button type="button" className="btn danger big" onClick={run} disabled={busy || (choice === 'move' && inHome.length > 0 && !target)}>
        {busy ? 'Deleting…' : choice === 'move' && inHome.length ? `Move items and delete ${home.name}` : `Delete ${home.name}`}
      </button>
    </Modal>
  );
}
