"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";

export interface OrderItem {
  SKU: string;
  Name: string;
  Quantity: number;
  Price: number;
}

export interface OrderDetails {
  OrderID: string;
  OrderNumber: string;
  OrderStatus: string;
  DatePlaced: string;
  Email: string;
  ShipFirstName: string;
  ShipLastName: string;
  ShipAddress1: string;
  ShipCity: string;
  ShipState: string;
  ShipPostCode: string;
  ShipCountry: string;
  GrandTotal: string;
  Items: OrderItem[];
}

interface OrderDetailsModalProps {
  open: boolean;
  order: OrderDetails | null;
  loading?: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({
  open,
  order,
  loading = false,
  onClose,
}: OrderDetailsModalProps) {
  // Close on ESC key
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl p-6">

        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h2 className="text-xl font-semibold">
            {loading ? "Loading Order..." : `Order #${order?.OrderNumber ?? ""}`}
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        )}

        {/* Order Details */}
        {!loading && order && (
          <div className="space-y-6">

            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Status</p>
                <p className="text-gray-600">{order.OrderStatus}</p>
              </div>

              <div>
                <p className="font-medium">Date Placed</p>
                <p className="text-gray-600">
                  {new Date(order.DatePlaced).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="font-medium">Customer Email</p>
                <p className="text-gray-600">{order.Email}</p>
              </div>

              <div>
                <p className="font-medium">Total</p>
                <p className="text-gray-600">{order.GrandTotal}</p>
              </div>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold mb-2">Shipping Address</h3>
              <div className="text-sm text-gray-600">
                <p>
                  {order.ShipFirstName} {order.ShipLastName}
                </p>
                <p>{order.ShipAddress1}</p>
                <p>
                  {order.ShipCity}, {order.ShipState} {order.ShipPostCode}
                </p>
                <p>{order.ShipCountry}</p>
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3">Items</h3>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-left">
                    <tr>
                      <th className="px-4 py-2">SKU</th>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.Items.map((item, index) => (
                      <tr
                        key={index}
                        className="border-t hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-2">{item.SKU}</td>
                        <td className="px-4 py-2">{item.Name}</td>
                        <td className="px-4 py-2">{item.Quantity}</td>
                        <td className="px-4 py-2">{item.Price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
