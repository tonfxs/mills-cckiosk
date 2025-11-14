import { useState } from "react";

interface ModalProps {
  onClose: () => void;
}

export default function PickUpConfirmationModal({ onClose }: ModalProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Glass background overlay */}
      <div
        className="absolute inset-0 bg-white/20 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white/30 backdrop-blur-md rounded-3xl p-8 w-80 text-center shadow-2xl border border-white/30 pointer-events-auto">
        {/* Check SVG */}
        <div className="flex justify-center mb-6">
          <svg
            className="w-24 h-24 text-green-500"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path
              d="M9 12l2 2l4-4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Thank you text */}
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Thank You!</h2>
        <p className="text-gray-700 mb-6">Your order has been submitted successfully.</p>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="px-8 py-3 bg-green-500 text-white font-semibold rounded-full shadow-lg hover:bg-green-600 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
