import { HashRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../core/auth/AuthProvider';
import { Spinner } from '../core/ui/Spinner';
import { Shell } from './Shell';
import { FamilyProvider } from '../core/family/FamilyProvider';

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
          <button type="button" className="btn primary big" onClick={() => signIn().catch((e) => alert(e.message))}>
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
            You're signed in as <strong>{user.email}</strong>, but this account hasn't been invited yet.
          </p>
          <p className="muted">
            Ask the person who invited you to invite this exact address, or sign in with the account they invited.
          </p>
          <div className="row">
            <button type="button" className="btn" onClick={() => location.reload()}>Reload</button>
            <button type="button" className="btn" onClick={signOut}>Use another account</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FamilyProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </FamilyProvider>
  );
}

export function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
