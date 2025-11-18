"use client";

export default function KioskNumberPad({
    value,
    onChange,
    maxLength = 4,
    onSubmit,
}: {
    value: string;
    onChange: (v: string) => void;
    maxLength?: number;
    onSubmit?: (val: string) => void;
}) {

    const addDigit = (digit: string) => {
        if (value.length < maxLength) {
            onChange(value + digit);
        }
    };

    const deleteDigit = () => {
        onChange(value.slice(0, -1));
    };

    const handleSubmit = () => {
        if (value.length === maxLength && onSubmit) {
            onSubmit(value);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 select-none">

            {/* DISPLAY */}
            <div className="flex gap-4 text-4xl">
                {Array.from({ length: maxLength }).map((_, i) => (
                    <div
                        key={i}
                        className="h-14 w-12 border-b-4 border-gray-600 text-center text-black"
                    >
                        {value[i] ? "•" : ""}
                    </div>
                ))}
            </div>

            {/* KEYPAD */}
            <div className="grid grid-cols-3 gap-6 mt-4 text-3xl">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => addDigit(String(num))}
                        className="bg-gray-700 p-6 rounded-xl shadow active:scale-95 text-white"
                    >
                        {num}
                    </button>
                ))}

                <button>

                </button>


                {/* 0 */}
                <button
                    onClick={() => addDigit("0")}
                    className="bg-gray-700 p-6 rounded-xl shadow active:scale-95 text-white"
                >
                    0
                </button>

                {/* Confirm */}
                <button
                    onClick={deleteDigit}
                    disabled={value.length === 0}
                    className={`bg-gray-700 p-6 rounded-xl shadow active:scale-95 text-white ${value.length === maxLength
                        ? "bg-red-400"
                        : "bg-red-400"
                        }`}
                >
                    ←
                </button>
            </div>
        </div >
    );
}
