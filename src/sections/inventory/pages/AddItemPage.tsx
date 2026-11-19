import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthProvider';
import { resizeImage } from '../../../core/images/resize';
import { Spinner } from '../../../core/ui/Spinner';
import { useInventory } from '../InventoryContext';
import { classifyPhoto } from '../ai/classify';
import { makeItemPicture } from '../ai/picture';
import { ItemForm } from '../components/ItemForm';
import { createItem, newItemId, saveItemImage } from '../data/items';
import type { ItemDetails } from '../types';

const LAST_HOME_KEY = 'inventory.lastHomeId';
const readLastHome = () => { try { return localStorage.getItem(LAST_HOME_KEY) ?? ''; } catch { return ''; } };
const saveLastHome = (id: string) => { try { localStorage.setItem(LAST_HOME_KEY, id); } catch { /* ignore */ } };

type Step = 'pick' | 'details' | 'saved';

export function AddItemPage() {
  const { activeHomes } = useInventory();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const defaultHome = () => {
    const wanted = params.get('home') || readLastHome();
    return activeHomes.find((h) => h.id === wanted)?.id ?? activeHomes[0]?.id ?? '';
  };
  const blank = (): ItemDetails => ({ name: '', homeId: defaultHome(), room: '', category: '', subcategory: '', color: '', colorHex: '', owner: 'Shared', notes: '' });

  const [step, setStep] = useState<Step>('pick');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [details, setDetails] = useState<ItemDetails>(blank);
  const [keepPicture, setKeepPicture] = useState(true);
  const [guessing, setGuessing] = useState(false);
  const [guessNote, setGuessNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedName, setSavedName] = useState('');

  // Homes may arrive after the page opens.
  useEffect(() => {
    if (!details.homeId && activeHomes.length) setDetails((d) => ({ ...d, homeId: defaultHome() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHomes]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const small = await resizeImage(file, 1024);
    setPhoto(small);
    setPreview(URL.createObjectURL(small));
    setStep('details');
    setGuessing(true);
    setGuessNote('');
    try {
      const g = await classifyPhoto(small);
      setDetails((d) => ({ ...d, name: g.name, category: g.category, subcategory: g.subcategory, color: g.color, colorHex: g.colorHex, room: d.room || g.room, notes: g.notes }));
      setGuessNote('These details were guessed from the photo. Check them and change anything that’s wrong.');
    } catch (e) {
      console.error(e);
      setGuessNote('Couldn’t guess the details this time. Please fill them in.');
    } finally {
      setGuessing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const id = newItemId();
      const withPicture = photo && keepPicture ? photo : null;
      // A low-res copy of the photo is shown until the AI picture is ready (or if it fails).
      const fallback = withPicture ? await saveItemImage(id, withPicture) : null;
      const clean: ItemDetails = { ...details, name: details.name.trim(), room: details.room.trim(), color: details.color.trim(), owner: details.owner.trim(), notes: details.notes.trim() };
      await createItem(id, clean, fallback, user?.displayName ?? user?.email ?? '');
      saveLastHome(clean.homeId);
      // The photo itself is never kept. The AI picture is made in the background.
      if (withPicture) void makeItemPicture(id, clean.name, withPicture, fallback);
      setSavedName(clean.name);
      setStep('saved');
    } catch (e) {
      alert(`Couldn't save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    setPreview('');
    setDetails((d) => ({ ...blank(), homeId: d.homeId, room: d.room }));
    setGuessNote('');
    setKeepPicture(true);
    setStep('pick');
  };

  return (
    <div className="page narrow">
      <div className="page-head">
        <Link to=".." className="btn link">← Back</Link>
        <h1>Add item</h1>
      </div>

      {/* Hidden file inputs. "capture" opens the camera directly on phones. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      <input ref={libraryRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {step === 'pick' && (
        <div className="pick">
          <button className="btn primary huge" onClick={() => cameraRef.current?.click()}>📷 Take a photo</button>
          <button className="btn huge" onClick={() => libraryRef.current?.click()}>🖼️ Choose a photo</button>
          <button className="btn link" onClick={() => setStep('details')}>Add without a photo</button>
        </div>
      )}

      {step === 'details' && (
        <>
          {preview && <img className="preview" src={preview} alt="Your photo" />}
          {guessing ? <Spinner label="Looking at your photo…" /> : guessNote && <p className="note">{guessNote}</p>}
          {photo && (
            <label className="switch-row">
              <input type="checkbox" checked={keepPicture} onChange={(e) => setKeepPicture(e.target.checked)} />
              <span>
                Keep a picture of this item
                <small className="muted">Off for things like socks: only the details and color are saved. Your photo itself is never kept.</small>
              </span>
            </label>
          )}
          <ItemForm value={details} onChange={setDetails} onSubmit={save} submitLabel="Save item" busy={saving} disabled={guessing} />
          <button className="btn link" onClick={reset} disabled={saving}>Start over</button>
        </>
      )}

      {step === 'saved' && (
        <div className="pick">
          <p className="success">Saved “{savedName}”. {keepPicture && photo ? ' A simple picture is being made and will appear in a minute.' : ''}</p>
          <button className="btn primary huge" onClick={reset}>Add another</button>
          <button className="btn huge" onClick={() => navigate('..')}>Done</button>
        </div>
      )}
    </div>
  );
}
