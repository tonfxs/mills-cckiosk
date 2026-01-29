// "use client";

// import { useEffect, useState } from "react";

// type NetoOrder = {
//   OrderID?: string;
//   OrderNumber?: string;
//   OrderStatus?: string;
//   DatePlaced?: string;
//   Email?: string;

//   ShipFirstName?: string;
//   ShipLastName?: string;
//   ShipPhone?: string;

//   BillFirstName?: string;
//   BillLastName?: string;
//   BillPhone?: string;

//   GrandTotal?: string;
//   ShippingTotal?: string;

//   Items?: Array<{
//     SKU?: string;
//     Name?: string;
//     Quantity?: string;
//     Price?: string;
//     Total?: string;
//   }>;
// };

// type ApiResponse =
//   | { ok: true; order: NetoOrder; items: any[]; itemsCount?: number }
//   | { ok: false; error: string };

// export function OrderDetailsModal({
//   open,
//   orderKey,
//   onClose,
// }: {
//   open: boolean;
//   orderKey: string | null;
//   onClose: () => void;
// }) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [order, setOrder] = useState<NetoOrder | null>(null);
//   const [items, setItems] = useState<any[]>([]);


//   useEffect(() => {
//   if (!open || !orderKey) return;

//   const key = orderKey; // ✅ now it's guaranteed string in this effect run
//   let cancelled = false;

//   async function load() {
//     setLoading(true);
//     setError(null);
//     setOrder(null);

//     try {
//       const res = await fetch(`/api/neto/orders/${encodeURIComponent(key)}`, {
//         cache: "no-store",
//       });


//         const text = await res.text();
//         let data: any;
//         try {
//           data = JSON.parse(text);
//         } catch {
//           throw new Error(`API returned non-JSON (${res.status}): ${text.slice(0, 120)}`);
//         }

//         if (!res.ok || !data?.ok) {
//           throw new Error(data?.error || `Request failed (${res.status})`);
//         }
//         setOrder(data.order);


//       if (!cancelled) setOrder(data.order);
//     } catch (e: any) {
//       if (!cancelled) setError(e?.message || "Failed to load order");
//     } finally {
//       if (!cancelled) setLoading(false);
//     }
//   }

//   load();
//   return () => {
//     cancelled = true;
//   };
// }, [open, orderKey]);


//   useEffect(() => {
//     if (!open) return;
//     const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [open, onClose]);

//   const fullName =
//     [order?.ShipFirstName, order?.ShipLastName].filter(Boolean).join(" ") ||
//     [order?.BillFirstName, order?.BillLastName].filter(Boolean).join(" ");

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50">
//       {/* Backdrop */}
//       <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close modal" />

//       {/* Panel */}
//       <div className="absolute inset-x-0 top-8 mx-auto w-[min(1100px,calc(100%-2rem))]">
//         <div className="rounded-2xl bg-white shadow-xl border overflow-hidden">
//           <div className="flex items-start justify-between gap-4 px-5 py-4 border-b">
//             <div>
//               <h2 className="text-lg text-slate-600 font-bold">Pickup Order Details</h2>
//               <p className="text-sm text-slate-600 mt-1">
//                 Selected: <span className="font-mono">{orderKey}</span>
//               </p>
//             </div>

//             <button
//               onClick={onClose}
//               className="rounded-xl border px-3 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 active:bg-red-100"
//             >
//               Close
//             </button>
//           </div>

//           <div className="max-h-[78vh] overflow-auto p-5 space-y-5">
//             {loading && (
//               <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
//                 Loading order from Neto…
//               </div>
//             )}

//             {error && (
//               <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//                 {error}
//               </div>
//             )}

//             {!loading && !error && order && (
//               <>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <Card title="Order">
//                     <div className="text-sm space-y-1 text-slate-600">
//                       <Row label="Order #" value={order.OrderNumber || order.OrderID || "—"} />
//                       <Row label="Status" value={order.OrderStatus || "—"} />
//                       <Row label="Placed" value={order.DatePlaced || "—"} />
//                     </div>
//                   </Card>

//                   <Card title="Customer">
//                     <div className="text-sm text-slate-600">
//                       <div className="font-semibold">{fullName || "—"}</div>
//                       <div className="text-slate-600">{order.Email || "—"}</div>
//                       <div className="text-slate-600">{order.ShipPhone || order.BillPhone || "—"}</div>
//                     </div>
//                   </Card>

//                   <Card title="Totals">
//                     <div className="text-sm space-y-1 text-slate-600">
//                       <Row label="Grand Total" value={order.GrandTotal || "—"} />
//                       <Row label="Shipping" value={order.ShippingTotal || "—"} />
//                     </div>
//                   </Card>
//                 </div>

//                 <div className="rounded-2xl border bg-white overflow-hidden">
//                   <div className="px-4 py-3 border-b">
//                     <h3 className="font-semibold text-slate-600">Items</h3>
//                   </div>

//                   <div className="overflow-x-auto">
//                     <table className="min-w-full text-sm">
//                       <thead className="bg-slate-50 text-slate-600">
//                         <tr>
//                           <th className="text-left px-4 py-2">SKU</th>
//                           <th className="text-left px-4 py-2">Name</th>
//                           <th className="text-right px-4 py-2">Qty</th>
//                           <th className="text-right px-4 py-2">Price</th>
//                           <th className="text-right px-4 py-2">Total</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {(order.Items || []).map((it, idx) => (
//                           <tr key={idx} className="border-t">
//                             <td className="px-4 py-2 font-mono">{it.SKU || "—"}</td>
//                             <td className="px-4 py-2">{it.Name || "—"}</td>
//                             <td className="px-4 py-2 text-right">{it.Quantity || "—"}</td>
//                             <td className="px-4 py-2 text-right">{it.Price || "—"}</td>
//                             <td className="px-4 py-2 text-right">{it.Total || "—"}</td>
//                           </tr>
//                         ))}

//                         {(!order.Items || order.Items.length === 0) && (
//                           <tr>
//                             <td className="px-4 py-4 text-slate-600" colSpan={5}>
//                               No items returned by Neto.
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Card({ title, children }: { title: string; children: React.ReactNode }) {
//   return (
//     <div className="rounded-2xl border bg-white p-4">
//       <div className="text-xs font-semibold text-slate-500">{title}</div>
//       <div className="mt-2">{children}</div>
//     </div>
//   );
// }

// function Row({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="flex items-center justify-between gap-4">
//       <div className="text-slate-600">{label}</div>
//       <div className="font-semibold">{value}</div>
//     </div>
//   );
// }




// "use client";

// import { useEffect, useMemo, useState } from "react";

// type NetoOrder = any;

// type ApiResponse =
//   | { ok: true; order: NetoOrder; resolvedOrderId?: string; matchedQuery?: string }
//   | { ok: false; error: string };

// function getNameFromAddress(addr: any) {
//   const first = addr?.FirstName ?? addr?.first_name ?? "";
//   const last = addr?.LastName ?? addr?.last_name ?? "";
//   return [first, last].filter(Boolean).join(" ").trim();
// }

// function getPhoneFromAddress(addr: any) {
//   return addr?.Phone ?? addr?.phone ?? addr?.Telephone ?? addr?.telephone ?? "";
// }

// export function OrderDetailsModal({
//   open,
//   orderKey,
//   onClose,
// }: {
//   open: boolean;
//   orderKey: string | null;
//   onClose: () => void;
// }) {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [order, setOrder] = useState<NetoOrder | null>(null);

//   // if lookup route resolves an ID, show it
//   const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(null);

//   useEffect(() => {
//     if (!open || !orderKey) return;

//     const key = orderKey.trim();
//     let cancelled = false;

//     async function load() {
//       setLoading(true);
//       setError(null);
//       setOrder(null);
//       setResolvedOrderId(null);

//       try {

//       // ✅ One endpoint only: handles E..., M..., or numeric OrderID
//       const url = `/api/neto/orders/${encodeURIComponent(key)}`;
          
//       const res = await fetch(url, { cache: "no-store" });



//         const text = await res.text();
//         let data: any;
//         try {
//           data = JSON.parse(text);
//         } catch {
//           throw new Error(`API returned non-JSON (${res.status}): ${text.slice(0, 160)}`);
//         }

//         if (!res.ok || !data?.ok) {
//           throw new Error(data?.error || `Request failed (${res.status})`);
//         }

//         if (!cancelled) {
//           setOrder(data.order);
//           if (data.resolvedOrderId) setResolvedOrderId(String(data.resolvedOrderId));
//         }
//       } catch (e: any) {
//         if (!cancelled) setError(e?.message || "Failed to load order");
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }

//     load();
//     return () => {
//       cancelled = true;
//     };
//   }, [open, orderKey]);

//   useEffect(() => {
//     if (!open) return;
//     const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, [open, onClose]);

//   const shipAddr = order?.ShipAddress ?? null;
//   const billAddr = order?.BillAddress ?? null;

//   const customerName = useMemo(() => {
//     const shipName = shipAddr ? getNameFromAddress(shipAddr) : "";
//     const billName = billAddr ? getNameFromAddress(billAddr) : "";
//     return shipName || billName || "—";
//   }, [shipAddr, billAddr]);

//   const customerPhone = useMemo(() => {
//     const shipPhone = shipAddr ? getPhoneFromAddress(shipAddr) : "";
//     const billPhone = billAddr ? getPhoneFromAddress(billAddr) : "";
//     return shipPhone || billPhone || "—";
//   }, [shipAddr, billAddr]);

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50">
//       <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close modal" />

//       <div className="absolute inset-x-0 top-8 mx-auto w-[min(1100px,calc(100%-2rem))]">
//         <div className="rounded-2xl bg-white shadow-xl border overflow-hidden">
//           <div className="flex items-start justify-between gap-4 px-5 py-4 border-b">
//             <div>
//               <h2 className="text-lg text-slate-600 font-bold">Pickup Order Details</h2>
//               <p className="text-sm text-slate-600 mt-1">
//                 Selected: <span className="font-mono">{orderKey}</span>
//                 {resolvedOrderId ? (
//                   <>
//                     {" "}
//                     <span className="text-slate-400">→</span>{" "}
//                     <span className="font-mono">OrderID {resolvedOrderId}</span>
//                   </>
//                 ) : null}
//               </p>
//             </div>

//             <button
//               onClick={onClose}
//               className="rounded-xl border px-3 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 active:bg-red-100"
//             >
//               Close
//             </button>
//           </div>

//           <div className="max-h-[78vh] overflow-auto p-5 space-y-5">
//             {loading && (
//               <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
//                 Loading order from Neto…
//               </div>
//             )}

//             {error && (
//               <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
//                 {error}
//               </div>
//             )}

//             {!loading && !error && order && (
//               <>
//                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                   <Card title="Order">
//                     <div className="text-sm space-y-1">
//                       <Row label="OrderID" value={String(order?.ID ?? "—")} />
//                       <Row label="Status" value={String(order?.OrderStatus ?? "—")} />
//                       <Row label="Placed" value={String(order?.DatePlaced ?? "—")} />
//                       <Row label="Updated" value={String(order?.DateUpdated ?? "—")} />
//                     </div>
//                   </Card>

//                   <Card title="Customer">
//                     <div className="text-sm">
//                       <div className="font-semibold">{customerName}</div>
//                       <div className="text-slate-600">{String(order?.Email ?? "—")}</div>
//                       <div className="text-slate-600">{customerPhone}</div>
//                     </div>
//                   </Card>

//                   <Card title="Totals">
//                     <div className="text-sm space-y-1">
//                       <Row label="Grand Total" value={String(order?.GrandTotal ?? "—")} />
//                       <Row label="Shipping" value={String(order?.ShippingTotal ?? "—")} />
//                     </div>
//                   </Card>
//                 </div>

//                 {/* Keep this while confirming line-items structure */}
//                 <div className="rounded-2xl border bg-white overflow-hidden">
//                   <div className="px-4 py-3 border-b">
//                     <h3 className="font-semibold">Raw Neto Payload</h3>
//                   </div>
//                   <pre className="text-xs bg-slate-950 text-slate-100 p-4 overflow-auto">
// {JSON.stringify(order, null, 2)}
//                   </pre>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// function Card({ title, children }: { title: string; children: React.ReactNode }) {
//   return (
//     <div className="rounded-2xl border bg-white p-4">
//       <div className="text-xs font-semibold text-slate-500">{title}</div>
//       <div className="mt-2">{children}</div>
//     </div>
//   );
// }

// function Row({ label, value }: { label: string; value: string }) {
//   return (
//     <div className="flex items-center justify-between gap-4">
//       <div className="text-slate-600">{label}</div>
//       <div className="font-semibold">{value}</div>
//     </div>
//   );
// }


"use client";

import { useEffect, useMemo, useState } from "react";

type NetoOrder = {
  OrderID?: string;
  OrderNumber?: string; // may not exist on some Neto payloads
  OrderStatus?: string;
  DatePlaced?: string;
  Email?: string;

  // NOTE: your API currently returns ShipAddress/BillAddress objects
  // but keep these for backwards compatibility if you later flatten
  ShipFirstName?: string;
  ShipLastName?: string;
  ShipPhone?: string;

  BillFirstName?: string;
  BillLastName?: string;
  BillPhone?: string;

  GrandTotal?: string | number;
  ShippingTotal?: string | number;

  // If you later decide to flatten items into order.Items, you can keep this,
  // but for now we render normalized `items` from the API response.
  Items?: Array<{
    SKU?: string;
    Name?: string;
    Quantity?: string | number;
    Price?: string | number;
    Total?: string | number;
  }>;
};

type ApiResponse =
  | { ok: true; order: any; items: any[]; itemsCount?: number; matchedQuery?: string }
  | { ok: false; error: string };

function getNameFromAddress(addr: any) {
  const first = addr?.FirstName ?? addr?.first_name ?? "";
  const last = addr?.LastName ?? addr?.last_name ?? "";
  return [first, last].filter(Boolean).join(" ").trim();
}

function getPhoneFromAddress(addr: any) {
  return addr?.Phone ?? addr?.phone ?? addr?.Telephone ?? addr?.telephone ?? "";
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).replace(/[^0-9.\-]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function money(v: any): string {
  const n = toNumber(v);
  if (n === null) return "—";
  return n.toFixed(2);
}

function pickLineField(line: any, ...keys: string[]) {
  for (const k of keys) {
    const val = line?.[k];
    if (val !== undefined && val !== null && String(val).trim() !== "") return val;
  }
  return undefined;
}

export function OrderDetailsModal({
  open,
  orderKey,
  onClose,
}: {
  open: boolean;
  orderKey: string | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // keep as any because Neto shapes vary (Order vs Orders, nested addresses, etc.)
  const [order, setOrder] = useState<any | null>(null);

  // ✅ normalized line-items from API
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!open || !orderKey) return;

    const key = orderKey.trim();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setOrder(null);
      setItems([]);

      try {
        const res = await fetch(`/api/neto/orders/${encodeURIComponent(key)}`, {
          cache: "no-store",
        });

        const text = await res.text();
        let data: ApiResponse;

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(`API returned non-JSON (${res.status}): ${text.slice(0, 120)}`);
        }

        if (!res.ok || !data?.ok) {
          throw new Error((data as any)?.error || `Request failed (${res.status})`);
        }

        if (!cancelled) {
          setOrder((data as any).order ?? null);
          setItems(Array.isArray((data as any).items) ? (data as any).items : []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load order");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open, orderKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Address objects are the reliable source in Neto payloads
  const shipAddr = order?.ShipAddress ?? null;
  const billAddr = order?.BillAddress ?? null;

  const fullName = useMemo(() => {
    // Prefer address name (Neto standard), fallback to your flattened fields if present
    const shipName = shipAddr ? getNameFromAddress(shipAddr) : "";
    const billName = billAddr ? getNameFromAddress(billAddr) : "";
    const flat =
      [order?.ShipFirstName, order?.ShipLastName].filter(Boolean).join(" ").trim() ||
      [order?.BillFirstName, order?.BillLastName].filter(Boolean).join(" ").trim();
    return shipName || billName || flat || "—";
  }, [shipAddr, billAddr, order]);

  const phone = useMemo(() => {
    const shipPhone = shipAddr ? getPhoneFromAddress(shipAddr) : "";
    const billPhone = billAddr ? getPhoneFromAddress(billAddr) : "";
    const flat = order?.ShipPhone || order?.BillPhone || "";
    return shipPhone || billPhone || flat || "—";
  }, [shipAddr, billAddr, order]);

  const orderNumberDisplay = String(order?.OrderID ?? order?.OrderNumber ?? "—");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close modal" />

      {/* Panel */}
      <div className="absolute inset-x-0 top-8 mx-auto w-[min(1100px,calc(100%-2rem))]">
        <div className="rounded-2xl bg-white shadow-xl border overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b">
            <div>
              <h2 className="text-lg text-slate-600 font-bold">Pickup Order Details</h2>
              <p className="text-sm text-slate-600 mt-1">
                Selected: <span className="font-mono">{orderKey}</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl border px-3 py-2 text-sm text-red-600 font-semibold hover:bg-red-50 active:bg-red-100"
            >
              Close
            </button>
          </div>

          <div className="max-h-[78vh] overflow-auto p-5 space-y-5">
            {loading && (
              <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-700">
                Loading order from Neto…
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {!loading && !error && order && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card title="Order">
                    <div className="text-sm space-y-1 text-slate-600">
                      <Row label="Order #" value={orderNumberDisplay} />
                      <Row label="Status" value={String(order?.OrderStatus ?? "—")} />
                      <Row label="Placed" value={String(order?.DatePlaced ?? "—")} />
                    </div>
                  </Card>

                  <Card title="Customer">
                    <div className="text-sm text-slate-600">
                      <div className="font-semibold">{fullName}</div>
                      <div className="text-slate-600">{String(order?.Email ?? "—")}</div>
                      <div className="text-slate-600">{phone}</div>
                    </div>
                  </Card>

                  <Card title="Totals">
                    <div className="text-sm space-y-1 text-slate-600">
                      <Row label="Grand Total" value={money(order?.GrandTotal)} />
                      <Row label="Shipping" value={money(order?.ShippingTotal)} />
                    </div>
                  </Card>
                </div>

                <div className="rounded-2xl border bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b">
                    <h3 className="font-semibold text-slate-600">Items</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="text-left px-4 py-2">SKU</th>
                          <th className="text-left px-4 py-2">Name</th>
                          <th className="text-right px-4 py-2">Qty</th>
                          <th className="text-right px-4 py-2">Price</th>
                          <th className="text-right px-4 py-2">Total</th>
                        </tr>
                      </thead>

                      <tbody>
                        {items.map((line, idx) => {
                          const sku = pickLineField(line, "SKU", "ItemSKU", "ProductSKU") ?? "—";
                          const name =
                            pickLineField(line, "ProductName", "Name", "ItemName", "Title") ?? "—";

                          const qtyRaw = pickLineField(line, "Quantity", "Qty", "OrderLineQty");
                          const priceRaw = pickLineField(line, "UnitPrice", "Price", "LinePrice");

                          const qty = toNumber(qtyRaw) ?? 0;
                          const price = toNumber(priceRaw);

                          const lineTotal =
                            toNumber(pickLineField(line, "Total", "LineTotal")) ??
                            (price !== null ? qty * price : null);

                          return (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2 font-mono text-slate-600">{String(sku)}</td>
                              <td className="px-4 py-2 text-slate-600">{String(name)}</td>
                              <td className="px-4 py-2 text-right text-slate-600">
                                {qtyRaw ?? "—"}
                              </td>
                              <td className="px-4 py-2 text-right text-slate-600">
                                {priceRaw != null ? money(priceRaw) : "—"}
                              </td>
                              <td className="px-4 py-2 text-right text-slate-600">
                                {lineTotal != null ? money(lineTotal) : "—"}
                              </td>
                            </tr>
                          );
                        })}

                        {items.length === 0 && (
                          <tr>
                            <td className="px-4 py-4 text-slate-600" colSpan={5}>
                              No items returned by Neto.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-slate-600">{label}</div>
      <div className="font-semibold text-slate-600">{value}</div>
    </div>
  );
}
