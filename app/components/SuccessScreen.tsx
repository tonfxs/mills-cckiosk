'use client';

import { useEffect } from "react";

interface SuccessScreenProps {
  title?: string;
  message?: string;
  identifierLabel?: string;
  identifierValue: string;
  redirectMessage?: string;
  onDone?: () => void;  
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
    }, 12000); // waits 3 seconds

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center overflow-y-auto py-6">
      <div className="text-center px-4 md:px-8 max-w-2xl w-full">
        <div className="mb-6 md:mb-8 animate-bounce">
          <div className="w-20 h-20 md:w-32 md:h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
            <svg
              className="w-12 h-12 md:w-20 md:h-20 text-white"
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

        <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-xl md:text-3xl text-gray-600 mb-6 md:mb-8 font-bold">{message}</p>

        <div className="bg-blue-50 rounded-3xl p-5 md:p-8 border-4 border-blue-200">
          <p className="text-lg md:text-2xl text-gray-700 mb-2">{identifierLabel}:</p>
          <p className="text-3xl md:text-5xl font-bold text-blue-600 break-all">{identifierValue}</p>
        </div>

        <p className="text-lg md:text-2xl text-gray-500 mt-6 md:mt-8">{redirectMessage}</p>
      </div>
    </div>
  );
}