'use client';

import React from 'react';

export default function TextField({
  value,
  onChange,
  placeholder,
  error,
  inputMode,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
  return (
    <div className="space-y-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={`w-full rounded-xl text-slate-600 border border-slate-400 px-4 py-3 text-sm outline-none ${
          error ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-slate-400'
        }`}
      />
      {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
