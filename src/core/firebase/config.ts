/**
 * ⬇️  PASTE YOUR FIREBASE SETTINGS HERE  ⬇️
 *
 * Firebase console → Project settings (gear icon) → "Your apps" → Web app → "SDK setup and configuration" → Config.
 * Copy the values into the object below. These values are not secret — it is normal for them to be public.
 */
export const firebaseConfig = {
  apiKey: 'PASTE_API_KEY',
  authDomain: 'PASTE_PROJECT_ID.firebaseapp.com',
  projectId: 'PASTE_PROJECT_ID',
  storageBucket: 'PASTE_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'PASTE_SENDER_ID',
  appId: 'PASTE_APP_ID',
};

/**
 * Optional, recommended later: a reCAPTCHA Enterprise site key for Firebase App Check.
 * It stops other websites from using your AI quota. Leave empty to skip.
 */
export const appCheckSiteKey = '';

export const isConfigured = !firebaseConfig.apiKey.startsWith('PASTE_');

/**
 * Where photos are kept.
 * - 'database': free plan. Photos are stored (a bit smaller) inside the Firestore database. Good for trying the app.
 * - 'storage':  pay-as-you-go plan. Full-size photos in Firebase Storage. Switch to this after upgrading
 *               (and doing the Storage step in docs/SETUP.md). New photos go to Storage; old ones keep working.
 */
export const photoStorage: 'database' | 'storage' = 'database';
