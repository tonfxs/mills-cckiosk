// "use client";

// import { useState } from "react";
// import type { Tab } from "@/app/types/neto-lookup";
// import { TabButton } from "@/app/components/(neto)/TabButton";
// import { PickupForm } from "@/app/components/(neto)/PickupForm";
// import { RmaForm } from "@/app/components/(neto)/RmaForm";
// import { PartsForm } from "@/app/components/(neto)/PartsForm";

// export default function NetoLookupAdminPage() {
//   const [tab, setTab] = useState<Tab>("pickup");

//   return (
//     <div className="p-8">
//       <h1 className="text-3xl font-bold text-slate-900">Neto Lookup</h1>
//       <p className="mt-2 text-slate-600">
//         Tool to validate kiosk submissions against Neto orders / RMAs.
//       </p>

//       <div className="mt-6 flex gap-2">
//         <TabButton active={tab === "pickup"} onClick={() => setTab("pickup")}>
//           Pickup Orders
//         </TabButton>
//         <TabButton active={tab === "rma"} onClick={() => setTab("rma")}>
//           RMA
//         </TabButton>
//         <TabButton active={tab === "parts"} onClick={() => setTab("parts")}>
//           Parts Assistance
//         </TabButton>
//       </div>

//       <div className="mt-8">
//         {tab === "pickup" && <PickupForm />}
//         {tab === "rma" && <RmaForm />}
//         {tab === "parts" && <PartsForm />}
//       </div>
//     </div>
//   );
// }


// app/admin/orders/page.tsx
"use client";

import { useMemo, useState } from "react";

type LookupResult = {
  matchedAs: "ORDER" | "RMA";
  orderNumber: string;
  rmaNumber: string;
  firstName: string;
  lastName: string;
  paymentMethod: string;
  phoneNumber: string;
};

export default function AdminLookupPage() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  const canSearch = useMemo(() => id.trim().length > 0 && !loading, [id, loading]);

  async function onSearch() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/neto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      setResult(data.result as LookupResult);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Customer Lookup</h1>
        <p className="text-slate-600 mt-1">
          Enter the <span className="font-semibold">Customer Name</span> to validate.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Customer Name</label>
              <input
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Enter customer name"
              />
            </div>

            <button
              type="button"
              disabled={!canSearch}
              onClick={onSearch}
              className={`rounded-xl px-6 py-3 font-semibold text-white ${
                !canSearch ? "bg-slate-300 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"
              }`}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setId("");
                setResult(null);
                setError(null);
              }}
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>
          )}
        </div>

        {result && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900">Details (Neto)</h2>
              <span className="text-xs font-bold rounded-full px-3 py-1 border border-slate-200 text-slate-700">
                Matched as: {result.matchedAs}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <KeyValue k="Order Number" v={result.orderNumber} />
              <KeyValue k="RMA Number/ID" v={result.rmaNumber} />
              <KeyValue k="First Name" v={result.firstName} />
              <KeyValue k="Last Name" v={result.lastName} />
              <KeyValue k="Payment Method" v={result.paymentMethod} />
              <KeyValue k="Phone Number" v={result.phoneNumber} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KeyValue({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-600">{k}</p>
      <p className="mt-1 text-sm font-bold text-slate-900 break-words">{v || "—"}</p>
    </div>
  );
}
