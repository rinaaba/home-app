import { useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark';
const KEY = 'app.theme';

function systemTheme(): ThemeChoice {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function read(): ThemeChoice | null {
  try { const v = localStorage.getItem(KEY); return v === 'light' || v === 'dark' ? v : null; } catch { return null; }
}

function apply(theme: ThemeChoice) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0e1116' : '#f0f4f7');
}

/** Light/dark mode. Follows the device until someone taps the switch; then remembers that choice on this device. */
export function useTheme() {
  const [theme, setTheme] = useState<ThemeChoice>(() => read() ?? systemTheme());
  useEffect(() => apply(theme), [theme]);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    setTheme(next);
  };
  return { theme, toggle };
}

// Apply before the first paint so the screen doesn't flash.
apply(read() ?? systemTheme());
