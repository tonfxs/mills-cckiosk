"use client";

interface CashPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CashPaymentModal({ isOpen, onClose }: CashPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-lg mx-auto text-center">
        <h2 className="text-4xl font-bold mb-6 text-gray-800">
          Cash Payment Selected
        </h2>

        <p className="text-2xl text-gray-700 mb-10">
          Please proceed to the{" "}
          <span className="font-semibold">Window Lobby</span> to pay in cash.
        </p>

        <button
          className="px-10 py-4 rounded-2xl bg-blue-600 text-white text-2xl font-semibold hover:bg-blue-700 transition"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
}
