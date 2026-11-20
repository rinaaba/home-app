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

/**
 * Check right now for a newer version. Resolves 'latest' if there's none; otherwise the app
 * reloads into the new version by itself (the promise then never resolves).
 */
export async function checkForUpdate(): Promise<'latest' | 'offline'> {
  if (!navigator.onLine) return 'offline';
  const reg = await navigator.serviceWorker?.getRegistration();
  if (!reg) { location.reload(); return new Promise(() => undefined); }
  await reg.update();
  const incoming = reg.installing ?? reg.waiting;
  if (!incoming) return 'latest';
  // A new version is downloading: reload once it takes over.
  navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
  setTimeout(() => location.reload(), 15_000); // just in case
  return new Promise(() => undefined);
}
