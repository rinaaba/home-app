import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthProvider';
import { resizeImage } from '../../../core/images/resize';
import { cropToItem } from '../../../core/images/crop';
import { Camera } from '../../../core/ui/Camera';
import { useToast } from '../../../core/ui/toast';
import { useInventory } from '../InventoryContext';
import { enqueueAutofill, holdAutofill } from '../ai/autofill';
import { HomeSwitch } from '../components/HomeSwitch';
import { ItemForm } from '../components/ItemForm';
import { OwnerPicker } from '../components/OwnerPicker';
import { createItem, createQuickItem, newItemId, saveItemImage } from '../data/items';
import { galleryLink } from '../galleryMemory';
import { homeStyle } from '../homeStyle';
import type { ItemDetails } from '../types';

const remember = {
  get: (key: string) => { try { return localStorage.getItem(key) ?? ''; } catch { return ''; } },
  set: (key: string, v: string) => { try { localStorage.setItem(key, v); } catch { /* ignore */ } },
};
const LAST_HOME = 'inventory.lastHomeId';
const LAST_OWNER = 'inventory.lastOwner';

interface Saved { id: string; photo: Blob }

/**
 * Quick add: pick the home and owner, then take or choose photos. Each photo is saved right away
 * as an item; the AI fills in the details in the background (see ai/autofill.ts).
 */
export function AddItemPage() {
  const { activeHomes, homes, owners, defaultOwner } = useInventory();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const libraryRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef<Promise<Saved | null>[]>([]);

  const pickHome = () => {
    const wanted = params.get('home') || remember.get(LAST_HOME);
    return activeHomes.find((h) => h.id === wanted)?.id ?? activeHomes[0]?.id ?? '';
  };
  const [homeId, setHomeId] = useState(pickHome);
  const [owner, setOwner] = useState(() => (owners.includes(remember.get(LAST_OWNER)) ? remember.get(LAST_OWNER) : defaultOwner));
  const [cameraOpen, setCameraOpen] = useState(false);
  const [taken, setTaken] = useState(0);
  const [busy, setBusy] = useState('');
  const [manual, setManual] = useState(false);
  const [details, setDetails] = useState<ItemDetails>({ name: '', homeId: '', category: '', subcategory: '', color: '', colorHex: '', owner: '', notes: '' });

  // Homes and people may arrive after the page opens.
  useEffect(() => { if (!homeId && activeHomes.length) setHomeId(pickHome()); }, [activeHomes]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!owners.includes(owner)) setOwner(defaultOwner); }, [owners]); // eslint-disable-line react-hooks/exhaustive-deps

  const by = user?.displayName ?? user?.email ?? '';
  const choose = (h: string, o: string) => { remember.set(LAST_HOME, h); remember.set(LAST_OWNER, o); };

  /** Save one photo as an item right away; the details fill in later. */
  const saveFile = async (file: File): Promise<Saved | null> => {
    try {
      const photo = await resizeImage(file, 1024);
      const id = newItemId();
      holdAutofill(id);
      const picture = await cropToItem(photo, undefined); // the whole photo for now; the cut-out replaces it
      await createQuickItem(id, homeId, owner, await saveItemImage(id, picture), by);
      return { id, photo };
    } catch (e) {
      console.error('Could not save photo', e);
      return null;
    }
  };

  /** Hand the saved items to the AI only once saving is done, so saving (and the camera) stay quick. */
  const finish = (results: (Saved | null)[]) => {
    results.forEach((r) => r && enqueueAutofill(r.id, r.photo));
    const ok = results.filter(Boolean).length;
    const failed = results.length - ok;
    if (ok) toast(`Saved ${ok} ${ok === 1 ? 'item' : 'items'}`);
    if (failed) alert(`${failed} ${failed === 1 ? 'photo' : 'photos'} couldn’t be opened.`);
    navigate(galleryLink());
  };

  const onFiles = async (files: FileList | null) => {
    if (!files?.length || !homeId) return;
    choose(homeId, owner);
    const list = [...files];
    const results: (Saved | null)[] = [];
    for (let i = 0; i < list.length; i++) {
      setBusy(`Saving ${i + 1} of ${list.length}…`);
      results.push(await saveFile(list[i]));
    }
    setBusy('');
    finish(results);
  };

  const onShot = (file: File) => {
    setTaken((n) => n + 1);
    savingRef.current.push(saveFile(file));
  };

  const closeCamera = async () => {
    setCameraOpen(false);
    if (!savingRef.current.length) return;
    setBusy('Saving…');
    const results = await Promise.all(savingRef.current);
    savingRef.current = [];
    setBusy('');
    finish(results);
  };

  const saveManual = async () => {
    setBusy('Saving…');
    try {
      const clean = { ...details, homeId, owner, name: details.name.trim(), color: details.color.trim(), notes: details.notes.trim() };
      await createItem(newItemId(), clean, null, by);
      choose(homeId, owner);
      toast(`Saved “${clean.name}”`);
      navigate(galleryLink());
    } catch (e) {
      alert(`Couldn’t save: ${(e as Error).message}`);
      setBusy('');
    }
  };

  const accent = homeStyle(homes.find((h) => h.id === homeId)).accent;
  return (
    <div className={`page narrow accent-${accent}`}>
      <div className="page-head">
        <Link to={galleryLink()} className="btn link">← Back</Link>
        <h1>Add items</h1>
      </div>

      {/* Hidden inputs: the photo library (many at once), and the phone's own camera as a fallback. */}
      <input ref={libraryRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void onFiles(e.target.files); e.target.value = ''; }} />

      {cameraOpen && (
        <Camera
          taken={taken}
          onPhoto={onShot}
          onClose={() => void closeCamera()}
          onUnavailable={() => { setCameraOpen(false); cameraInputRef.current?.click(); }}
        />
      )}

      {activeHomes.length === 0 ? (
        <p className="note">First add a home in <Link to="/settings">settings</Link>, so your things have somewhere to go.</p>
      ) : (
        <div className="form">
          {!manual && (
            <>
              <div className="field">
                <span className="label">Home</span>
                <HomeSwitch homes={activeHomes} value={homeId} onChange={setHomeId} />
              </div>
              <OwnerPicker owners={owners} value={owner} onChange={setOwner} />
            </>
          )}

          {busy ? (
            <p className="note">{busy}</p>
          ) : manual ? (
            <ItemForm
              value={{ ...details, homeId, owner }}
              onChange={(v) => { setDetails(v); setHomeId(v.homeId); setOwner(v.owner); }}
              onSubmit={() => void saveManual()}
              submitLabel="Save item"
            />
          ) : (
            <div className="pick">
              <button type="button" className="btn primary huge" onClick={() => { choose(homeId, owner); setTaken(0); setCameraOpen(true); }}>📷 Take photos</button>
              <button type="button" className="btn huge" onClick={() => libraryRef.current?.click()}>🖼️ Choose photos</button>
              <button type="button" className="btn link" onClick={() => setManual(true)}>Add without a photo</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
