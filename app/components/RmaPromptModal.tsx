"use client";
import { useState } from "react";

interface RmaPromptModalProps {
  open: boolean;
  onYes: () => void;
  onNo: () => void;
}

export default function RmaPromptModal({
  open,
  onYes,
  onNo,
}: RmaPromptModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 md:p-12 text-center animate-in fade-in zoom-in duration-200">
        <h2 className="text-2xl md:text-4xl font-extrabold text-gray-800 mb-8 md:mb-16">
          Do you have a printed copy of your RMA paperwork?
        </h2>
        <div className="flex gap-4 md:gap-10 justify-center">
          <button
            onClick={onYes}
            className="flex-1 md:flex-none px-6 md:px-16 py-4 md:py-6 text-2xl md:text-3xl font-bold rounded-2xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-150"
          >
            Yes
          </button>
          <button
            onClick={onNo}
            className="flex-1 md:flex-none px-6 md:px-16 py-4 md:py-6 text-2xl md:text-3xl font-bold rounded-2xl bg-gray-200 text-gray-800 hover:bg-red-500 hover:text-white active:scale-95 transition-all duration-150"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}