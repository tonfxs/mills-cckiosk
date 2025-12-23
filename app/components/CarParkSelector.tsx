"use client";

import { useState } from "react";

interface Props {
  formData: {
    carParkBay: string;
  };
  errors: {
    carParkBay?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const CAR_PARK_GROUPS: Record<string, number[]> = {
  "Front Bay": [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  "Opposite": [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  "Wall Park": [11, 12, 13],
  // Fence: [14, 15],
  "Side Park": [1, 1, 2 ],
};

const CAR_PARK_LABELS: Record<string, string> = {
  "Front Bay": "Bay",
  "Opposite": "Opp",
  "Wall Park": "Wall",
  // Fence: "Fence",
  "Side Park": "Side",
};

export default function CarParkSelector({
  formData,
  errors,
  handleChange,
}: Props) {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  return (
    <div className="mb-8">

      <div className="">
      <label className="block text-4xl font-semibold mb-2 text-gray-700 text-left">
        Select Car Park Bay
      </label>
      </div>


      <label className="block text-lg font-semibold mb-4 text-red-700 text-left">
        Note: Please be advised not to relocate or change bays after confirming
        location.
      </label>

        {/* CATEGORY BUTTONS — KIOSK SAFE */}
        <div className="max-w-4xl mx-auto mb-8 overflow-hidden">
          <div className="flex justify-between gap-2">
            {Object.keys(CAR_PARK_GROUPS).map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveGroup(group)}
                className="flex-1 h-20
                           rounded-3xl text-2xl font-bold
                           bg-white/70 backdrop-blur-md text-gray-900
                           transition-all duration-200
                           hover:scale-80 active:scale-95 border border-gray-300 hover:bg-blue-700 active:bg-blue-500 hover:text-white active:text-white"
              >
                {group}
              </button>
            ))}
          </div>
        </div>



      {/* SELECTED BAY DISPLAY */}
      {formData.carParkBay && selectedGroup && (
        <div className="text-center text-3xl font-bold mb-6 text-blue-700">
          {CAR_PARK_LABELS[selectedGroup]} - {formData.carParkBay}
        </div>
      )}

      {/* ERROR */}
      {errors.carParkBay && (
        <p className="text-red-600 text-xl mt-4 text-center">
          {errors.carParkBay}
        </p>
      )}

      {/* MODAL */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-[90%] max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-4xl text-gray-800 font-bold">{activeGroup}</h2>
              <button
                type="button"
                onClick={() => setActiveGroup(null)}
                className="text-3xl text-gray-800 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {CAR_PARK_GROUPS[activeGroup].map((num) => {
                const isSelected = formData.carParkBay === String(num);

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      handleChange({
                        target: {
                          name: "carParkBay",
                          value: String(num),
                          type: "select-one",
                        },
                      } as React.ChangeEvent<HTMLSelectElement>);

                      setSelectedGroup(activeGroup);
                      setActiveGroup(null);
                    }}
                    className={`
                      h-20 rounded-3xl text-3xl font-bold
                      transition-all duration-200
                      ${
                        isSelected
                          ? "bg-blue-700 text-white scale-105"
                          : "bg-blue-600 text-white hover:scale-105 active:scale-95"
                      }
                    `}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
