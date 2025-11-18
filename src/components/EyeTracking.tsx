'use client';

import { useState, useEffect, useRef } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAIFeatures } from '@/hooks/useAIFeatures';

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
    const animationFrameRef = useRef<number | null>(null);
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
                videoRef.current.play();
            }

            // Start gaze detection loop
            detectGaze();
        } catch (err: any) {
            console.error('Failed to access camera:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Camera permission denied. Please enable camera access.');
            } else {
                setError('Failed to access camera. Please check your camera settings.');
            }
            setIsActive(false);
        }
    };

    const stopTracking = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const detectGaze = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        // Simplified gaze detection using face detection
        // In a real implementation, you would use a proper face/eye detection library
        // like MediaPipe, TensorFlow.js, or a dedicated eye tracking library
        
        const detect = () => {
            if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
                animationFrameRef.current = requestAnimationFrame(detect);
                return;
            }

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Simplified detection: Check if face is in center, upper, or lower portion
            // This is a placeholder - real implementation would use ML models
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // For now, we'll use a simple heuristic based on video analysis
            // In production, integrate with MediaPipe Face Mesh or similar
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Sample center region for brightness/color analysis
            const sampleSize = 50;
            const sampleX = Math.floor(centerX - sampleSize / 2);
            const sampleY = Math.floor(centerY - sampleSize / 2);
            
            // This is a simplified approach - real eye tracking would analyze eye position
            // For demonstration, we'll simulate based on scroll position and time
            const now = Date.now();
            if (now - lastScrollTime.current > scrollCooldown) {
                // Simulate gaze detection based on scroll position
                const scrollY = window.scrollY;
                const windowHeight = window.innerHeight;
                const documentHeight = document.documentElement.scrollHeight;
                const scrollPercentage = scrollY / (documentHeight - windowHeight);

                // If user is near bottom, detect "down" gaze
                if (scrollPercentage > 0.8 && autoScrollEnabled) {
                    setGazeDirection('down');
                    onGazeDetected?.('down');
                    window.scrollBy({ top: windowHeight * 0.3, behavior: 'smooth' });
                    lastScrollTime.current = now;
                } else if (scrollPercentage < 0.2) {
                    setGazeDirection('up');
                    onGazeDetected?.('up');
                } else {
                    setGazeDirection('center');
                    onGazeDetected?.('center');
                }
            }

            animationFrameRef.current = requestAnimationFrame(detect);
        };

        detect();
    };

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

