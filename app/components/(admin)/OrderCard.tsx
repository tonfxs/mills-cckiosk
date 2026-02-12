"use client";

import KeyValue from "./KeyValue";

export type NetoOrderSummary = {
  orderNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  paymentMethod: string;
  paymentAmount: string;
  phoneNumber: string;
  datePlaced?: string;
  orderStatus?: string;
  grandTotal?: string;
  salesChannel?: string;
  itemCount?: number;
};

export default function OrderCard({ order }: { order: NetoOrderSummary }) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-blue-600 text-lg">Order #{order.orderNumber}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {order.salesChannel && (
              <span className="inline-block bg-slate-100 px-2 py-1 rounded text-xs font-semibold mr-2">
                {order.salesChannel}
              </span>
            )}
            {(order.itemCount ?? 0) > 0 && (
              <span className="text-xs text-slate-600">
                {order.itemCount ?? 0} item{(order.itemCount ?? 0) !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            order.orderStatus === "Dispatched"
              ? "bg-green-100 text-green-700"
              : order.orderStatus === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {order.orderStatus || "—"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <KeyValue k="Customer" v={`${order.firstName} ${order.lastName}`.trim() || "—"} />
        <KeyValue k="Email" v={order.email} />
        <KeyValue k="Payment Method" v={order.paymentMethod} />
        <KeyValue k="Amount" v={order.paymentAmount ? `$${order.paymentAmount}` : "—"} />
        <KeyValue k="Phone" v={order.phoneNumber} />
        <KeyValue
          k="Date Placed"
          v={order.datePlaced ? new Date(order.datePlaced).toLocaleDateString() : "—"}
        />
      </div>
    </div>
  );
}
