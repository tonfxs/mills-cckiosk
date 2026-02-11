"use client";

import { label } from "motion/react-client";

interface OtherPaymentPopupProps {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  onAfterSelect?: () => void; // ✅ add this
}

const OTHER_PAYMENT_METHODS = [
  { value: "afterpay", label: "Afterpay" },
  { value: "cardatwindow", label: "Card at Window (EFTPOS)" },
  { value: "cash", label: "Cash" },
  { value: "electronictransfer", label: "Electronic Transfer" },
  { value: "overthephone", label: "Over the Phone (Westpac PayWay)" },
  { value: "paypal", label: "PayPal" },
  { value: "stripe", label: "Stripe" },
  { value: "storecredit", label: "Store Credit" },
  { value: "zippay", label: "ZipPay" },
  { value: "replacement", label: "Replacement Order" },


];

export default function OtherPaymentPopup({
  open,
  onClose,
  onSelect,
  onAfterSelect
}: OtherPaymentPopupProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-10 w-[1020px]">
        <h2 className="text-4xl font-semibold mb-8 text-center">
          Select Payment Method
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {OTHER_PAYMENT_METHODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onSelect(value);
                onAfterSelect?.(); // ✅ proceed next after selection
              }}
              className="
                h-34 w-full
                flex items-center justify-center
                text-center
                text-4xl font-semibold
                rounded-2xl border-4
                bg-white text-gray-700 border-gray-300
                hover:border-blue-500 hover:bg-blue-50
                transition-all
                px-6
              "
            >
              {label}
            </button>

            
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-10 w-full text-2xl py-4 rounded-2xl
                     border-4 border-red-400 text-red-600
                     hover:bg-red-200 font-bold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
