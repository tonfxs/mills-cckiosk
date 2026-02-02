"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RmaPromptModalProps {
  open: boolean;
  onYes: () => void;
}

type RmaView = "question" | "no-rma";

export default function RmaPromptModal({
  open,
  onYes,
}: RmaPromptModalProps) {
  const router = useRouter();
  const [view, setView] = useState<RmaView>("question");

  useEffect(() => {
    if (view !== "no-rma") return;

    const redirectTimer = setTimeout(() => {
      router.push("/");
    }, 5000);

    return () => clearTimeout(redirectTimer);
  }, [view, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-12 text-center animate-in fade-in zoom-in duration-200">
        {view === "question" && (
          <>
            <h2 className="text-5xl font-extrabold text-gray-800 mb-12">
              Do you have RMA paperwork?
            </h2>

            <div className="flex gap-10 justify-center">
              <button
                onClick={onYes}
                className="px-16 py-6 text-3xl font-bold rounded-2xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all duration-150"
              >
                Yes
              </button>

              <button
                onClick={() => setView("no-rma")}
                className="px-16 py-6 text-3xl font-bold rounded-2xl bg-gray-200 text-gray-800 hover:bg-red-500 hover:text-white active:scale-95 transition-all duration-150"
              >
                No
              </button>
            </div>
          </>
        )}

        {view === "no-rma" && (
          <>
            <h2 className="text-5xl font-extrabold text-red-500 mb-8">
              No RMA Paperwork
            </h2>

            <p className="text-3xl font-semibold text-gray-800 leading-relaxed">
              Please proceed to the window for further assistance.
            </p>

            <div className="flex flex-col items-center gap-6 mt-12">
              <div
                className="h-14 w-14 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin"
                aria-label="Loading"
              />

              <p className="text-xl text-red-500">
                Returning to the home screen shortly…
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
