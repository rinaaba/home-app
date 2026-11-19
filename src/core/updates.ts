import { registerSW } from 'virtual:pwa-register';

/**
 * Keep the installed app up to date: check for a new version when the app is opened or brought back
 * to the front (and every hour), and reload into it as soon as it's downloaded.
 */
export function keepAppUpdated() {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => { if (navigator.onLine) void registration.update().catch(() => undefined); };
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
      setInterval(check, 60 * 60 * 1000);
    },
  });
}

declare const __BUILD_TIME__: string;
/** When this version of the app was built, e.g. "20 Nov, 14:05". */
export const buildLabel = new Date(__BUILD_TIME__).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
