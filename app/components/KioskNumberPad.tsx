"use client";

import { useState } from "react";

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

    const [recentDigitIndex, setRecentDigitIndex] = useState<number | null>(null);
    const [recentDigitValue, setRecentDigitValue] = useState<string | null>(null);

    const addDigit = (digit: string) => {
        if (value.length < maxLength) {
            const newValue = value + digit;
            onChange(newValue);

            // briefly show the last typed digit
            setRecentDigitIndex(newValue.length - 1);
            setRecentDigitValue(digit);

            setTimeout(() => {
                setRecentDigitIndex(null);
                setRecentDigitValue(null);
            }, 500);
        }
    };

    const deleteDigit = () => {
        onChange(value.slice(0, -1));
        setRecentDigitIndex(null);
        setRecentDigitValue(null);
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
                {Array.from({ length: maxLength }).map((_, i) => {
                    const showDigit =
                        i === recentDigitIndex
                            ? recentDigitValue
                            : value[i]
                                ? "•"
                                : "";

                    return (
                        <div
                            key={i}
                            className="h-14 w-12 border-b-4 border-gray-600 text-center text-black"
                        >
                            {showDigit}
                        </div>
                    );
                })}
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

                {/* blank placeholder */}
                <button className="opacity-0" />

                {/* 0 */}
                <button
                    onClick={() => addDigit("0")}
                    className="bg-gray-700 p-6 rounded-xl shadow active:scale-95 text-white"
                >
                    0
                </button>

                {/* Delete */}
                <button
                    onClick={deleteDigit}
                    disabled={value.length === 0}
                    className="bg-red-400 p-6 rounded-xl shadow active:scale-95 text-white"
                >
                    ←
                </button>
            </div>
        </div>
    );
}
