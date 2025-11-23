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
        // Only start tracking if all conditions are met
        if (!eyeTrackingEnabled || !isSupported || !isActive) {
            stopTracking();
            return;
        }

        // Start tracking when active
        if (isActive && eyeTrackingEnabled && isSupported) {
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

            console.log('🎥 Requesting camera access...');
            
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            streamRef.current = stream;
            console.log('✅ Camera access granted');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                console.log('✅ Video stream started');
            }

            // Initialize MediaPipe Eye Tracking Engine
            const engine = new EyeTrackingEngine();
            eyeTrackingEngineRef.current = engine;

            await engine.initialize(videoRef.current, (gaze) => {
                // Handle gaze detection
                setGazeDirection(gaze.direction);
                onGazeDetected?.(gaze.direction);

                // Enhanced auto-scroll for manga reading
                // Lower confidence threshold and more responsive scrolling
                if (autoScrollEnabled && gaze.confidence > 0.2) { // Lowered from 0.4 to 0.2
                    const now = Date.now();
                    const dynamicCooldown = Math.max(300, scrollCooldown - (gaze.confidence * 700)); // Faster response
                    
                    if (now - lastScrollTime.current > dynamicCooldown) {
                        // Calculate scroll amount - more noticeable for manga reading
                        const scrollMultiplier = 0.3 + (gaze.confidence * 0.5); // 0.3 to 0.8 of viewport
                        const scrollAmount = window.innerHeight * scrollMultiplier;
                        
                        if (gaze.direction === 'down') {
                            // Scroll down for manga reading (next content)
                            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                            
                            // Only scroll if not at bottom
                            if (currentScroll < maxScroll - 50) {
                                window.scrollBy({ 
                                    top: scrollAmount, 
                                    behavior: 'smooth' 
                                });
                                lastScrollTime.current = now;
                                console.log('👁️ Eye tracking: Scrolling down', { 
                                    direction: gaze.direction, 
                                    confidence: gaze.confidence.toFixed(2),
                                    scrollAmount: Math.round(scrollAmount)
                                });
                            }
                        } else if (gaze.direction === 'up') {
                            // Scroll up (previous content)
                            const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                            
                            // Only scroll if not at top
                            if (currentScroll > 50) {
                                window.scrollBy({ 
                                    top: -scrollAmount, 
                                    behavior: 'smooth' 
                                });
                                lastScrollTime.current = now;
                                console.log('👁️ Eye tracking: Scrolling up', { 
                                    direction: gaze.direction, 
                                    confidence: gaze.confidence.toFixed(2),
                                    scrollAmount: Math.round(scrollAmount)
                                });
                            }
                        }
                    }
                }
            });
            
            console.log('✅ Eye tracking engine initialized successfully');

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

    const toggleTracking = async () => {
        if (!isSupported) {
            setError('Eye tracking not supported in this browser');
            return;
        }

        if (!isActive) {
            // Starting tracking - request camera permission
            try {
                // Request permission first
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // Immediately stop it - we just wanted permission
                stream.getTracks().forEach(track => track.stop());
                console.log('✅ Camera permission granted');
            } catch (err: any) {
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Camera permission denied. Please allow camera access in your browser settings.');
                    return;
                } else {
                    setError(`Failed to access camera: ${err.message}`);
                    return;
                }
            }
        }

        setIsActive(!isActive);
        setError(null);
    };

    // Only show UI and work on chapter reading pages
    // Check if we're on a chapter page by checking the URL
    const [isChapterPage, setIsChapterPage] = useState(false);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const checkChapterPage = () => {
                const path = window.location.pathname;
                const isChapter = path.includes('/chapter/');
                setIsChapterPage(isChapter);
                console.log('📍 Chapter page check:', { path, isChapter });
            };
            checkChapterPage();
            // Check periodically in case of client-side navigation
            const interval = setInterval(checkChapterPage, 1000);
            // Also check on route changes
            window.addEventListener('popstate', checkChapterPage);
            return () => {
                clearInterval(interval);
                window.removeEventListener('popstate', checkChapterPage);
            };
        }
    }, []);

    // Always show UI on chapter pages, even if not enabled
    // This allows users to enable it from the chapter page itself
    if (!showUI) {
        return null;
    }
    
    // Show UI on chapter pages, or if explicitly enabled
    // For now, always show if eyeTrackingEnabled is true (from toggle)
    if (!eyeTrackingEnabled && !isChapterPage) {
        return null;
    }

    if (!isSupported) {
        return (
            <div className="fixed bottom-32 right-4 z-50">
                <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border border-slate-700 shadow-xl p-4 max-w-sm">
                    <div className="text-xs text-gray-400">
                        Eye tracking not supported in this browser
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-32 right-4 z-50">
            <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border border-slate-700 shadow-xl p-4 max-w-sm">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-white font-semibold text-sm">Eye Tracking</h3>
                        {!eyeTrackingEnabled && (
                            <p className="text-xs text-gray-400 mt-0.5">Enable in top-right toggle</p>
                        )}
                    </div>
                    <button
                        onClick={toggleTracking}
                        disabled={!eyeTrackingEnabled || !isSupported}
                        className={`p-2 rounded-full transition-all ${
                            isActive
                                ? 'bg-green-600 hover:bg-green-700 text-white animate-pulse'
                                : eyeTrackingEnabled
                                ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                                : 'bg-slate-800 text-gray-500'
                        } ${(!eyeTrackingEnabled || !isSupported) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={
                            !eyeTrackingEnabled 
                                ? 'Enable eye tracking from top-right toggle first'
                                : !isSupported
                                ? 'Not supported in this browser'
                                : isActive 
                                ? 'Stop tracking' 
                                : 'Start tracking (will request camera permission)'
                        }
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
                    <div className="mb-2 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Tracking gaze...</span>
                        </div>
                        {gazeDirection && (
                            <div className="text-xs text-blue-400">
                                Direction: <span className="font-bold">{gazeDirection}</span>
                            </div>
                        )}
                        {autoScrollEnabled && (
                            <div className="text-xs text-yellow-400">
                                ✓ Auto-scroll enabled
                            </div>
                        )}
                        {!autoScrollEnabled && (
                            <div className="text-xs text-orange-400">
                                ⚠ Enable auto-scroll in settings
                            </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2 p-2 bg-slate-900/50 rounded">
                            💡 Look down to scroll, look up to scroll back
                        </div>
                    </div>
                )}

                {/* Instructions when not active */}
                {!isActive && eyeTrackingEnabled && (
                    <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs text-gray-400 border border-slate-700">
                        <p className="font-semibold text-yellow-400 mb-1">📖 How to use:</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-xs">
                            <li>Click the eye icon above to start</li>
                            <li>Allow camera access when prompted</li>
                            <li>Look down → page scrolls down</li>
                            <li>Look up → page scrolls up</li>
                        </ol>
                    </div>
                )}
                
                {/* Message when not enabled */}
                {!eyeTrackingEnabled && (
                    <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs text-orange-400 border border-orange-700/50">
                        <p className="font-semibold mb-1">⚠️ Not Enabled</p>
                        <p className="text-xs">Enable "Eye Tracking" from the toggle button in the top-right corner of the homepage.</p>
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

