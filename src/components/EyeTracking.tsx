'use client';

import { useState, useEffect, useRef } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { EyeTrackingEngine } from '@/lib/eye-tracking';

interface EyeTrackingProps {
    onGazeDetected?: (direction: 'up' | 'down' | 'left' | 'right' | 'center') => void;
    enabled?: boolean;
    showUI?: boolean;
}

export default function EyeTracking({ onGazeDetected, enabled = false, showUI = true }: EyeTrackingProps) {
    const { isFeatureEnabled } = useAIFeatures();
    const eyeTrackingEnabled = enabled || isFeatureEnabled('eyeTracking');
    const autoScrollEnabled = isFeatureEnabled('autoScroll');
    
    const [isActive, setIsActive] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gazeDirection, setGazeDirection] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const eyeTrackingEngineRef = useRef<EyeTrackingEngine | null>(null);
    const lastScrollTime = useRef<number>(0);
    const scrollCooldown = 1000; // 1 second between scrolls

    useEffect(() => {
        // Check if getUserMedia is supported
        if (typeof window !== 'undefined') {
            const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            setIsSupported(hasGetUserMedia);
        }
    }, []);

    useEffect(() => {
        if (!eyeTrackingEnabled || !isSupported || !isActive) {
            stopTracking();
            return;
        }

        if (isActive) {
            startTracking();
        }

        return () => {
            stopTracking();
        };
    }, [eyeTrackingEnabled, isActive, isSupported]);

    const startTracking = async () => {
        try {
            if (!videoRef.current) {
                setError('Video element not available');
                return;
            }

            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            // Initialize MediaPipe Eye Tracking Engine
            const engine = new EyeTrackingEngine();
            eyeTrackingEngineRef.current = engine;

            await engine.initialize(videoRef.current, (gaze) => {
                // Handle gaze detection
                setGazeDirection(gaze.direction);
                onGazeDetected?.(gaze.direction);

                // Auto-scroll if enabled and confidence is high
                if (autoScrollEnabled && gaze.confidence > 0.5) {
                    const now = Date.now();
                    if (now - lastScrollTime.current > scrollCooldown) {
                        if (gaze.direction === 'down') {
                            window.scrollBy({ top: window.innerHeight * 0.3, behavior: 'smooth' });
                            lastScrollTime.current = now;
                        } else if (gaze.direction === 'up') {
                            window.scrollBy({ top: -window.innerHeight * 0.3, behavior: 'smooth' });
                            lastScrollTime.current = now;
                        }
                    }
                }
            });

            setError(null);
        } catch (err: any) {
            console.error('Failed to start eye tracking:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Camera permission denied. Please enable camera access.');
            } else {
                setError(`Failed to start eye tracking: ${err.message}`);
            }
            setIsActive(false);
        }
    };

    const stopTracking = () => {
        // Stop eye tracking engine
        if (eyeTrackingEngineRef.current) {
            eyeTrackingEngineRef.current.stop();
            eyeTrackingEngineRef.current = null;
        }

        // Stop camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setGazeDirection(null);
    };

    // Gaze detection is now handled by EyeTrackingEngine

    const toggleTracking = () => {
        if (!isSupported) {
            setError('Eye tracking not supported in this browser');
            return;
        }

        setIsActive(!isActive);
        setError(null);
    };

    if (!showUI) {
        return null;
    }

    if (!isSupported) {
        return (
            <div className="text-xs text-gray-400 p-2">
                Eye tracking not supported in this browser
            </div>
        );
    }

    return (
        <div className="fixed bottom-32 right-4 z-50">
            <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border border-slate-700 shadow-xl p-4 max-w-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">Eye Tracking</h3>
                    <button
                        onClick={toggleTracking}
                        disabled={!eyeTrackingEnabled}
                        className={`p-2 rounded-full transition-all ${
                            isActive
                                ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
                                : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                        } ${!eyeTrackingEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isActive ? 'Stop tracking' : 'Start tracking'}
                    >
                        {isActive ? <FaEye /> : <FaEyeSlash />}
                    </button>
                </div>

                {error && (
                    <div className="text-xs text-red-400 mb-2 p-2 bg-red-900/20 rounded">
                        {error}
                    </div>
                )}

                {isActive && (
                    <div className="mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Tracking gaze...</span>
                        </div>
                        {gazeDirection && (
                            <div className="text-xs text-blue-400 mt-1">
                                Direction: {gazeDirection}
                            </div>
                        )}
                        {autoScrollEnabled && (
                            <div className="text-xs text-yellow-400 mt-1">
                                Auto-scroll enabled
                            </div>
                        )}
                    </div>
                )}

                {/* Hidden video and canvas for processing */}
                <video
                    ref={videoRef}
                    className="hidden"
                    autoPlay
                    playsInline
                    muted
                />
                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    );
}

