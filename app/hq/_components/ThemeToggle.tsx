'use client';

import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from './icons';

type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  const attr = document.getElementById('hq-shell')?.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(currentTheme());
  }, []);

  function toggle() {
    const next: Theme = (theme ?? currentTheme()) === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.getElementById('hq-shell')?.setAttribute('data-theme', next);
    try {
      localStorage.setItem('hq-theme', next);
    } catch {
      // storage unavailable — theme still applies for this session
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="hq-focusable inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-[var(--hq-panel-2)]"
      style={{ color: 'var(--hq-ink-dim)' }}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
