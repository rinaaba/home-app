import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '../../../core/ui/Spinner';
import { useInventory } from '../InventoryContext';
import { isStuck, retryItemPicture } from '../ai/picture';
import { ItemImage } from '../components/ItemImage';
import { MoveDialog } from '../components/MoveDialog';
import { deleteItem, removeItemImage } from '../data/items';
import { HomeIcon, homeStyle } from '../homeStyle';

export function ItemPage() {
  const { id } = useParams();
  const { items, homes, loading, homeName } = useInventory();
  const navigate = useNavigate();
  const [moving, setMoving] = useState(false);
  const [working, setWorking] = useState(false);

  if (loading) return <Spinner label="Loading" />;
  const item = items.find((i) => i.id === id);
  if (!item) return <div className="page narrow"><p>This item doesn’t exist anymore.</p><Link to="../.." relative="path">Back to inventory</Link></div>;

  const pending = (item.imageStatus === 'pending' && !isStuck(item)) || working;
  const canRetry = item.imageKind === 'photo' && !pending;

  const retry = async () => {
    setWorking(true);
    try {
      await retryItemPicture(item);
    } catch (e) {
      alert(`Couldn’t make a picture: ${(e as Error).message}`);
    } finally {
      setWorking(false);
    }
  };

  const removePicture = async () => {
    if (confirm('Remove the picture? The item will show a color tile instead.')) await removeItemImage(item);
  };

  const remove = async () => {
    if (!confirm(`Delete “${item.name}”? This can’t be undone.`)) return;
    await deleteItem(item);
    navigate('../..', { relative: 'path' });
  };

  const rows: [string, string][] = [
    ['Home', homeName(item.homeId)],
    ['Room', item.room],
    ['Category', item.category],
    ['Sub-category', item.subcategory],
    ['Color', item.color],
    ['Owner', item.owner],
    ['Notes', item.notes],
    ['Added by', item.createdBy],
  ];

  return (
    <div className={`page item-page accent-${homeStyle(homes.find((h) => h.id === item.homeId)).accent}`}>
      <div className="page-head">
        <Link to="../.." relative="path" className="btn link">← Back</Link>
      </div>

      <div className="item-layout">
        <div className="item-photo">
          <ItemImage item={item} />
          <div className="photo-actions">
            {pending && <span className="muted">Making a picture…</span>}
            {!pending && item.imageKind === 'photo' && (
              <span className="muted">
                Showing a small copy of your photo.
                {item.imageStatus === 'failed' && item.imageError ? ` The AI picture didn’t work: ${item.imageError}` : ''}
              </span>
            )}
            {canRetry && <button className="btn small" onClick={retry}>Try AI picture again</button>}
            {item.image && !pending && <button className="btn small" onClick={removePicture}>Remove picture</button>}
          </div>
        </div>

        <div className="item-info">
          <div className="eyebrow">
            <HomeIcon home={homes.find((h) => h.id === item.homeId)} />
            {[homeName(item.homeId), item.room].filter(Boolean).join(' · ')}
          </div>
          <h1>{item.name}</h1>
          <dl>
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="dl-row">
                <dt>{k}</dt>
                <dd>
                  {k === 'Color' && item.colorHex && <span className="swatch" style={{ background: item.colorHex }} />}
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          <div className="actions">
            <button className="btn primary big" onClick={() => setMoving(true)}>Move to another home</button>
            <Link className="btn big" to="edit">Edit</Link>
            <button className="btn danger" onClick={remove}>Delete</button>
          </div>
        </div>
      </div>

      {moving && <MoveDialog item={item} onClose={() => setMoving(false)} />}
    </div>
  );
}
