'use client';

import React from 'react';

export default function NumberField({
  value,
  onChange,
  min,
  max,
  step,
  error,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-600 outline-none ${
          error ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-slate-400'
        }`}
      />
      {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
