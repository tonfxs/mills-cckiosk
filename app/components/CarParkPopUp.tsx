"use client";

import React, { useEffect, useState } from "react";
import CarParkMap from "./CarParkMap"; // adjust path

type Props = {
  open: boolean;
  onClose: () => void;
  value: string;
  onConfirm: (value: string) => void;
};

export default function CarParkBayPopup({ open, onClose, value, onConfirm }: Props) {
  const [draft, setDraft] = useState<string>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // prevent background scroll (kiosk friendly)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const canConfirm = draft.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close"
      />

      {/* Modal (TALLER) */}
      <div className="relative w-[96vw] max-w-[1280px] h-[92vh] max-h-[980px] rounded-3xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-6 border-b shrink-0">
          <div>
            <div className="text-3xl font-extrabold text-gray-900">Select Car Park Bay</div>
            <div className="text-lg font-bold text-red-600 mt-1">
              Note: Please do not relocate after confirming your bay.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-14 w-14 rounded-2xl border-2 border-gray-300 text-3xl font-black text-gray-700 hover:bg-gray-100 active:scale-95"
            aria-label="Close popup"
          >
            ×
          </button>
        </div>

        {/* BODY: takes all remaining height */}
        <div className="flex-1 p-8 flex items-center justify-center bg-white">
          {/* Map fills the available space directly */}
          <div className="w-full h-full">
            <CarParkMap value={draft} onChange={setDraft} />
          </div>
        </div>



        {/* Footer */}
        <div className="shrink-0 px-8 py-6 border-t bg-white">
          <div className="flex items-center justify-between gap-6">
            <div className="text-xl font-bold text-gray-700">
              Selected: <span className="text-gray-900">{draft || "None"}</span>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 rounded-2xl border-2 border-gray-300 text-xl font-extrabold text-gray-700 hover:bg-gray-100 active:scale-95"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!canConfirm}
                onClick={() => {
                  onConfirm(draft);
                  onClose();
                }}
                className={[
                  "px-10 py-4 rounded-2xl text-xl font-extrabold active:scale-95 transition",
                  canConfirm ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-200 text-gray-400 cursor-not-allowed",
                ].join(" ")}
              >
                Confirm Bay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
