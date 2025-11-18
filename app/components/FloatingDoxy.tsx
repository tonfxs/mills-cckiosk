"use client";
import { useState, useEffect } from "react";

interface FloatingDoxyProps {
    doxyUrl?: string;
    autoResetMinutes?: number;
}

export default function FloatingDoxy({
    doxyUrl = process.env.NEXT_PUBLIC_DOXY_URL,
    autoResetMinutes = 10,
}: FloatingDoxyProps) {
    const [started, setStarted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [minimized, setMinimized] = useState(false);

    //
    // 🔥 1. Restore state on mount so Doxy stays open across navigation
    //
    useEffect(() => {
        const saved = localStorage.getItem("doxy-started");
        if (saved === "true") setStarted(true);

        const savedMin = localStorage.getItem("doxy-minimized");
        if (savedMin === "true") setMinimized(true);
    }, []);

    //
    // 🔥 2. Persist state so it does NOT reset on re-render or page navigation
    //
    useEffect(() => {
        localStorage.setItem("doxy-started", started ? "true" : "false");
    }, [started]);

    useEffect(() => {
        localStorage.setItem("doxy-minimized", minimized ? "true" : "false");
    }, [minimized]);

    //
    // 🔥 3. Global event so any page can open Doxy
    //
    useEffect(() => {
        const handleOpen = () => setStarted(true);
        window.addEventListener("open-doxy", handleOpen);
        return () => window.removeEventListener("open-doxy", handleOpen);
    }, []);

    //
    // 🔥 4. Auto-reset (optional)
    //
    useEffect(() => {
        if (!started) return;
        const timer = setTimeout(() => {
            localStorage.removeItem("doxy-started");
            localStorage.removeItem("doxy-minimized");
            window.location.reload();
        }, autoResetMinutes * 60 * 1000);
        return () => clearTimeout(timer);
    }, [started, autoResetMinutes]);

    //
    // If not started, don't show the widget
    //
    if (!started) return null;

    const width = minimized ? 200 : 320;
    const height = minimized ? 150 : 260;

    return (
        <div
            className="fixed z-[9999] pointer-events-auto transition-all duration-300"
            style={{
                top: "10px",
                right: "10px",
                width: `${width}px`,
                height: `${height}px`,
            }}
        >
            <div className="relative w-full h-full bg-white shadow-xl border border-gray-300 rounded-xl overflow-hidden">

                {/* Header */}
                <div
                    className="absolute top-0 left-0 right-0 h-10 
                    bg-gradient-to-r from-blue-600 to-blue-700 
                    flex items-center justify-between px-3 
                    z-50"
                >
                    <span className="text-white font-semibold text-sm">
                        Video Call
                    </span>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setMinimized(!minimized)}
                            className="bg-yellow-500 hover:bg-yellow-600 
                            rounded-full w-6 h-6 flex items-center 
                            justify-center text-white text-xs font-bold"
                        >
                            {minimized ? "□" : "−"}
                        </button>

                        <button
                            onClick={() => {
                                setStarted(false);
                                localStorage.removeItem("doxy-started");
                                localStorage.removeItem("doxy-minimized");
                            }}
                            className="bg-red-500 hover:bg-red-600 
                            rounded-full w-6 h-6 flex items-center 
                            justify-center text-white text-xs font-bold"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Loading Overlay */}
                {!isLoaded && !minimized && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-40 mt-10">
                        <p className="text-lg mb-2 animate-pulse">Connecting…</p>
                        <p className="text-xs text-gray-300">Please allow camera & mic</p>
                    </div>
                )}

                {/* Iframe */}
                {!minimized && (
                    <div className="w-full h-full pt-10">
                        <iframe
                            src={doxyUrl}
                            title="Doxy Video Call"
                            allow="camera; microphone; fullscreen; display-capture"
                            className="w-full h-full border-none"
                            onLoad={() => setIsLoaded(true)}
                        ></iframe>
                    </div>
                )}
            </div>
        </div>
    );
}
