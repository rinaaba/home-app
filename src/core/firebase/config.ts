/**
 * Firebase console → Project settings (gear icon) → "Your apps" → Web app → "SDK setup and configuration" → Config.
 * Copy the values into the object below. These values are not secret — it is normal for them to be public.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyBD7_1pgbUBZul2gFucnD-hjaheBkVBcGQ',
  authDomain: 'orina-home-app.firebaseapp.com',
  projectId: 'orina-home-app',
  storageBucket: 'orina-home-app.firebasestorage.app',
  messagingSenderId: '861947889825',
  appId: '1:861947889825:web:7178da5a0bbfdaeec448e0',
};

/**
 * Optional, recommended later: a reCAPTCHA v3 site key for Firebase App Check (free, see docs/SETUP.md).
 * It stops other websites from using your AI quota. Leave empty to skip.
 */
export const appCheckSiteKey = '6LcPvSguAAAAAMyo0YBCc7t-mRI_AEADtOLbegCR';

export const isConfigured = !firebaseConfig.apiKey.startsWith('PASTE_');

/**
 * Where photos are kept.
 * - 'database': free plan. Photos are stored (a bit smaller) inside the Firestore database. Good for trying the app.
 * - 'storage':  pay-as-you-go plan. Full-size photos in Firebase Storage. Switch to this after upgrading
 *               (and doing the Storage step in docs/SETUP.md). New photos go to Storage; old ones keep working.
 */
export const photoStorage: 'database' | 'storage' = 'database';
