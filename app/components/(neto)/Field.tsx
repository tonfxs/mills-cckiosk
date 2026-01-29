"use client";

import React from "react";

export function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <div className="text-sm font-semibold text-slate-800">{props.label}</div>
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        inputMode={props.inputMode}
        className="mt-2 w-full rounded-xl border border-slate-200 text-slate-600 bg-white px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-300"
      />
    </label>
  );
}
