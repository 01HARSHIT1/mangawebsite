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
    const isManualScrolling = useRef<boolean>(false);
    const manualScrollTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Check if getUserMedia is supported
        if (typeof window !== 'undefined') {
            const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            console.log('👁️ Eye Tracking: Browser support check', {
                hasGetUserMedia,
                hasMediaDevices: !!navigator.mediaDevices,
                userAgent: navigator.userAgent.substring(0, 50)
            });
            setIsSupported(hasGetUserMedia);
            
            // Detect manual scrolling to prevent interference
            const handleScroll = () => {
                isManualScrolling.current = true;
                if (manualScrollTimeout.current) {
                    clearTimeout(manualScrollTimeout.current);
                }
                // Disable eye tracking scrolling for 3 seconds after manual scroll
                manualScrollTimeout.current = setTimeout(() => {
                    isManualScrolling.current = false;
                    console.log('👁️ Eye Tracking: Manual scroll ended, re-enabling auto-scroll');
                }, 3000);
            };
            
            window.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('wheel', handleScroll, { passive: true });
            
            return () => {
                window.removeEventListener('scroll', handleScroll);
                window.removeEventListener('wheel', handleScroll);
                if (manualScrollTimeout.current) clearTimeout(manualScrollTimeout.current);
            };
        }
    }, []);

    useEffect(() => {
        console.log('👁️ Eye Tracking: useEffect triggered', {
            eyeTrackingEnabled,
            isSupported,
            isActive,
            shouldStart: eyeTrackingEnabled && isSupported && isActive
        });
        
        // Only start tracking if all conditions are met
        if (!eyeTrackingEnabled || !isSupported || !isActive) {
            console.log('👁️ Eye Tracking: Conditions not met, stopping tracking');
            stopTracking();
            return;
        }

        // Start tracking when active
        if (isActive && eyeTrackingEnabled && isSupported) {
            console.log('👁️ Eye Tracking: ✅ All conditions met, starting tracking!');
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
            console.log('👁️ Eye Tracking: Creating EyeTrackingEngine instance...');
            const engine = new EyeTrackingEngine();
            eyeTrackingEngineRef.current = engine;

            console.log('👁️ Eye Tracking: Initializing engine with video element...');
            await engine.initialize(videoRef.current, (gaze) => {
                console.log('👁️ Eye Tracking: Gaze callback triggered', {
                    direction: gaze.direction,
                    confidence: gaze.confidence.toFixed(2),
                    hasEyePosition: !!gaze.eyePosition
                });
                // Handle gaze detection
                setGazeDirection(gaze.direction);
                onGazeDetected?.(gaze.direction);

                // Enhanced auto-scroll based on viewport zones
                // Skip if user is manually scrolling
                if (isManualScrolling.current) {
                    return; // Don't interfere with manual scrolling
                }
                
                // Use new zone-based scrolling system
                if (autoScrollEnabled && gaze.viewportZone && gaze.scrollIntensity !== undefined) {
                    const now = Date.now();
                    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                    
                    // Continuous smooth scrolling based on intensity
                    // Scroll speed is proportional to how far from center they're looking
                    const baseScrollSpeed = 0.5; // pixels per frame
                    const maxScrollSpeed = 3.0; // maximum pixels per frame
                    const scrollSpeed = baseScrollSpeed + (Math.abs(gaze.scrollIntensity) * (maxScrollSpeed - baseScrollSpeed));
                    
                    // Only scroll if we have significant intensity and not at boundaries
                    if (Math.abs(gaze.scrollIntensity) > 0.1) {
                        if (gaze.viewportZone === 'bottom' && currentScroll < maxScroll - 50) {
                            // Looking at bottom → scroll down
                            const scrollAmount = scrollSpeed * gaze.scrollIntensity; // positive
                            requestAnimationFrame(() => {
                                window.scrollBy({ 
                                    top: scrollAmount, 
                                    behavior: 'auto' // Use 'auto' for smooth continuous scrolling
                                });
                            });
                            
                            // Log occasionally to avoid spam
                            if (Math.random() < 0.1) { // 10% of frames
                                console.log('👁️ Eye tracking: Scrolling DOWN', {
                                    zone: gaze.viewportZone,
                                    intensity: gaze.scrollIntensity.toFixed(2),
                                    screenY: gaze.screenPosition?.y.toFixed(2),
                                    scrollSpeed: scrollSpeed.toFixed(2),
                                    currentScroll: Math.round(currentScroll)
                                });
                            }
                        } else if (gaze.viewportZone === 'top' && currentScroll > 50) {
                            // Looking at top → scroll up
                            const scrollAmount = scrollSpeed * gaze.scrollIntensity; // negative
                            requestAnimationFrame(() => {
                                window.scrollBy({ 
                                    top: scrollAmount, 
                                    behavior: 'auto' // Use 'auto' for smooth continuous scrolling
                                });
                            });
                            
                            // Log occasionally to avoid spam
                            if (Math.random() < 0.1) { // 10% of frames
                                console.log('👁️ Eye tracking: Scrolling UP', {
                                    zone: gaze.viewportZone,
                                    intensity: gaze.scrollIntensity.toFixed(2),
                                    screenY: gaze.screenPosition?.y.toFixed(2),
                                    scrollSpeed: scrollSpeed.toFixed(2),
                                    currentScroll: Math.round(currentScroll)
                                });
                            }
                        } else if (gaze.viewportZone === 'middle') {
                            // Middle zone → no scrolling (dead zone)
                            // This gives user a comfortable reading zone
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
        console.log('👁️ Eye Tracking: Toggle button clicked', {
            isSupported,
            isActive,
            eyeTrackingEnabled,
            willBecomeActive: !isActive
        });
        
        if (!isSupported) {
            console.error('👁️ Eye Tracking: Not supported in this browser');
            setError('Eye tracking not supported in this browser');
            return;
        }

        if (!isActive) {
            // Starting tracking - request camera permission
            console.log('👁️ Eye Tracking: Requesting camera permission...');
            try {
                // Request permission first
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // Immediately stop it - we just wanted permission
                stream.getTracks().forEach(track => track.stop());
                console.log('✅ Camera permission granted - ready to start tracking');
            } catch (err: any) {
                console.error('👁️ Eye Tracking: Camera permission error', err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Camera permission denied. Please allow camera access in your browser settings.');
                    return;
                } else {
                    setError(`Failed to access camera: ${err.message}`);
                    return;
                }
            }
        } else {
            console.log('👁️ Eye Tracking: Stopping tracking...');
        }

        setIsActive(!isActive);
        setError(null);
        console.log('👁️ Eye Tracking: State updated', { isActive: !isActive });
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
                console.log('👁️ Eye Tracking - Chapter page check:', { 
                    path, 
                    isChapter, 
                    eyeTrackingEnabled,
                    showUI,
                    isSupported 
                });
            };
            checkChapterPage();
            // Check periodically in case of client-side navigation
            const interval = setInterval(checkChapterPage, 1000);
            // Also check on route changes
            const handleRouteChange = () => checkChapterPage();
            window.addEventListener('popstate', handleRouteChange);
            // Listen for Next.js route changes
            window.addEventListener('pushstate', handleRouteChange);
            return () => {
                clearInterval(interval);
                window.removeEventListener('popstate', handleRouteChange);
                window.removeEventListener('pushstate', handleRouteChange);
            };
        }
    }, [eyeTrackingEnabled, showUI, isSupported]);

    // Debug logging
    useEffect(() => {
        console.log('👁️ Eye Tracking Component State:', {
            isChapterPage,
            eyeTrackingEnabled,
            showUI,
            isSupported,
            isActive,
            shouldShow: (showUI && (eyeTrackingEnabled || isChapterPage))
        });
    }, [isChapterPage, eyeTrackingEnabled, showUI, isSupported, isActive]);

    // Always show UI on chapter pages, even if not enabled
    // This allows users to enable it from the chapter page itself
    if (!showUI) {
        console.log('👁️ Eye Tracking: Not showing - showUI is false');
        return null;
    }
    
    // Show UI on chapter pages, or if explicitly enabled
    // ALWAYS show if we're on a chapter page OR if eyeTrackingEnabled is true
    const shouldShow = isChapterPage || eyeTrackingEnabled;
    
    if (!shouldShow) {
        console.log('👁️ Eye Tracking: Not showing - not on chapter page and not enabled', {
            isChapterPage,
            eyeTrackingEnabled,
            pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A'
        });
        return null;
    }
    
    console.log('👁️ Eye Tracking: ✅✅✅ PANEL SHOULD BE VISIBLE NOW! ✅✅✅', {
        isChapterPage,
        eyeTrackingEnabled,
        isSupported,
        showUI,
        pathname: typeof window !== 'undefined' ? window.location.pathname : 'N/A',
        timestamp: new Date().toISOString()
    });

    if (!isSupported) {
        console.log('👁️ Eye Tracking: Browser not supported, but showing panel anyway');
        return (
            <div 
                className="fixed bottom-32 right-4 z-50" 
                style={{ zIndex: 9999 }}
                id="eye-tracking-panel-unsupported"
            >
                <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border-2 border-yellow-500/50 shadow-xl p-4 max-w-sm">
                    <div className="text-xs text-yellow-400 font-semibold">
                        ⚠️ Eye tracking not supported in this browser
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                        Please use Chrome, Edge, or another modern browser
                    </div>
                </div>
            </div>
        );
    }

    console.log('👁️ Eye Tracking: ✅ RENDERING UI PANEL NOW!', {
        isChapterPage,
        eyeTrackingEnabled,
        isSupported,
        isActive,
        position: 'bottom-32 right-4',
        zIndex: 9999,
        elementId: 'eye-tracking-panel'
    });
    
    return (
        <div 
            className="fixed bottom-32 right-4 z-50" 
            style={{ 
                zIndex: 9999,
                position: 'fixed',
                bottom: '8rem',
                right: '1rem'
            }}
            id="eye-tracking-panel"
        >
            <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border-2 border-green-500/50 shadow-xl p-4 max-w-sm">
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

