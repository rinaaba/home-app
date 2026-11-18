import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/app';

type AccessState = 'checking' | 'allowed' | 'denied';

interface AuthValue {
  user: User | null;
  loading: boolean;
  access: AccessState;
  firstName: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AccessState>('checking');

  useEffect(
    () =>
      onAuthStateChanged(auth, async (u) => {
        setUser(u);
        setLoading(false);
        if (!u) return;
        // The family allow-list lives in Firestore (config/access). If we can read it, we're in.
        setAccess('checking');
        try {
          await getDoc(doc(db, 'config', 'access'));
          setAccess('allowed');
        } catch {
          setAccess('denied');
        }
      }),
    [],
  );

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await signInWithRedirect(auth, provider);
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        throw err;
      }
    }
  };

  const signOut = () => fbSignOut(auth);
  const firstName = user?.displayName?.split(' ')[0] ?? '';

  return (
    <AuthContext.Provider value={{ user, loading, access, firstName, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
