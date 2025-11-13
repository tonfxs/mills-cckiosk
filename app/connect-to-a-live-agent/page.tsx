"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveAgentDoxy() {
  const [started, setStarted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const doxyUrl = "https://doxy.me/testmills";

  // Auto-reset kiosk after 10 minutes
  useEffect(() => {
    if (!started) return;
    const timer = setTimeout(() => window.location.reload(), 10 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [started]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {!started && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center p-6 h-screen bg-gradient-to-br from-blue-50 to-white"
          >
            <img
              src="/images/click_collect.svg"
              alt="Welcome Illustration"
              width={500}
              height={200}
            />
            <h2 className="text-6xl font-semibold mb-3 text-gray-800">
              Welcome to Mills Click & Collect
            </h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Please make sure your camera and microphone are on. Tap below to
              start your video consultation with our staff.
            </p>
            <button
              onClick={() => setStarted(true)}
              className="px-18 py-10 bg-blue-600 text-white text-4xl font-medium rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-transform"
            >
              Connect to a Live Agent
            </button>
          </motion.div>
        )}

        {/* Doxy Video Screen */}
        {started && (
          <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            <motion.div
              drag={minimized} // draggable only when minimized
              dragConstraints={containerRef} // constrained to container
              dragElastic={0.2}
              onDragEnd={(e, info) =>
                setLastPosition({ x: info.point.x, y: info.point.y })
              }
              style={{
                x: lastPosition.x,
                y: lastPosition.y,
                pointerEvents: minimized ? "auto" : "auto", // allow dragging
              }}
              className={`fixed transition-all duration-500 border border-gray-200 bg-white shadow-lg ${
                minimized
                  ? "w-160 h-160 z-50 rounded-xl overflow-hidden cursor-move"
                  : "w-full h-screen top-0 left-0 z-50 rounded-none cursor-default"
              }`}
            >
              {!isLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10">
                  <p className="text-xl mb-3 animate-pulse">
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
                className="w-full h-full border-none rounded-none"
                onLoad={() => setIsLoaded(true)}
              ></iframe>

              {/* Minimize/Maximize Button */}
              <button
                onClick={() => setMinimized(!minimized)}
                className="absolute top-2 right-2 bg-white/80 rounded-full p-2 shadow hover:bg-white transition z-50 text-gray-700 font-bold"
              >
                {minimized ? "⤢" : "—"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
