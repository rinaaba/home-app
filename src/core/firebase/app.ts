import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAI, GoogleAIBackend } from 'firebase/ai';
import { appCheckSiteKey, firebaseConfig } from './config';

export const app = initializeApp(firebaseConfig);

if (appCheckSiteKey) {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = getAuth(app);

// Offline cache: the wall tablet and phones keep working with a weak connection.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const storage = getStorage(app);

// Regular App Check passes (renewed about hourly). One-time passes per request got blocked as bot-like during bulk uploads.
export const ai = getAI(app, { backend: new GoogleAIBackend() });
