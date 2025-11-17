"use client";
import { useState, useEffect, useRef } from "react";

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

    // Position and size state
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [size, setSize] = useState({ width: 800, height: 600 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState("");

    const containerRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

    // Listen for global trigger event
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

    // Center window on first open
    useEffect(() => {
        if (started && position.x === 0 && position.y === 0) {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            setPosition({
                x: (windowWidth - size.width) / 2,
                y: (windowHeight - size.height) / 2,
            });
        }
    }, [started]);

    // Dragging handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.no-drag')) return;
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y,
            });
        }

        if (isResizing) {
            const deltaX = e.clientX - resizeStartRef.current.x;
            const deltaY = e.clientY - resizeStartRef.current.y;

            let newWidth = resizeStartRef.current.width;
            let newHeight = resizeStartRef.current.height;
            let newX = position.x;
            let newY = position.y;

            if (resizeDirection.includes('e')) {
                newWidth = Math.max(300, resizeStartRef.current.width + deltaX);
            }
            if (resizeDirection.includes('s')) {
                newHeight = Math.max(200, resizeStartRef.current.height + deltaY);
            }
            if (resizeDirection.includes('w')) {
                const potentialWidth = resizeStartRef.current.width - deltaX;
                if (potentialWidth >= 300) {
                    newWidth = potentialWidth;
                    newX = position.x + deltaX;
                }
            }
            if (resizeDirection.includes('n')) {
                const potentialHeight = resizeStartRef.current.height - deltaY;
                if (potentialHeight >= 200) {
                    newHeight = potentialHeight;
                    newY = position.y + deltaY;
                }
            }

            setSize({ width: newWidth, height: newHeight });
            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection("");
    };

    useEffect(() => {
        if (isDragging || isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, isResizing, position, size]);

    // Resize handlers
    const startResize = (direction: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(direction);
        resizeStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
        };
    };

    if (!started) return null;

    const displayWidth = minimized ? 240 : size.width;
    const displayHeight = minimized ? 180 : size.height;

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-[9999]"
        >
            <div
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                }}
                className="absolute bg-white shadow-2xl border border-gray-300 rounded-xl overflow-hidden pointer-events-auto transition-all duration-300"
            >
                {/* Header Bar */}
                <div
                    onMouseDown={handleMouseDown}
                    className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-between px-3 cursor-move z-50"
                >
                    <span className="text-white font-semibold text-sm">
                        Video Consultation
                    </span>
                    <div className="flex gap-2 no-drag">
                        <button
                            onClick={() => setMinimized(!minimized)}
                            className="bg-yellow-500 hover:bg-yellow-600 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold shadow transition"
                        >
                            {minimized ? "□" : "−"}
                        </button>
                        <button
                            onClick={() => setStarted(false)}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow transition"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Loading State */}
                {!isLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white z-10 mt-10">
                        <p className="text-xl mb-2 animate-pulse">
                            Connecting to your provider...
                        </p>
                        <p className="text-sm text-gray-400">
                            Please allow camera and microphone access.
                        </p>
                    </div>
                )}

                {/* Iframe */}
                <div className="w-full h-full pt-10 no-drag">
                    <iframe
                        src={doxyUrl}
                        title="Doxy Video Call"
                        allow="camera; microphone; fullscreen; display-capture"
                        className="w-full h-full border-none"
                        onLoad={() => setIsLoaded(true)}
                    ></iframe>
                </div>

                {/* Resize Handles */}
                {!minimized && (
                    <>
                        {/* Corners */}
                        <div
                            onMouseDown={startResize('nw')}
                            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
                        />
                        <div
                            onMouseDown={startResize('ne')}
                            className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
                        />
                        <div
                            onMouseDown={startResize('sw')}
                            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
                        />
                        <div
                            onMouseDown={startResize('se')}
                            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                        />

                        {/* Edges */}
                        <div
                            onMouseDown={startResize('n')}
                            className="absolute top-0 left-4 right-4 h-2 cursor-n-resize"
                        />
                        <div
                            onMouseDown={startResize('s')}
                            className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize"
                        />
                        <div
                            onMouseDown={startResize('w')}
                            className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize"
                        />
                        <div
                            onMouseDown={startResize('e')}
                            className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize"
                        />
                    </>
                )}
            </div>
        </div>
    );
}