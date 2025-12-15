'use client';

import { useEffect } from "react";

interface SuccessScreenProps {
  title?: string;
  message?: string;
  identifierLabel?: string;
  identifierValue: string;
  redirectMessage?: string;
  onDone?: () => void;   // <-- NEW
}

export default function SuccessScreen({
  title = "Success!",
  message = "Your request has been submitted",
  identifierLabel = "Reference Number",
  identifierValue,
  redirectMessage = "Redirecting to main menu...",
  onDone,
}: SuccessScreenProps) {

  // Automatically trigger callback after a delay
  useEffect(() => {
    if (!onDone) return;

    const timer = setTimeout(() => {
      onDone();
    }, 3000); // waits 3 seconds

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center px-8 max-w-2xl">
        <div className="mb-8 animate-bounce">
          <div className="w-32 h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <svg
              className="w-20 h-20 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={4}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-6xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-3xl text-gray-600 mb-8 font-bold">{message}</p>

        <div className="bg-blue-50 rounded-3xl p-8 border-4 border-blue-200">
          <p className="text-2xl text-gray-700 mb-2">{identifierLabel}:</p>
          <p className="text-5xl font-bold text-blue-600">{identifierValue}</p>
        </div>

        <p className="text-2xl text-gray-500 mt-8">{redirectMessage}</p>
      </div>
    </div>
  );
}
