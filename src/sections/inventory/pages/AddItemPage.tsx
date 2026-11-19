import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../core/auth/AuthProvider';
import { resizeImage } from '../../../core/images/resize';
import { cropToItem } from '../../../core/images/crop';
import { Spinner } from '../../../core/ui/Spinner';
import { useToast } from '../../../core/ui/toast';
import { useInventory } from '../InventoryContext';
import { classifyPhoto, type Guess } from '../ai/classify';
import { describeAiError } from '../../../core/ai/gemini';
import { queueItemPicture } from '../ai/picture';
import { ItemForm } from '../components/ItemForm';
import { createItem, newItemId, saveItemImage } from '../data/items';
import type { ItemDetails } from '../types';
import { homeStyle } from '../homeStyle';

const LAST_HOME_KEY = 'inventory.lastHomeId';
const readLastHome = () => { try { return localStorage.getItem(LAST_HOME_KEY) ?? ''; } catch { return ''; } };
const saveLastHome = (id: string) => { try { localStorage.setItem(LAST_HOME_KEY, id); } catch { /* ignore */ } };

/** One photo waiting to become an item. Choosing one photo is just a list of one. */
interface Entry {
  file: File;
  photo?: Blob;
  preview?: string;
  /** The small product view that will be saved (cropped to the item). */
  thumb?: Blob;
  thumbUrl?: string;
  guess?: Guess;
  error?: string;
  status: 'waiting' | 'looking' | 'ready' | 'failed' | 'unreadable';
}

type Step = 'pick' | 'details';

export function AddItemPage() {
  const { activeHomes, homes, defaultOwner } = useInventory();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const runRef = useRef(0); // bumps when starting over, to stop an old AI run

  const defaultHome = () => {
    const wanted = params.get('home') || readLastHome();
    return activeHomes.find((h) => h.id === wanted)?.id ?? activeHomes[0]?.id ?? '';
  };
  const blank = (): ItemDetails => ({ name: '', homeId: defaultHome(), category: '', subcategory: '', color: '', colorHex: '', owner: defaultOwner, notes: '' });

  const [step, setStep] = useState<Step>('pick');
  const [queue, setQueue] = useState<Entry[]>([]);
  const [index, setIndex] = useState(0);
  const [formFor, setFormFor] = useState(-1); // which entry the form has been filled for
  const [details, setDetails] = useState<ItemDetails>(blank);
  const [keepPicture, setKeepPicture] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedNames, setSavedNames] = useState<string[]>([]);

  // Homes may arrive after the page opens.
  useEffect(() => {
    if (!details.homeId && activeHomes.length) setDetails((d) => ({ ...d, homeId: defaultHome() }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHomes]);

  // Free the photo previews when leaving the page.
  const queueRef = useRef(queue);
  queueRef.current = queue;
  useEffect(() => () => queueRef.current.forEach((e) => { if (e.preview) URL.revokeObjectURL(e.preview); if (e.thumbUrl) URL.revokeObjectURL(e.thumbUrl); }), []);

  const patch = (i: number, changes: Partial<Entry>) =>
    setQueue((q) => q.map((e, j) => (j === i ? { ...e, ...changes } : e)));

  /** Let the AI look at the photos one after another, ahead of you. */
  const lookAtAll = async (entries: Entry[], run: number) => {
    for (let i = 0; i < entries.length; i++) {
      if (runRef.current !== run) return;
      patch(i, { status: 'looking' });
      let photo: Blob;
      try {
        photo = await resizeImage(entries[i].file, 1024);
      } catch {
        patch(i, { status: 'unreadable' });
        continue;
      }
      if (runRef.current !== run) return;
      patch(i, { photo, preview: URL.createObjectURL(photo) });
      try {
        const guess = await classifyPhoto(photo);
        const thumb = await cropToItem(photo, guess.box).catch(() => undefined);
        if (runRef.current === run) patch(i, { guess, thumb, thumbUrl: thumb && URL.createObjectURL(thumb), status: 'ready' });
      } catch (e) {
        console.error(e);
        const thumb = await cropToItem(photo, undefined).catch(() => undefined);
        if (runRef.current === run) patch(i, { status: 'failed', error: describeAiError(e), thumb, thumbUrl: thumb && URL.createObjectURL(thumb) });
      }
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const entries: Entry[] = [...files].map((file) => ({ file, status: 'waiting' }));
    const run = ++runRef.current;
    setQueue(entries);
    setIndex(0);
    setFormFor(-1);
    setSavedNames([]);
    setStep('details');
    void lookAtAll(entries, run);
  };

  const current = queue[index] as Entry | undefined;
  const isReady = !current || ['ready', 'failed', 'unreadable'].includes(current.status);

  // When the AI is done with the current photo, fill the form. Home and owner carry over from the last item.
  useEffect(() => {
    if (!current || !isReady || formFor === index) return;
    const g = current.guess;
    setDetails((d) => ({
      ...blank(),
      homeId: d.homeId || defaultHome(),
      owner: d.owner || defaultOwner,
      ...(g && { name: g.name, category: g.category, subcategory: g.subcategory, color: g.color, colorHex: g.colorHex, notes: g.notes }),
    }));
    setKeepPicture(true);
    setFormFor(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isReady, index, formFor]);

  /** All done: back to the gallery with a short message. */
  const finish = (names: string[]) => {
    runRef.current++;
    if (names.length === 1) toast(`Saved “${names[0]}”`);
    else if (names.length > 1) toast(`Saved ${names.length} items`);
    navigate('..');
  };

  const next = (names = savedNames) => {
    if (index + 1 < queue.length) setIndex(index + 1);
    else finish(names);
    window.scrollTo({ top: 0 });
  };

  const save = async () => {
    setSaving(true);
    try {
      const id = newItemId();
      const withPicture = current?.photo && keepPicture ? current.photo : null;
      // The small product view (cropped to the item) is saved; it stays unless an AI picture replaces it.
      const fallback = withPicture ? await saveItemImage(id, current?.thumb ?? withPicture) : null;
      const clean: ItemDetails = { ...details, name: details.name.trim(), color: details.color.trim(), owner: details.owner.trim(), notes: details.notes.trim() };
      await createItem(id, clean, fallback, user?.displayName ?? user?.email ?? '');
      saveLastHome(clean.homeId);
      // The photo itself is never kept. The AI picture is made in the background.
      if (withPicture) queueItemPicture(id, clean.name, withPicture, fallback);
      const names = [...savedNames, clean.name];
      setSavedNames(names);
      if (queue.length) next(names);
      else finish(names);
    } catch (e) {
      alert(`Couldn't save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const startOver = () => {
    runRef.current++;
    queue.forEach((e) => e.preview && URL.revokeObjectURL(e.preview));
    setQueue([]);
    setIndex(0);
    setFormFor(-1);
    setDetails((d) => ({ ...blank(), homeId: d.homeId, owner: d.owner }));
    setStep('pick');
  };

  const looked = queue.filter((e) => !['waiting', 'looking'].includes(e.status)).length;
  const many = queue.length > 1;

  return (
    <div className={`page narrow accent-${homeStyle(homes.find((h) => h.id === details.homeId)).accent}`}>
      <div className="page-head">
        <Link to=".." className="btn link">← Back</Link>
        <h1>{many && step === 'details' ? `Photo ${index + 1} of ${queue.length}` : 'Add item'}</h1>
      </div>

      {/* Hidden file inputs. "capture" opens the camera directly on phones. */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
      <input ref={libraryRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />

      {activeHomes.length === 0 && (
        <p className="note">First add a home in <Link to="/settings">settings</Link>, so your things have somewhere to go.</p>
      )}

      {step === 'pick' && (
        <div className="pick">
          <button type="button" className="btn primary huge" onClick={() => cameraRef.current?.click()}>📷 Take a photo</button>
          <button type="button" className="btn huge" onClick={() => libraryRef.current?.click()}>🖼️ Choose photos</button>
          <p className="muted center">You can choose many photos at once. The AI fills in each one and you check them one by one.</p>
          <button type="button" className="btn link" onClick={() => { setQueue([]); setFormFor(-1); setStep('details'); }}>Add without a photo</button>
        </div>
      )}

      {step === 'details' && (
        <>
          {many && (
            <div className="progress">
              <div className="progress-bar" style={{ width: `${(looked / queue.length) * 100}%` }} />
              <span>AI has looked at {looked} of {queue.length} · {savedNames.length} saved</span>
            </div>
          )}

          {current?.thumbUrl && keepPicture ? (
            <div className="thumb-preview">
              <img src={current.thumbUrl} alt="The picture that will be saved" />
              <span className="meta">This small picture is saved with the item. Your photo isn’t kept.</span>
            </div>
          ) : (
            current?.preview && <img className="preview" src={current.preview} alt="Your photo" />
          )}

          {!isReady ? (
            <Spinner label="Looking at your photo…" />
          ) : current?.status === 'unreadable' ? (
            <p className="error">This photo couldn’t be opened. Skip it, or try saving it as a JPEG first.</p>
          ) : current?.status === 'failed' ? (
            <p className="note">Couldn’t guess the details, so please fill them in.{current.error ? ` (${current.error})` : ''}</p>
          ) : current ? (
            <p className="note">These details were guessed from the photo. Check them and change anything that’s wrong.</p>
          ) : null}

          {current?.photo && (
            <label className="switch-row">
              <input type="checkbox" checked={keepPicture} onChange={(e) => setKeepPicture(e.target.checked)} />
              <span>
                Keep a picture of this item
                <small className="muted">Off for things like socks: only the details and color are saved.</small>
              </span>
            </label>
          )}

          {current?.status !== 'unreadable' && (
            <ItemForm
              value={details}
              onChange={setDetails}
              onSubmit={save}
              submitLabel={many && index + 1 < queue.length ? 'Save & next' : 'Save item'}
              busy={saving}
              disabled={!isReady}
            />
          )}

          <div className="row spread">
            {many && <button type="button" className="btn" onClick={() => next()} disabled={saving}>Skip this photo</button>}
            <button type="button" className="btn link" onClick={startOver} disabled={saving}>{many ? 'Stop and start over' : 'Start over'}</button>
          </div>
        </>
      )}

    </div>
  );
}
