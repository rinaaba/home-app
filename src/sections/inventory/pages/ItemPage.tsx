import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '../../../core/ui/Spinner';
import { useInventory } from '../InventoryContext';
import { isStuck, regenerateCleanImage } from '../ai/cleanImage';
import { ItemImage, StoredImageView } from '../components/ItemImage';
import { MoveDialog } from '../components/MoveDialog';
import { deleteItem } from '../data/items';

export function ItemPage() {
  const { id } = useParams();
  const { items, loading, homeName } = useInventory();
  const navigate = useNavigate();
  const [moving, setMoving] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (loading) return <Spinner label="Loading" />;
  const item = items.find((i) => i.id === id);
  if (!item) return <div className="page narrow"><p>This item doesn’t exist anymore.</p><Link to="../.." relative="path">Back to inventory</Link></div>;

  const pending = item.cleanStatus === 'pending' && !isStuck(item);
  const canRegenerate = !!item.photo && !pending && !regenerating;

  const regenerate = async () => {
    setRegenerating(true);
    try {
      await regenerateCleanImage(item);
    } catch (e) {
      alert(`Couldn’t make a new image: ${(e as Error).message}`);
    } finally {
      setRegenerating(false);
    }
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
    ['Owner', item.owner],
    ['Notes', item.notes],
    ['Added by', item.createdBy],
  ];

  return (
    <div className="page item-page">
      <div className="page-head">
        <Link to="../.." relative="path" className="btn link">← Back</Link>
      </div>

      <div className="item-layout">
        <div className="item-photo">
          {showOriginal && item.photo ? (
            <StoredImageView img={item.photo} size="full" alt={`${item.name}, original photo`} />
          ) : (
            <ItemImage item={item} size="full" />
          )}
          <div className="photo-actions">
            {item.clean && item.photo && (
              <button className="btn small" onClick={() => setShowOriginal((s) => !s)}>
                {showOriginal ? 'Show clean image' : 'Show original photo'}
              </button>
            )}
            {(pending || regenerating) && <span className="muted">Making clean image…</span>}
            {item.cleanStatus === 'failed' && !regenerating && (
              <span className="muted">Clean image didn’t work{item.cleanError ? `: ${item.cleanError}` : '.'}</span>
            )}
            {canRegenerate && (
              <button className="btn small" onClick={regenerate}>
                {item.clean ? 'Make a new clean image' : 'Make clean image'}
              </button>
            )}
          </div>
        </div>

        <div className="item-info">
          <h1>{item.name}</h1>
          <dl>
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="dl-row"><dt>{k}</dt><dd>{v}</dd></div>
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
