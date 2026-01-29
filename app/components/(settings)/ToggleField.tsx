'use client';

import React from 'react';

export default function ToggleField({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 ${
        checked ? 'border-emerald-200 bg-emerald-50 ' : 'border-slate-200 bg-white '
      }`}
    >
      <span className="text-sm font-semibold text-slate-900">{checked ? 'Enabled' : 'Disabled'}</span>

      <span
        className={`h-6 w-12 rounded-full border relative transition ${
          checked ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 border-slate-200'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${
            checked ? 'left-6' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}
