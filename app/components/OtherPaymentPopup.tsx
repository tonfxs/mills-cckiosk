// "use client";

// import { label } from "motion/react-client";

// interface OtherPaymentPopupProps {
//   open: boolean;
//   onClose: () => void;
//   onSelect: (value: string) => void;
//   onAfterSelect?: () => void; // ✅ add this
// }

// const OTHER_PAYMENT_METHODS = [
//   { value: "afterpay", label: "Afterpay" },
//   { value: "cardatwindow", label: "Card at Window (EFTPOS)" },
//   { value: "cash", label: "Cash" },
//   { value: "electronictransfer", label: "Electronic Transfer" },
//   { value: "overthephone", label: "Over the Phone (Westpac PayWay)" },
//   { value: "paypal", label: "PayPal" },
//   { value: "stripe", label: "Stripe" },
//   { value: "storecredit", label: "Store Credit" },
//   { value: "zippay", label: "ZipPay" },
//   { value: "applepay", label: "Apple Pay" },
//   { value: "replacement", label: "Replacement Order" },


// ];

// export default function OtherPaymentPopup({
//   open,
//   onClose,
//   onSelect,
//   onAfterSelect
// }: OtherPaymentPopupProps) {
//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
//       <div className="bg-white rounded-3xl p-10 w-[1020px]">
//         <h2 className="text-4xl font-semibold mb-8 text-center">
//           Select Payment Method
//         </h2>

//         <div className="grid grid-cols-4 gap-6">
//           {OTHER_PAYMENT_METHODS.map(({ value, label }) => (
//             <button
//               key={value}
//               type="button"
//               onClick={() => {
//                 onSelect(value);
//                 onAfterSelect?.(); // ✅ proceed next after selection
//               }}
//               className="
//                 h-34 w-full
//                 flex items-center justify-center
//                 text-center
//                 text-4xl font-semibold
//                 rounded-2xl border-4
//                 bg-white text-gray-700 border-gray-300
//                 hover:border-blue-500 hover:bg-blue-50
//                 transition-all
//                 px-6
//               "
//             >
//               {label}
//             </button>

            
//           ))}
//         </div>

//         <button
//           type="button"
//           onClick={onClose}
//           className="mt-10 w-full text-2xl py-4 rounded-2xl
//                      border-4 border-red-400 text-red-600
//                      hover:bg-red-200 font-bold"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   );
// }




"use client";

import { useEffect, useId, useRef } from "react";

interface PaymentMethod {
  value: string;
  label: string;
}

interface OtherPaymentPopupProps {
  open: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  onAfterSelect?: () => void;
}

const OTHER_PAYMENT_METHODS: PaymentMethod[] = [
  { value: "Afterpay", label: "Afterpay" },
  { value: "Apple Pay", label: "Apple Pay" },
  { value: "Card at Window", label: "Card at Window (EFTPOS)" },
  { value: "Cash", label: "Cash" },
  { value: "Electronic Transfer", label: "Electronic Transfer" },
  { value: "Over the Phone", label: "Over the Phone (Westpac PayWay)" },
  { value: "Paypal", label: "PayPal" },
  { value: "Stripe", label: "Stripe" },
  { value: "Store Credit", label: "Store Credit" },
  { value: "ZipPay", label: "ZipPay" },
  { value: "Replacement", label: "Replacement Order" },
];

export default function OtherPaymentPopup({
  open,
  onClose,
  onSelect,
  onAfterSelect,
}: OtherPaymentPopupProps) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Close on Escape + lock body scroll while open
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (value: string) => {
    onSelect(value);
    onAfterSelect?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl outline-none sm:rounded-3xl sm:p-8 lg:p-10"
      >
        <h2
          id={headingId}
          className="mb-6 text-center text-2xl font-semibold text-gray-900 sm:mb-8 sm:text-3xl lg:text-4xl"
        >
          Select Payment Method
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 lg:gap-6">
          {OTHER_PAYMENT_METHODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              className="flex h-24 w-full items-center justify-center rounded-xl border-2 border-gray-300 bg-white px-4 text-center text-base font-semibold text-gray-700 transition-colors hover:border-blue-500 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 sm:h-28 sm:rounded-2xl sm:px-6 sm:text-lg lg:h-32 lg:text-2xl"
            >
              {label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-xl border-2 border-red-400 py-3 text-lg font-bold text-red-600 transition-colors hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 sm:mt-10 sm:rounded-2xl sm:py-4 sm:text-xl"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}