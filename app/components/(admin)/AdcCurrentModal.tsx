"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    bayNumber: string;
    agent: string;
    status: string;
    timestamp: string;
  }) => void;
  orderNumber?: string;
};

export default function AdcCurrentModal({
  open,
  onClose,
  onSave,
  orderNumber,
}: Props) {
  const [bayNumber, setBayNumber] = useState("");
  const [agent, setAgent] = useState("KB");
  const [status, setStatus] = useState("Completed");
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    if (open) {
      const time = new Intl.DateTimeFormat("en-AU", {
        timeZone: "Australia/Sydney",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date());

      setTimestamp(time);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    onSave({
      bayNumber,
      agent,
      status,
      timestamp,
    });

    onClose();

    setBayNumber("");
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 ">
      <div className="bg-white rounded-xl p-6 w-[400px]">
        <h2 className="text-lg text-slate-600 font-semibold mb-4">
          Order {orderNumber}
        </h2>

        <input
          placeholder="Bay Number"
          value={bayNumber}
          onChange={(e) => setBayNumber(e.target.value)}
          className="w-full border border-slate-200 rounded-lg p-2 mb-3 text-slate-600"
        />

        <select
          value={agent}
          onChange={(e) => setAgent(e.target.value)}
          className="w-full border rounded-lg p-2 mb-3 text-slate-600 border-slate-200"
        >
          <option value=" "></option>
          <option value="KB">KB</option>
          <option value="CC">CC</option>
          <option value="JB">JB</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded-lg p-2 mb-3 border-slate-200 text-slate-600"
        >
          <option value=" "></option>
          <option value="Completed">Completed</option>
          <option value="Not yet">Not yet</option>
        </select>

        <div className="text-sm text-gray-500 mb-4">
          Time: {timestamp}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="border px-4 py-2 rounded-lg border-red-400 text-red-600 hover:bg-red-500 hover:text-white"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-800 hover:text-white"
          >
            Save
          </button>

        </div>
      </div>
    </div>
  );
}
