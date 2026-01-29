'use client';

import React from 'react';

export default function SettingsSection({
  title,
  description,
  children,
  disabled,
  disabledHint,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <div className="relative">
      <div className="mb-4">
        <h3 className="px-6 mt-12 text-lg font-bold text-slate-900">{title}</h3>
        {description ? <p className="px-6 text-sm text-slate-600">{description}</p> : null}
        {disabled && disabledHint ? (
          <p className="px-6 mt-2 text-xs font-semibold text-amber-700">{disabledHint}</p>
        ) : null}
      </div>

      <div className={disabled ? 'opacity-60 pointer-events-none' : ''}>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
