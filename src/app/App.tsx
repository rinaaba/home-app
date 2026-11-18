import { HashRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../core/auth/AuthProvider';
import { Spinner } from '../core/ui/Spinner';
import { Shell } from './Shell';

function Gate() {
  const { user, loading, access, signIn, signOut } = useAuth();

  if (loading || (user && access === 'checking')) {
    return <div className="center-page"><Spinner label="Loading" /></div>;
  }

  if (!user) {
    return (
      <div className="center-page">
        <div className="card signin">
          <img src="icons/icon.svg" alt="" width={72} height={72} />
          <h1>Home</h1>
          <p>Sign in to see your family's homes and things.</p>
          <button className="btn primary big" onClick={() => signIn().catch((e) => alert(e.message))}>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (access === 'denied') {
    return (
      <div className="center-page">
        <div className="card signin">
          <h1>No access yet</h1>
          <p>
            You're signed in as <strong>{user.email}</strong>, but this account isn't on the family list.
          </p>
          <p className="muted">
            Add this email to <code>config/access → emails</code> in the Firebase console, then reload.
          </p>
          <div className="row">
            <button className="btn" onClick={() => location.reload()}>Reload</button>
            <button className="btn" onClick={signOut}>Use another account</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
