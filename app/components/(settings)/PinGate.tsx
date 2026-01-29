'use client';

import React, { useState } from 'react';

export default function PinGate({
  title,
  description,
  pin,
  onUnlocked,
  onLocked,
}: {
  title: string;
  description?: string;
  pin: string;
  onUnlocked: () => void;
  onLocked: () => void;
}) {
  const [input, setInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string>('');

  function unlock() {
    if (!pin) {
      setError('PIN is not set.');
      return;
    }
    if (input === pin) {
      setUnlocked(true);
      setError('');
      onUnlocked();
    } else {
      setUnlocked(false);
      setError('Incorrect PIN.');
      onLocked();
    }
    setInput('');
  }

  function lock() {
    setUnlocked(false);
    setError('');
    onLocked();
  }

  return (
    <div className="rounded-2xl mx-6 border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>

        {unlocked ? (
          <button
            type="button"
            onClick={lock}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
          >
            Lock
          </button>
        ) : null}
      </div>

      {!unlocked ? (
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter PIN"
            inputMode="numeric"
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600 outline-none focus:border-slate-400"
          />
          <button
            type="button"
            onClick={unlock}
            className="px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Unlock
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm font-semibold text-emerald-700">Admin settings unlocked.</p>
      )}

      {error ? <p className="mt-2 text-xs font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
