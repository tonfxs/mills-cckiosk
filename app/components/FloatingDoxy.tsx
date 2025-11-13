"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingDoxyProps {
    doxyUrl?: string;
    autoResetMinutes?: number;
}

export default function FloatingDoxy({
    doxyUrl = "https://doxy.me/testmills",
    autoResetMinutes = 10,
}: FloatingDoxyProps) {
    const [started, setStarted] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // ✅ Listen for global trigger event
    useEffect(() => {
        const handleOpen = () => setStarted(true);
        window.addEventListener("open-doxy", handleOpen);
        return () => window.removeEventListener("open-doxy", handleOpen);
    }, []);

    // Auto-reset after timeout
    useEffect(() => {
        if (!started) return;
        const timer = setTimeout(
            () => window.location.reload(),
            autoResetMinutes * 60 * 1000
        );
        return () => clearTimeout(timer);
    }, [started, autoResetMinutes]);

    return (
        <div ref={containerRef} className="fixed bottom-6 right-6 z-[9999]">
            <AnimatePresence mode="wait">
                {started && (
                    <motion.div
                        key="doxy-window"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            drag={minimized}
                            dragConstraints={containerRef}
                            dragElastic={0.2}
                            onDragEnd={(e, info) =>
                                setLastPosition({ x: info.point.x, y: info.point.y })
                            }
                            style={{
                                x: lastPosition.x,
                                y: lastPosition.y,
                            }}
                            className={`fixed bottom-6 right-6 transition-all duration-500 bg-white shadow-xl border border-gray-200 
                                ${minimized
                                    ? "w-60 h-70 rounded-xl overflow-hidden cursor-move"
                                    : "w-[80vw] md:w-[50vw] h-[40vh] rounded-2xl overflow-hidden"
                                }`}
                        >
                            {!isLoaded && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10">
                                    <p className="text-xl mb-2 animate-pulse">
                                        Connecting to your provider...
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Please allow camera and microphone access.
                                    </p>
                                </div>
                            )}

                            <iframe
                                src={doxyUrl}
                                title="Doxy Video Call"
                                allow="camera; microphone; fullscreen; display-capture"
                                className="w-full h-full border-none"
                                onLoad={() => setIsLoaded(true)}
                            ></iframe>

                            <div className="absolute top-2 right-2 flex gap-2 z-50">
                                <button
                                    onClick={() => setMinimized(!minimized)}
                                    className="bg-white/80 hover:bg-white rounded-full p-2 shadow text-gray-700 font-bold"
                                >
                                    {minimized ? "⤢" : "—"}
                                </button>
                                <button
                                    onClick={() => setStarted(false)}
                                    className="bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow font-bold"
                                >
                                    ✕
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
