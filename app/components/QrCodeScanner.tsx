'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, CheckCircle, QrCode } from 'lucide-react';
import jsQR from 'jsqr';

export default function QRScanner() {
    const [isOpen, setIsOpen] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const startScanning = async () => {
        try {
            setError('');
            setResult('');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
                setScanning(true);

                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play();
                        scanIntervalRef.current = setInterval(scanQRCode, 300);
                    }
                };
            }
        } catch (err) {
            setError('Camera access denied or unavailable');
            console.error(err);
        }
    };

    const stopScanning = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        setScanning(false);
    };

    const closeModal = () => {
        stopScanning();
        setIsOpen(false);
        setResult('');
        setError('');
    };

    const scanQRCode = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data) {
            setResult(code.data);
            stopScanning();
        }
    };

    useEffect(() => {
        return () => {
            stopScanning();
        };
    }, []);

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-gradient-to-r from-[#0070C9] to-[#004E9A] text-white px-6 py-4 rounded-full shadow-2xl hover:scale-110 transition-all flex items-center gap-2 font-semibold text-lg z-40"
                type="button"
            >
                <QrCode size={24} />
                Have a QR?
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 relative">
                        {/* Close Button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
                            type="button"
                        >
                            <X size={24} />
                        </button>

                        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                            QR Code Scanner
                        </h1>

                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                {error}
                            </div>
                        )}

                        {result && (
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={20} />
                                    <div className="flex-1">
                                        <p className="font-semibold text-green-800 mb-1">Scanned Result:</p>
                                        <p className="text-gray-700 break-all">{result}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="relative bg-gray-900 rounded-xl overflow-hidden mb-4" style={{ aspectRatio: '4/3' }}>
                            {scanning ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        className="w-full h-full object-cover"
                                        playsInline
                                        muted
                                    />
                                    <canvas ref={canvasRef} className="hidden" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-64 h-64 border-4 border-white rounded-lg shadow-lg opacity-50"></div>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <Camera size={64} className="mx-auto mb-2 opacity-50" />
                                        <p>Camera inactive</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            {!scanning ? (
                                <button
                                    onClick={startScanning}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    type="button"
                                >
                                    <Camera size={20} />
                                    Start Scanning
                                </button>
                            ) : (
                                <button
                                    onClick={stopScanning}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    type="button"
                                >
                                    <X size={20} />
                                    Stop Scanning
                                </button>
                            )}
                        </div>

                        <p className="text-sm text-gray-500 mt-4 text-center">
                            Point your camera at a QR code to scan it
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}