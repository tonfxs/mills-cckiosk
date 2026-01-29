'use client';

import React, { useState } from 'react';

export default function ActionBar({
  hasErrors,
  onReset,
  onClearCache,
  onExport,
  onImport,
}: {
  hasErrors: boolean;
  onReset: () => void;
  onClearCache: () => void;
  onExport: () => void;
  onImport: (text: string) => void;
}) {
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm mx-6 my-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Actions</h3>
          <p className="text-sm text-slate-600">
            Export/import settings, clear cache, or reset.
          </p>
          {hasErrors ? (
            <p className="mt-2 text-xs font-semibold text-rose-700">
              Some settings are invalid. Fix errors above.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExport}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold"
          >
            Export (copy)
          </button>

          <button
            type="button"
            onClick={() => setImportOpen((v) => !v)}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-sm font-semibold"
          >
            Import
          </button>

          <button
            type="button"
            onClick={onClearCache}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 bg-white hover:bg-slate-50 text-sm font-semibold"
          >
            Clear cache
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-sm font-semibold"
          >
            Reset defaults
          </button>
        </div>
      </div>

      {importOpen ? (
        <div className="mt-4">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste settings JSON here..."
            className="w-full min-h-[140px] rounded-xl border border-slate-200 p-4 text-sm text-slate-600 outline-none focus:border-slate-400"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => onImport(importText)}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold"
            >
              Import now
            </button>
            <button
              type="button"
              onClick={() => {
                setImportText('');
                setImportOpen(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-red-400 hover:text-white hover:border-red-500 text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
