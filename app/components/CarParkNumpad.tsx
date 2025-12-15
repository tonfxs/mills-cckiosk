"use client";

interface CarParkNumpadProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CarParkNumpad({
  value,
  onChange,
  onClose,
  onSubmit,
}: CarParkNumpadProps) {
  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-xxs flex items-end justify-center p-6 z-50">

      <div className="relative bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-4xl font-bold text-gray-600"
        >
          ✕
        </button>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-6 mt-10">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => onChange(value + num)}
              className="text-5xl bg-gray-700 py-8 rounded-2xl active:bg-gray-300 shadow"
            >
              {num}
            </button>
          ))}

          {/* Delete */}
          <button
            onClick={() => onChange(value.slice(0, -1))}
            className="text-4xl bg-red-700 py-8 rounded-2xl active:bg-red-400 shadow"
          >
            ⌫
          </button>

          {/* Zero */}
          <button
            onClick={() => onChange(value + "0")}
            className="text-5xl bg-gray-700 py-8 rounded-2xl active:bg-gray-300 shadow"
          >
            0
          </button>

          {/* OK */}
          <button
            onClick={onSubmit}
            className="text-4xl bg-blue-700 text-white py-8 rounded-2xl active:bg-blue-600 shadow"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
