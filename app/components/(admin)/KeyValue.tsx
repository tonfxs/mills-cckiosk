"use client";

export default function KeyValue({ k, v }: { k: string; v?: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{k}</p>
      <p className="text-sm font-semibold text-slate-900 mt-1">{v || "—"}</p>
    </div>
  );
}
