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

    // ❌ REMOVE restoring "started"
    // BUT keep minimized state
    useEffect(() => {
        const savedMini = localStorage.getItem("doxy-minimized");
        if (savedMini === "true") setMinimized(true);
    }, []);

    // Persist minimize only
    useEffect(() => {
        localStorage.setItem("doxy-minimized", minimized ? "true" : "false");
    }, [minimized]);

    // Only Touch-to-Start event triggers FloatingDoxy
    useEffect(() => {
        const handler = () => setStarted(true);
        window.addEventListener("open-doxy", handler);
        return () => window.removeEventListener("open-doxy", handler);
    }, []);

    // Auto reset after timeout
    useEffect(() => {
        if (!started) return;
        const timer = setTimeout(() => {
            localStorage.removeItem("doxy-minimized");
            window.location.reload();
        }, autoResetMinutes * 60 * 1000);
        return () => clearTimeout(timer);
    }, [started, autoResetMinutes]);

    // ⛔ If not started → render nothing
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

            {/* Attention Banner */}
            {!minimized && (
                <div className="flex items-center justify-center z-50">
                    <div className="bg-yellow-300 text-black text-center py-6 px-8">
                        <p className="text-3xl text-black font-bold">
                        NOTE:
                        </p>
                        <p className="text-2xl text-black font-bold">Check in with your name to connect to a Live Agent and consent to a live video call for assistance.</p>
                    </div>
                </div>
            )}

            {/* DOXY iframe */}
            <iframe
                src={doxyUrl}
                className="w-full h-full border-none"
                allow="camera; microphone; fullscreen; display-capture"
                onLoad={() => setIsLoaded(true)}
            ></iframe>

            {!minimized && (
                <button
                    className="absolute bottom-0 w-full py-6 text-5xl font-bold bg-green-600 text-white hover:bg-green-700 active:bg-green-800 transition px-6 py-10"
                    onClick={() => {
                        setMinimized(true);
                        router.push("/choose-service");
                    }}
                >
                    CLICK TO CONTINUE
                </button>
            )}

            <button
                className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                onClick={() => {
                    setStarted(false);
                    setMinimized(false);
                    localStorage.removeItem("doxy-minimized");
                }}
            >
                ✕
            </button>
        </div>
    );
}
