import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Spinner } from '../ui/Spinner';
import { createFamily, migrateLegacyData, subscribeMyFamilies, type Family } from './families';
import { setCurrentFamily } from './scope';

const FamilyContext = createContext<Family | null>(null);
const FamiliesContext = createContext<{ families: Family[]; select: (id: string) => void }>({ families: [], select: () => undefined });

const PICK_KEY = 'app.familyId';
const readPick = () => { try { return localStorage.getItem(PICK_KEY) ?? ''; } catch { return ''; } };

/** Finds the signed-in person's family. If they have none yet, offers to create one. */
export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const email = (user?.email ?? '').toLowerCase();
  const [families, setFamilies] = useState<Family[] | null>(null);
  const [error, setError] = useState('');
  const [migrating, setMigrating] = useState(false);
  const [triedMigration, setTriedMigration] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [picked, setPicked] = useState(readPick);
  const select = (id: string) => { try { localStorage.setItem(PICK_KEY, id); } catch { /* ignore */ } setPicked(id); };

  useEffect(() => subscribeMyFamilies(email, setFamilies, (e) => setError(`Step: finding your family. ${e.message}`)), [email]);

  // No family yet: first check for data saved before families existed, and move it.
  useEffect(() => {
    if (families === null || families.length > 0 || triedMigration) return;
    setTriedMigration(true);
    setMigrating(true);
    migrateLegacyData()
      .catch((e) => setError(`Step: moving old data. ${e.message}`))
      .finally(() => setMigrating(false));
  }, [families, triedMigration]);

  // The family you picked last on this device, else the original family, else the first.
  const family = families?.find((f) => f.id === picked) ?? families?.find((f) => f.id === 'main') ?? families?.[0] ?? null;
  if (family) setCurrentFamily(family.id);

  if (error) return <div className="center-page"><div className="card signin"><h1>Something went wrong</h1><p className="error">{error}</p><p className="meta">Signed in as {email}</p><button type="button" className="btn" onClick={() => location.reload()}>Reload</button></div></div>;
  if (families === null || migrating || (!family && !triedMigration)) {
    return <div className="center-page"><Spinner label={migrating ? 'Moving your things into your family space…' : 'Loading'} /></div>;
  }

  if (!family) {
    const create = async () => {
      if (!name.trim()) return;
      setCreating(true);
      try {
        await createFamily(name.trim(), email);
      } catch (e) {
        setError(`Step: creating your family. ${(e as Error).message}`);
      }
    };
    return (
      <div className="center-page">
        <form className="card signin welcome" onSubmit={(e) => { e.preventDefault(); void create(); }}>
          <img src="icons/icon.svg" alt="" width={64} height={64} />
          <h1>Welcome</h1>
          <p>Name your family’s space.</p>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. The Cohen family" aria-label="Family name" autoFocus />
          <button type="submit" className="btn primary big" disabled={!name.trim() || creating}>{creating ? 'Creating…' : 'Create our space'}</button>
          <p className="meta">Joining a family? Ask them to invite {email}.</p>
          <button type="button" className="link-btn" onClick={signOut}>use another account</button>
        </form>
      </div>
    );
  }

  return (
    <FamiliesContext.Provider value={{ families: families ?? [], select }}>
      <FamilyContext.Provider value={family}>
        {/* key: switching family restarts everything inside with the new family's data */}
        <div key={family.id} style={{ display: 'contents' }}>{children}</div>
      </FamilyContext.Provider>
    </FamiliesContext.Provider>
  );
}

export function useFamily() {
  const f = useContext(FamilyContext);
  if (!f) throw new Error('useFamily must be used inside FamilyProvider');
  return f;
}

/** All families you belong to, and a way to switch (only matters if you're in more than one). */
export const useFamilies = () => useContext(FamiliesContext);
