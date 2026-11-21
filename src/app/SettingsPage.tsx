import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../core/auth/AuthProvider';
import { addMember, inviteFriend, isOnAccessList, removeMember, renameFamily } from '../core/family/families';
import { useFamilies, useFamily } from '../core/family/FamilyProvider';
import { Icons } from '../core/ui/icons';
import { getDailyLimit, subscribeTodayUsage } from '../core/ai/quota';
import { useToast } from '../core/ui/toast';
import { sections } from './sections';
import { buildLabel, checkForUpdate } from '../core/updates';

const APP_URL = `${location.origin}${import.meta.env.BASE_URL}`;

function FamilySettings() {
  const family = useFamily();
  const { families, select } = useFamilies();
  const { user } = useAuth();
  const toast = useToast();
  const me = (user?.email ?? '').toLowerCase();
  const [name, setName] = useState(family.name);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const invite = async () => {
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return alert('Please enter a full email address, e.g. name@gmail.com');
    if (family.members.includes(e)) return setEmail('');
    setBusy(true);
    try {
      await addMember(family.id, e, me);
      setEmail('');
      toast(`Added ${e}`);
      shareInvite(e);
    } catch (err) {
      alert(`Couldn’t add: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  /** Send the person the link: the phone's share sheet if there is one, otherwise an email. */
  const shareInvite = (to: string) => {
    const text = `Join “${family.name}” on our home app: ${APP_URL}\nSign in with Google using ${to}.`;
    if (navigator.share) {
      navigator.share({ title: 'Join our home app', text }).catch(() => undefined);
    } else {
      location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent('Join our home app')}&body=${encodeURIComponent(text)}`;
    }
  };

  const remove = async (e: string) => {
    const self = e === me;
    if (!confirm(self ? 'Leave this family? You’ll lose access to its things.' : `Remove ${e}? They won’t see this family’s things anymore.`)) return;
    await removeMember(family.id, e);
    if (!self) toast(`Removed ${e}`);
  };

  return (
    <section className="settings-section">
      <h2>Family</h2>
      <div className="card form">
        {families.length > 1 && (
          <label>
            You belong to {families.length} families. Showing
            <select value={family.id} onChange={(e) => select(e.target.value)}>
              {families.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </label>
        )}
        <label>
          Family name
          <div className="inline-field">
            <input value={name} onChange={(e) => setName(e.target.value)} />
            {name.trim() && name.trim() !== family.name && (
              <button type="button" className="btn primary" onClick={() => renameFamily(family.id, name.trim()).then(() => toast('Saved'))}>Save</button>
            )}
          </div>
        </label>

        <div className="field">
          <span className="label">Members</span>
          <ul className="member-list">
            {family.members.map((m) => (
              <li key={m}>
                <span className="member-email">{m}{m === me && <span className="meta"> · you</span>}</span>
                {family.members.length > 1 && (
                  <button type="button" className="link-btn small" onClick={() => remove(m)}>{m === me ? 'leave' : 'remove'}</button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <form className="field" onSubmit={(e) => { e.preventDefault(); void invite(); }}>
          <span className="label">Add family member</span>
          <div className="inline-field">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Their Gmail address" aria-label="Family member’s email" />
            <button type="submit" className="btn primary" disabled={!email.trim() || busy}>Add</button>
          </div>
        </form>
      </div>
    </section>
  );
}

/** Today's AI use for your family. */
function AiUsage() {
  const family = useFamily();
  const [today, setToday] = useState(0);
  const [limit, setLimit] = useState<number | null>(null);
  useEffect(() => subscribeTodayUsage(family.id, setToday), [family.id]);
  useEffect(() => { void getDailyLimit(family.id).then(setLimit); }, [family.id]);
  const limited = limit !== null && Number.isFinite(limit);

  if (!limited) return null; // only families with a daily limit need to see this
  return (
    <section className="settings-section">
      <h2>AI use</h2>
      <div className="card">
        <div className="usage-row">
          <span>Today</span>
          <span className="usage-num">{today}{limited ? ` of ${limit}` : ''} AI requests</span>
        </div>
        {limited && <div className="usage-bar"><div style={{ width: `${Math.min(100, limit ? (today / limit) * 100 : 100)}%` }} /></div>}
      </div>
    </section>
  );
}

/** Friends get their own, separate space. Only people on the app's access list can invite them. */
function InviteFriend() {
  const { user } = useAuth();
  const toast = useToast();
  const me = (user?.email ?? '').toLowerCase();
  const [canInvite, setCanInvite] = useState(false);
  const [email, setEmail] = useState('');
  useEffect(() => { void isOnAccessList(me).then(setCanInvite); }, [me]);
  if (!canInvite) return null;

  const invite = async () => {
    const e = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return alert('Please enter a full email address, e.g. name@gmail.com');
    try {
      await inviteFriend(e, me);
      setEmail('');
      toast(`Invited ${e}`);
      const text = `Try our home app: ${APP_URL}\nSign in with Google using ${e} and create your own space. Your things stay private to your family.`;
      if (navigator.share) navigator.share({ title: 'Try our home app', text }).catch(() => undefined);
      else location.href = `mailto:${encodeURIComponent(e)}?subject=${encodeURIComponent('Try our home app')}&body=${encodeURIComponent(text)}`;
    } catch (err) {
      alert(`Couldn’t invite: ${(err as Error).message}`);
    }
  };

  return (
    <section className="settings-section">
      <h2>Invite a friend</h2>
      <form className="card form" onSubmit={(e) => { e.preventDefault(); void invite(); }}>
        <div className="inline-field">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Their Gmail address" aria-label="Friend’s email" />
          <button type="submit" className="btn primary" disabled={!email.trim()}>Invite</button>
        </div>
        <span className="meta">They get their own separate space.</span>
      </form>
    </section>
  );
}

function VersionLine() {
  const [state, setState] = useState<'idle' | 'checking' | 'latest' | 'offline'>('idle');
  const check = async () => {
    setState('checking');
    setState(await checkForUpdate());
  };
  return (
    <p className="meta center">
      version {buildLabel} ·{' '}
      {state === 'checking' ? 'checking…'
        : state === 'latest' ? 'you have the latest version'
        : state === 'offline' ? 'no internet connection'
        : <button type="button" className="link-btn small" onClick={() => void check()}>check for updates</button>}
    </p>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  return (
    <div className="page narrow settings-page">
      <div className="page-head">
        <button type="button" className="link-btn" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))}>← Back</button>
      </div>
      <h1>Settings</h1>
      <FamilySettings />
      {sections.map((s) => (s.Settings ? <s.Settings key={s.id} /> : null))}
      <AiUsage />
      <InviteFriend />
      <VersionLine />
    </div>
  );
}
