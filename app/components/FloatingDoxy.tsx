"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface FloatingDoxyProps {
    doxyUrl?: string;
    autoResetMinutes?: number;
}

export default function FloatingDoxy({
    doxyUrl = process.env.NEXT_PUBLIC_DOXY_URL,
    autoResetMinutes = 10,
}: FloatingDoxyProps) {
    const router = useRouter();

    const [started, setStarted] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Restore state
    useEffect(() => {
        const saved = localStorage.getItem("doxy-started");
        const savedMini = localStorage.getItem("doxy-minimized");

        if (saved === "true") setStarted(true);
        if (savedMini === "true") setMinimized(true);
    }, []);

    // Persist states
    useEffect(() => {
        localStorage.setItem("doxy-started", started ? "true" : "false");
    }, [started]);

    useEffect(() => {
        localStorage.setItem("doxy-minimized", minimized ? "true" : "false");
    }, [minimized]);

    // Allow global open event
    useEffect(() => {
        const handleOpen = () => setStarted(true);
        window.addEventListener("open-doxy", handleOpen);
        return () => window.removeEventListener("open-doxy", handleOpen);
    }, []);

    // Auto-reset
    useEffect(() => {
        if (!started) return;
        const timer = setTimeout(() => {
            localStorage.removeItem("doxy-started");
            localStorage.removeItem("doxy-minimized");
            window.location.reload();
        }, autoResetMinutes * 60 * 1000);
        return () => clearTimeout(timer);
    }, [started, autoResetMinutes]);

    if (!started) return null;

    return (
        <div
            className={`fixed z-[99999] transition-all duration-300 ${minimized
                    ? "top-4 right-4 w-[360px] h-[300px] shadow-2xl rounded-xl overflow-hidden"
                    : "inset-0 bg-black"
                }`}
        >

            {/* Loading Overlay */}
            {!isLoaded && !minimized && (
                <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white z-50">
                    <p className="text-3xl font-semibold mb-3 animate-pulse">Connecting…</p>
                    <p className="text-lg opacity-70">Please allow camera & microphone</p>
                </div>
            )}

            {/* DOXY EMBED */}
            <iframe
                src={doxyUrl}
                className="w-full h-full border-none"
                allow="camera; microphone; fullscreen; display-capture"
                onLoad={() => setIsLoaded(true)}
            ></iframe>

            {/* CONTROLS (only in full mode) */}
            {!minimized && (
                <button
                    className="absolute bottom-0 w-full py-6 text-4xl font-bold bg-green-600 text-white"
                    onClick={() => {
                        setMinimized(true);
                        router.push("/choose-service");
                    }}
                >
                    CONTINUE
                </button>
            )}

            {/* Close/X Button */}
            <button
                className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                onClick={() => {
                    setStarted(false);
                    setMinimized(false);
                    localStorage.removeItem("doxy-started");
                    localStorage.removeItem("doxy-minimized");
                }}
            >
                ✕
            </button>
        </div>
    );
}
