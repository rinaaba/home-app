import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '../../../core/ui/Spinner';
import { CropDialog } from '../../../core/ui/CropDialog';
import { useToast } from '../../../core/ui/toast';
import { resizeImage } from '../../../core/images/resize';
import { cropToItem } from '../../../core/images/crop';
import { useInventory } from '../InventoryContext';
import { retryAutofill } from '../ai/autofill';
import { ItemImage } from '../components/ItemImage';
import { ItemForm } from '../components/ItemForm';
import { deleteItem, removeItemImage, replaceItemImage, updateItem } from '../data/items';
import { galleryLink } from '../galleryMemory';
import { homeStyle } from '../homeStyle';
import type { Item, ItemDetails } from '../types';

const detailsOf = (item: Item): ItemDetails => ({
  name: item.name, homeId: item.homeId, category: item.category, subcategory: item.subcategory,
  color: item.color, colorHex: item.colorHex, owner: item.owner, notes: item.notes,
});

/** Tapping an item opens this page: its picture and all its details, ready to change. */
function ItemEditor({ item }: { item: Item }) {
  const { homes, homeName } = useInventory();
  const navigate = useNavigate();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [details, setDetails] = useState<ItemDetails>(() => detailsOf(item));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [working, setWorking] = useState(false);
  const [cropping, setCropping] = useState(false);

  // While the AI is still filling in (or someone else edits), show the newest details, unless you've started typing.
  useEffect(() => { if (!dirty) setDetails(detailsOf(item)); }, [item, dirty]);

  const save = async () => {
    setBusy(true);
    try {
      const homeChanged = details.homeId !== item.homeId;
      await updateItem(item.id, { ...details, name: details.name.trim(), color: details.color.trim(), notes: details.notes.trim() });
      toast(homeChanged ? `Saved and moved to ${homeName(details.homeId)}` : 'Saved');
      navigate(galleryLink());
    } catch (e) {
      alert(`Couldn’t save: ${(e as Error).message}`);
      setBusy(false);
    }
  };

  /** Use a picture as it is, e.g. one made in the Gemini app: fitted into a small white square. */
  const replacePicture = async (file: File | undefined) => {
    if (!file) return;
    setWorking(true);
    try {
      await replaceItemImage(item, await cropToItem(await resizeImage(file, 1024), undefined));
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
    if (!confirm(`Delete “${item.name || 'this item'}”? This can’t be undone.`)) return;
    await deleteItem(item);
    toast('Deleted');
    navigate(galleryLink());
  };

  const accent = homeStyle(homes.find((h) => h.id === details.homeId)).accent;
  return (
    <div className={`page item-page accent-${accent}`}>
      <div className="page-head">
        <Link to={galleryLink()} className="btn link">← Back</Link>
      </div>

      <div className="item-layout">
        <div className="item-photo">
          <ItemImage item={item} />
          <div className="photo-actions">
            {working && <span className="muted">Saving the picture…</span>}
            {!working && (
              <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>
                {item.image ? 'Replace picture' : 'Add picture'}
              </button>
            )}
            {item.image && !working && <button type="button" className="btn small" onClick={() => setCropping(true)}>Edit picture</button>}
            {item.image && !working && <button type="button" className="btn small" onClick={removePicture}>Remove picture</button>}
            <input ref={fileRef} type="file" accept="image/*,.heic,.heif" hidden onChange={(e) => { void replacePicture(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <p className="meta">Added by {item.createdBy || 'someone'}</p>
          {cropping && item.image && (
            <CropDialog
              src={item.image.url}
              onClose={() => setCropping(false)}
              onDone={(blob) => {
                setCropping(false);
                setWorking(true);
                replaceItemImage(item, blob)
                  .then(() => toast('Picture saved'))
                  .catch((e) => alert(`Couldn’t save the crop: ${e.message}`))
                  .finally(() => setWorking(false));
              }}
            />
          )}
        </div>

        <div className="item-info">
          {item.aiStatus === 'pending' && <p className="note">Filling in…</p>}
          {item.aiStatus === 'failed' && (
            <div className="note row spread">
              <span>Couldn’t fill in the details.</span>
              <button type="button" className="btn small" onClick={() => void retryAutofill(item.id, true)}>Try again</button>
            </div>
          )}
          <ItemForm
            value={details}
            onChange={(v) => { setDetails(v); setDirty(true); }}
            onSubmit={() => void save()}
            submitLabel="Save"
            busy={busy}
          />
          <button type="button" className="btn danger delete-item" onClick={() => void remove()}>Delete item</button>
        </div>
      </div>
    </div>
  );
}

export function ItemPage() {
  const { id } = useParams();
  const { items, loading } = useInventory();
  if (loading) return <Spinner label="Loading" />;
  const item = items.find((i) => i.id === id);
  if (!item) return <div className="page narrow"><p>This item doesn’t exist anymore.</p><Link to={galleryLink()}>Back to inventory</Link></div>;
  return <ItemEditor key={item.id} item={item} />;
}
