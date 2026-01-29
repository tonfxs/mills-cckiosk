"use client";

import React from "react";
import type { RmaResult } from "@/app/types/neto-lookup";

export function RmaResults(props: { results: RmaResult[] }) {
  const { results } = props;

  if (results.length === 0) return <div className="text-slate-600">No RMAs returned.</div>;

  return (
    <div className="mt-6 space-y-4">
      {results.map((r) => (
        <div key={r.rmaId} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-slate-900 font-bold text-lg">RMA: {r.rmaId}</div>
          <div className="mt-1 text-slate-700">
            Status: <span className="font-semibold">{r.status}</span>
          </div>
          <div className="mt-1 text-slate-600 text-sm">
            OrderID: {r.orderId ?? "—"} · Invoice: {r.invoiceNumber ?? "—"}
          </div>

          {r.lines.length > 0 && (
            <div className="mt-4">
              <div className="text-slate-900 font-semibold">Lines</div>
              <div className="mt-2 space-y-2">
                {r.lines.map((l, i) => (
                  <div
                    key={i}
                    className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2"
                  >
                    <div className="text-slate-800">{l.name}</div>
                    <div className="text-slate-700 font-semibold">x{l.qty}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
