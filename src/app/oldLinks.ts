/** Links from before the new addresses (…/home-app/#/inventory/…) still work: turn them into the new ones. */
export function fixOldLinks() {
  if (!location.hash.startsWith('#/')) return;
  const path = location.hash.slice(2).replace(/^inventory(?=\/|\?|$)/, 'homes-inventory');
  history.replaceState(null, '', import.meta.env.BASE_URL + path);
}
