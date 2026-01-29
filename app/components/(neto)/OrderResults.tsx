"use client";

import React from "react";
import type { OrderResult } from "@/app/types/neto-lookup";

function matchBadgeClasses(match: OrderResult["match"]) {
  if (match.nameMatch && match.phoneMatch) return "bg-emerald-100 text-emerald-800";
  if (match.nameMatch || match.phoneMatch) return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

function matchLabel(match: OrderResult["match"]) {
  const parts: string[] = [];
  if (match.nameMatch) parts.push("NAME");
  if (match.phoneMatch) parts.push("PHONE");
  return parts.length ? parts.join("+") : "NO MATCH";
}

export function OrderResults(props: { results: OrderResult[] }) {
  const { results } = props;

  if (results.length === 0) return <div className="text-slate-600">No orders returned.</div>;

  return (
    <div className="mt-6 space-y-4">
      {results.map((o, idx) => (
        <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-slate-900 font-bold text-lg">Order: {o.orderId ?? "Unknown"}</div>
              <div className="mt-1 text-slate-700">
                Status: <span className="font-semibold">{o.status}</span>
              </div>
              {o.datePlaced && <div className="text-slate-600 text-sm">Placed: {o.datePlaced}</div>}
            </div>

            <div className="text-right">
              <div
                className={`text-xs font-bold px-3 py-1 rounded-full inline-block ${matchBadgeClasses(o.match)}`}
              >
                Match: {matchLabel(o.match)}
              </div>
            </div>
          </div>

          {o.items.length > 0 && (
            <div className="mt-4">
              <div className="text-slate-900 font-semibold">Items</div>
              <div className="mt-2 space-y-2">
                {o.items.map((it, i) => (
                  <div
                    key={i}
                    className="flex justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2"
                  >
                    <div className="text-slate-800">{it.name}</div>
                    <div className="text-slate-700 font-semibold">x{it.qty}</div>
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
