'use client';

import React from 'react';

export default function SettingsRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    
    <div className="space-y-4 px-6">
      <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-4">
        <p className="font-semibold text-slate-900">{label}</p>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
      {children}
    </div>

    </div>
    
  );
}
