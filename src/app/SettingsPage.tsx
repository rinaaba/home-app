import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../core/auth/AuthProvider';
import { addMember, inviteFriend, isOnAccessList, removeMember, renameFamily } from '../core/family/families';
import { useFamilies, useFamily } from '../core/family/FamilyProvider';
import { Icons } from '../core/ui/icons';
import { DEFAULT_DAILY_LIMIT, getDailyLimit, listFamilyUsage, setDailyLimit, subscribeTodayUsage } from '../core/ai/quota';
import { useToast } from '../core/ui/toast';
import { sections } from './sections';

const APP_URL = `${location.origin}${location.pathname}`;

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
      toast(`Invited ${e}`);
      shareInvite(e);
    } catch (err) {
      alert(`Couldn’t invite: ${(err as Error).message}`);
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
          <span className="label">Invite someone</span>
          <div className="inline-field">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Their Gmail address" aria-label="Email to invite" />
            <button type="submit" className="btn primary" disabled={!email.trim() || busy}>Invite</button>
          </div>
          <span className="meta">They sign in with that Google account and see this family’s things. Invite people you live with or share homes with.</span>
        </form>
      </div>
    </section>
  );
}

/** Today's AI use for your family, and (for the app's owners) every family's use and limit. */
function AiUsage() {
  const family = useFamily();
  const { user } = useAuth();
  const toast = useToast();
  const me = (user?.email ?? '').toLowerCase();
  const [today, setToday] = useState(0);
  const [limit, setLimit] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [all, setAll] = useState<Awaited<ReturnType<typeof listFamilyUsage>>>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => subscribeTodayUsage(family.id, setToday), [family.id]);
  useEffect(() => { void getDailyLimit(family.id).then(setLimit); }, [family.id]);
  useEffect(() => { void isOnAccessList(me).then(setIsOwner); }, [me]);
  const refresh = () => listFamilyUsage().then(setAll).catch(() => setAll([]));
  useEffect(() => { if (isOwner) void refresh(); }, [isOwner]);

  const save = async (id: string) => {
    const n = Number(edits[id]);
    if (!Number.isInteger(n) || n < 0) return alert('Please enter a whole number (0 turns the AI off for that family).');
    await setDailyLimit(id, n);
    setEdits((e) => { const c = { ...e }; delete c[id]; return c; });
    toast('Limit saved');
    void refresh();
  };

  const others = all.filter((f) => f.id !== family.id);
  return (
    <section className="settings-section">
      <h2>AI use</h2>
      <div className="card">
        <div className="usage-row">
          <span>Today</span>
          <span className="usage-num">{today}{limit !== null && Number.isFinite(limit) ? ` of ${limit}` : ''} AI requests</span>
        </div>
        {limit !== null && Number.isFinite(limit) && (
          <div className="usage-bar"><div style={{ width: `${Math.min(100, limit ? (today / limit) * 100 : 100)}%` }} /></div>
        )}
        <p className="meta">
          {limit !== null && !Number.isFinite(limit)
            ? 'Your family has no daily limit.'
            : 'Adding a photo uses 1–2 requests; asking a question uses 1. The count resets every day.'}
        </p>
      </div>

      {isOwner && others.length > 0 && (
        <>
          <h2>Other families</h2>
          <p className="meta">They share this app’s AI allowance. Set how many AI requests each can make per day (default {DEFAULT_DAILY_LIMIT}; 0 turns their AI off). You can’t see their things.</p>
          <ul className="card-list">
            {others.map((f) => (
              <li key={f.id} className="card family-usage">
                <div className="grow">
                  <div className="card-title">{f.name}</div>
                  <div className="meta">{f.members.join(', ')}</div>
                  <div className="meta">today: {f.today}{Number.isFinite(f.limit) ? ` of ${f.limit}` : ''}</div>
                </div>
                {Number.isFinite(f.limit) && (
                  <form className="inline-field limit-field" onSubmit={(e) => { e.preventDefault(); void save(f.id); }}>
                    <input type="number" min={0} inputMode="numeric" value={edits[f.id] ?? String(f.limit)} onChange={(e) => setEdits({ ...edits, [f.id]: e.target.value })} aria-label={`Daily AI limit for ${f.name}`} />
                    {edits[f.id] !== undefined && <button type="submit" className="btn primary small">Save</button>}
                  </form>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
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
        <span className="meta">They get their own, empty space with their own homes and people. They can’t see your things, and you can’t see theirs. Their AI use counts toward this app’s free limits.</span>
      </form>
    </section>
  );
}

export function SettingsPage() {
  return (
    <div className="page narrow settings-page">
      <div className="page-head">
        <Link to="/" className="link-btn">← Back</Link>
      </div>
      <h1>Settings</h1>
      <FamilySettings />
      {sections.map((s) => (s.Settings ? <s.Settings key={s.id} /> : null))}
      <AiUsage />
      <InviteFriend />
      <p className="meta center app-link">
        <Icons.house /> Share the app: {APP_URL}
      </p>
    </div>
  );
}
