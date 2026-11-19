import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '../../../core/ui/Spinner';
import { useInventory } from '../InventoryContext';
import { isStuck, retryItemPicture } from '../ai/picture';
import { ItemImage } from '../components/ItemImage';
import { deleteItem, moveItem, removeItemImage, replaceItemImage } from '../data/items';
import { resizeImage } from '../../../core/images/resize';
import { cropToItem } from '../../../core/images/crop';
import { useToast } from '../../../core/ui/toast';
import { HomeIcon, homeStyle } from '../homeStyle';
import { galleryLink } from '../galleryMemory';

export function ItemPage() {
  const { id } = useParams();
  const { items, homes, activeHomes, loading, homeName } = useInventory();
  const navigate = useNavigate();
  const [working, setWorking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  if (loading) return <Spinner label="Loading" />;
  const item = items.find((i) => i.id === id);
  if (!item) return <div className="page narrow"><p>This item doesn’t exist anymore.</p><Link to={galleryLink()}>Back to inventory</Link></div>;

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

  /** Use a picture as it is, e.g. one made in the Gemini app: fitted into a small white square. */
  const replacePicture = async (file: File | undefined) => {
    if (!file) return;
    setWorking(true);
    try {
      const picture = await cropToItem(await resizeImage(file, 1024), undefined);
      await replaceItemImage(item, picture);
      toast('Picture saved');
    } catch (e) {
      alert(`Couldn’t use that picture: ${(e as Error).message}`);
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
    navigate(galleryLink());
  };

  const rows: [string, string][] = [
    ['Home', homeName(item.homeId)],
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
        <Link to={galleryLink()} className="btn link">← Back</Link>
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
            {canRetry && <button type="button" className="btn small" onClick={retry}>Try AI picture again</button>}
            {!pending && (
              <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>
                {item.image ? 'Replace picture' : 'Add picture'}
              </button>
            )}
            {item.image && !pending && <button type="button" className="btn small" onClick={removePicture}>Remove picture</button>}
            <input ref={fileRef} type="file" accept="image/*,.heic,.heif" hidden onChange={(e) => { void replacePicture(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </div>

        <div className="item-info">
          <div className="eyebrow">
            <HomeIcon home={homes.find((h) => h.id === item.homeId)} />
            {homeName(item.homeId)}
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
            <select
              className="btn primary big move-select"
              value=""
              aria-label="Move to another home"
              onChange={(e) => {
                const to = e.target.value;
                if (!to) return;
                void moveItem(item.id, to).then(() => toast(`Moved to ${homeName(to)}`)).catch((err) => alert(`Couldn’t move: ${err.message}`));
              }}
            >
              <option value="">Move to…</option>
              {activeHomes.filter((h) => h.id !== item.homeId).map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <Link className="btn big" to="edit">Edit</Link>
            <button type="button" className="btn danger" onClick={remove}>Delete</button>
          </div>
        </div>
      </div>

    </div>
  );
}
