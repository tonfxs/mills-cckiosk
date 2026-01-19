'use client';

import { useEffect, useState } from 'react';

export function useKioskSettings<T extends object>(storageKey: string, defaults: T) {
  const [settings, setSettings] = useState<T>(defaults);

  // Load
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as T;
      setSettings({ ...defaults, ...parsed });
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings, storageKey]);

  function reset() {
    setSettings(defaults);
  }

  function exportJson(): string {
    const text = JSON.stringify(settings, null, 2);
    try {
      navigator.clipboard?.writeText(text);
      alert('Settings copied to clipboard.');
    } catch {
      // fallback: just return
      alert('Copy failed. You can manually copy from the prompt.');
    }
    return text;
  }

  function importJson(text: string) {
    try {
      const parsed = JSON.parse(text) as T;
      setSettings({ ...defaults, ...parsed });
      alert('Settings imported.');
    } catch {
      alert('Invalid JSON.');
    }
  }

  return { settings, setSettings, reset, exportJson, importJson };
}
