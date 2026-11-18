import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '../../../core/ui/Spinner';
import { useInventory } from '../InventoryContext';
import { ItemForm } from '../components/ItemForm';
import { updateItem } from '../data/items';
import type { Item, ItemDetails } from '../types';

function EditForm({ item }: { item: Item }) {
  const navigate = useNavigate();
  const [details, setDetails] = useState<ItemDetails>({
    name: item.name, homeId: item.homeId, room: item.room, category: item.category,
    subcategory: item.subcategory, owner: item.owner, notes: item.notes,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateItem(item.id, { ...details, name: details.name.trim() });
      navigate('..', { relative: 'path' });
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  };

  return <ItemForm value={details} onChange={setDetails} onSubmit={save} submitLabel="Save changes" busy={busy} />;
}

export function EditItemPage() {
  const { id } = useParams();
  const { items, loading } = useInventory();
  if (loading) return <Spinner label="Loading" />;
  const item = items.find((i) => i.id === id);
  return (
    <div className="page narrow">
      <div className="page-head">
        <Link to=".." relative="path" className="btn link">← Back</Link>
        <h1>Edit item</h1>
      </div>
      {item ? <EditForm item={item} /> : <p>This item doesn’t exist anymore.</p>}
    </div>
  );
}
