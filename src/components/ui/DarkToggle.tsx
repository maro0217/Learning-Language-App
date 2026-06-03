import React, { useEffect, useState } from 'react';

export default function DarkToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark, mounted]);

  return (
    <button
      type="button"
      onClick={() => setDark((prev) => !prev)}
      aria-label="Toggle theme"
      className="inline-flex min-w-[5rem] items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800 transition"
    >
      <span>{mounted ? (dark ? 'Dark' : 'Light') : 'Theme'}</span>
    </button>
  );
}
