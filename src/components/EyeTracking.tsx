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
    
    // Accuracy tracking metrics
    const [currentConfidence, setCurrentConfidence] = useState<number>(0);
    const [averageConfidence, setAverageConfidence] = useState<number>(0);
    const [detectionRate, setDetectionRate] = useState<number>(0);
    const [screenPosition, setScreenPosition] = useState<{ x: number; y: number } | null>(null);
    const [viewportZone, setViewportZone] = useState<string | null>(null);
    const [scrollIntensity, setScrollIntensity] = useState<number>(0);
    
    // Statistics tracking
    const detectionCountRef = useRef<number>(0);
    const totalFramesRef = useRef<number>(0);
    const confidenceHistoryRef = useRef<number[]>([]);
    const lastUpdateTimeRef = useRef<number>(Date.now());
    
    
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
            setIsSupported(hasGetUserMedia);
            console.log('👁️ Eye Tracking: Browser support check', {
                hasGetUserMedia,
                hasMediaDevices: !!navigator.mediaDevices,
                userAgent: navigator.userAgent.substring(0, 50),
                isSupported: hasGetUserMedia,
                status: hasGetUserMedia ? '✅ SUPPORTED' : '❌ NOT SUPPORTED'
            });
            
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
            const missingConditions = [];
            if (!eyeTrackingEnabled) missingConditions.push('eyeTrackingEnabled=false');
            if (!isSupported) missingConditions.push('isSupported=false');
            if (!isActive) missingConditions.push('isActive=false');
            console.log('👁️ Eye Tracking: Conditions not met, stopping tracking', {
                missing: missingConditions.join(', '),
                eyeTrackingEnabled,
                isSupported,
                isActive
            });
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
                // Store current normalized Y for calibration
                if (gaze.normalizedEyePosition) {
                }
                
                // Update accuracy metrics
                totalFramesRef.current += 1;
                if (gaze.confidence > 0.1) {
                    detectionCountRef.current += 1;
                    confidenceHistoryRef.current.push(gaze.confidence);
                    // Keep only last 100 readings for average
                    if (confidenceHistoryRef.current.length > 100) {
                        confidenceHistoryRef.current.shift();
                    }
                }
                
                // Calculate detection rate (last 1 second)
                const now = Date.now();
                if (now - lastUpdateTimeRef.current > 1000) {
                    const rate = (detectionCountRef.current / totalFramesRef.current) * 100;
                    setDetectionRate(rate);
                    
                    // Calculate average confidence
                    if (confidenceHistoryRef.current.length > 0) {
                        const avg = confidenceHistoryRef.current.reduce((a, b) => a + b, 0) / confidenceHistoryRef.current.length;
                        setAverageConfidence(avg);
                    }
                    
                    // Reset counters
                    detectionCountRef.current = 0;
                    totalFramesRef.current = 0;
                    lastUpdateTimeRef.current = now;
                }
                
                // Update real-time metrics
                setCurrentConfidence(gaze.confidence);
                setScreenPosition(gaze.screenPosition || null);
                setViewportZone(gaze.viewportZone || null);
                setScrollIntensity(gaze.scrollIntensity || 0);
                
                console.log('👁️ Eye Tracking: Gaze callback triggered', {
                    direction: gaze.direction,
                    confidence: gaze.confidence.toFixed(2),
                    hasEyePosition: !!gaze.eyePosition,
                    screenPosition: gaze.screenPosition,
                    viewportZone: gaze.viewportZone,
                    scrollIntensity: gaze.scrollIntensity?.toFixed(2)
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
                    
                    // MAXIMUM PRECISION: Optimized scroll speed calculation
                    // Adaptive speed based on intensity and confidence
                    const baseScrollSpeed = 0.8; // Base speed for smoothness
                    const maxScrollSpeed = 4.5; // Maximum speed for responsiveness
                    const intensityFactor = Math.abs(gaze.scrollIntensity);
                    const confidenceFactor = Math.max(0.7, gaze.confidence); // Use confidence to adjust speed
                    
                    // Smooth acceleration curve (ease-in-out)
                    const easedIntensity = intensityFactor < 0.5 
                        ? 2 * intensityFactor * intensityFactor 
                        : 1 - Math.pow(-2 * intensityFactor + 2, 2) / 2;
                    
                    const scrollSpeed = baseScrollSpeed + (easedIntensity * (maxScrollSpeed - baseScrollSpeed) * confidenceFactor);
                    
                    // MAXIMUM PRECISION: Higher threshold with confidence requirement
                    // Only scroll if intensity is significant AND confidence is high
                    const minIntensity = 0.20; // Lowered threshold for better responsiveness (was 0.25)
                    const minConfidence = 0.55; // Lowered threshold for better responsiveness (was 0.6)
                    
                    // INVERTED SCROLL LOGIC: User wants looking up to scroll down, looking down to scroll up
                    // This matches natural reading behavior: look at top → want to see content below → scroll down
                    if (Math.abs(gaze.scrollIntensity) > minIntensity && gaze.confidence >= minConfidence) {
                        if (gaze.viewportZone === 'top' && currentScroll < maxScroll - 50) {
                            // Looking at TOP → scroll DOWN (to see content below)
                            // scrollIntensity is negative for top zone, but we want to scroll DOWN (positive)
                            const scrollAmount = Math.abs(scrollSpeed * gaze.scrollIntensity); // Make positive for down
                            requestAnimationFrame(() => {
                                window.scrollBy({ 
                                    top: scrollAmount, // Positive to scroll DOWN
                                    behavior: 'auto'
                                });
                            });
                            
                            // Log occasionally to avoid spam
                            if (Math.random() < 0.05) { // 5% of frames
                                console.log('👁️ Eye tracking: Looking UP → Scrolling DOWN', {
                                    zone: gaze.viewportZone,
                                    intensity: gaze.scrollIntensity.toFixed(2),
                                    scrollAmount: scrollAmount.toFixed(2),
                                    screenY: gaze.screenPosition?.y.toFixed(2),
                                    currentScroll: Math.round(currentScroll),
                                    maxScroll: Math.round(maxScroll)
                                });
                            }
                        } else if (gaze.viewportZone === 'bottom' && currentScroll > 50) {
                            // Looking at BOTTOM → scroll UP (to see content above)
                            // scrollIntensity is positive for bottom zone, but we want to scroll UP (negative)
                            const scrollAmount = Math.abs(scrollSpeed * gaze.scrollIntensity); // Make positive
                            requestAnimationFrame(() => {
                                window.scrollBy({ 
                                    top: -scrollAmount, // Negative to scroll UP
                                    behavior: 'auto'
                                });
                            });
                            
                            // Log occasionally to avoid spam
                            if (Math.random() < 0.05) { // 5% of frames
                                console.log('👁️ Eye tracking: Looking DOWN → Scrolling UP', {
                                    zone: gaze.viewportZone,
                                    intensity: gaze.scrollIntensity.toFixed(2),
                                    scrollAmount: scrollAmount.toFixed(2),
                                    screenY: gaze.screenPosition?.y.toFixed(2),
                                    currentScroll: Math.round(currentScroll)
                                });
                            }
                        } else if (gaze.viewportZone === 'middle') {
                            // Middle zone → no scrolling (dead zone)
                            // This gives user a comfortable reading zone
                        }
                    } else {
                        // Log why scrolling didn't happen (occasionally)
                        if (Math.random() < 0.02) { // 2% of frames
                            console.log('👁️ Eye tracking: Scroll conditions not met', {
                                zone: gaze.viewportZone,
                                intensity: Math.abs(gaze.scrollIntensity).toFixed(2),
                                minIntensity,
                                confidence: gaze.confidence.toFixed(2),
                                minConfidence,
                                meetsIntensity: Math.abs(gaze.scrollIntensity) > minIntensity,
                                meetsConfidence: gaze.confidence >= minConfidence
                            });
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
    
    const startCalibration = () => {
        if (!isActive) {
            setError('Please start eye tracking first');
            return;
        }
        setIsCalibrating(true);
        setCalibrationStep('scrollUp');
        setCalibrationSamples({ scrollUp: 0, scrollDown: 0, noScroll: 0 });
        console.log('👁️ Eye Tracking: Starting calibration - Step 1: Look at TOP of screen and click "Scroll Up"');
    };
    
    const addCalibrationSample = (action: 'scrollUp' | 'scrollDown' | 'noScroll') => {
        if (!eyeTrackingEngineRef.current || currentNormalizedYRef.current === null) {
            setError('Eye tracking not ready. Please wait a moment.');
            return;
        }
        
        const normalizedY = currentNormalizedYRef.current;
        eyeTrackingEngineRef.current.addCalibrationSample(action, normalizedY);
        
        // Update sample count
        setCalibrationSamples(prev => ({
            ...prev,
            [action]: prev[action] + 1
        }));
        
        console.log(`👁️ Eye Tracking: Added ${action} sample`, { normalizedY, samples: calibrationSamples[action] + 1 });
        
        // Move to next step
        if (action === 'scrollUp' && calibrationSamples.scrollUp < 4) {
            // Continue collecting scrollUp samples
        } else if (action === 'scrollUp' && calibrationSamples.scrollUp >= 4) {
            setCalibrationStep('scrollDown');
            console.log('👁️ Eye Tracking: Step 2: Look at BOTTOM of screen and click "Scroll Down"');
        } else if (action === 'scrollDown' && calibrationSamples.scrollDown < 4) {
            // Continue collecting scrollDown samples
        } else if (action === 'scrollDown' && calibrationSamples.scrollDown >= 4) {
            setCalibrationStep('noScroll');
            console.log('👁️ Eye Tracking: Step 3: Look at MIDDLE of screen and click "Don\'t Scroll"');
        } else if (action === 'noScroll' && calibrationSamples.noScroll < 4) {
            // Continue collecting noScroll samples
        } else if (action === 'noScroll' && calibrationSamples.noScroll >= 4) {
            setCalibrationStep('complete');
            setIsCalibrating(false);
            
            // Collect all samples and set as master calibration for all users
            if (eyeTrackingEngineRef.current) {
                const calibration = eyeTrackingEngineRef.current.getCalibration();
                if (calibration && calibration.calibrated && 
                    calibration.scrollUp.samples.length >= 5 &&
                    calibration.scrollDown.samples.length >= 5 &&
                    calibration.noScroll.samples.length >= 5) {
                    // Set master calibration from collected samples
                    import('@/lib/eye-tracking').then(({ EyeTrackingEngine }) => {
                        EyeTrackingEngine.setMasterCalibration({
                            scrollUp: calibration.scrollUp.samples,
                            scrollDown: calibration.scrollDown.samples,
                            noScroll: calibration.noScroll.samples
                        });
                        
                        // Automatically generate hardcoded code
                        const generateHardcodedCode = () => {
                            const { scrollUp, scrollDown, noScroll } = calibration;
                            
                            const code = `// MASTER CALIBRATION - Hardcoded from final calibration samples
// This is the permanent default for all users
// Generated automatically: ${new Date().toISOString()}
let DEFAULT_MASTER_CALIBRATION: CalibrationData = {
    scrollUp: {
        normalizedY: ${scrollUp.mean},
        samples: [${scrollUp.samples.join(', ')}],
        mean: ${scrollUp.mean},
        stdDev: ${scrollUp.stdDev},
        min: ${scrollUp.min},
        max: ${scrollUp.max}
    },
    scrollDown: {
        normalizedY: ${scrollDown.mean},
        samples: [${scrollDown.samples.join(', ')}],
        mean: ${scrollDown.mean},
        stdDev: ${scrollDown.stdDev},
        min: ${scrollDown.min},
        max: ${scrollDown.max}
    },
    noScroll: {
        normalizedY: ${noScroll.mean},
        samples: [${noScroll.samples.join(', ')}],
        mean: ${noScroll.mean},
        stdDev: ${noScroll.stdDev},
        min: ${noScroll.min},
        max: ${noScroll.max}
    },
    calibrated: true
};`;
                            
                            console.log('👁️ Eye Tracking: ✅ Master calibration set for ALL users!');
                            console.log('👁️ Eye Tracking: 📋 HARDCODED CODE (will be automatically applied):');
                            console.log('='.repeat(100));
                            console.log(code);
                            console.log('='.repeat(100));
                            
                            // Store in a global variable for automatic extraction
                            (window as any).__MASTER_CALIBRATION_CODE__ = code;
                            (window as any).__MASTER_CALIBRATION_DATA__ = calibration;
                            
                            // Also store in localStorage for automatic retrieval
                            localStorage.setItem('__MASTER_CALIBRATION_FOR_HARDCODING__', JSON.stringify({
                                code: code,
                                data: calibration,
                                timestamp: new Date().toISOString()
                            }));
                            
                            // Automatically save to server file for direct access
                            fetch('/api/eye-tracking/save-master-calibration', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(calibration)
                            }).then(response => response.json())
                            .then(result => {
                                if (result.success) {
                                    console.log('👁️ Eye Tracking: ✅ Calibration data automatically saved to server file!');
                                    console.log('👁️ Eye Tracking: 📁 File location: data/master-calibration.json');
                                    console.log('👁️ Eye Tracking: The system now has direct access to your calibration data');
                                } else {
                                    console.warn('👁️ Eye Tracking: ⚠️ Could not save to server file:', result.error);
                                }
                            }).catch(error => {
                                console.warn('👁️ Eye Tracking: ⚠️ Could not save to server file:', error);
                            });
                            
                            console.log('👁️ Eye Tracking: 💾 Calibration data stored for automatic hardcoding');
                            console.log('👁️ Eye Tracking: The code above will be automatically applied to the source code');
                            
                            // Try to copy to clipboard
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(code).then(() => {
                                    console.log('✅ Code copied to clipboard!');
                                }).catch(() => {
                                    console.log('⚠️ Could not copy to clipboard, but code is logged above');
                                });
                            }
                            
                            // Also log the data in a format ready for hardcoding
                            console.log('👁️ Eye Tracking: Calibration data summary:', {
                                scrollUp: {
                                    samples: scrollUp.samples,
                                    mean: scrollUp.mean,
                                    stdDev: scrollUp.stdDev,
                                    range: `${scrollUp.min.toFixed(4)} - ${scrollUp.max.toFixed(4)}`
                                },
                                scrollDown: {
                                    samples: scrollDown.samples,
                                    mean: scrollDown.mean,
                                    stdDev: scrollDown.stdDev,
                                    range: `${scrollDown.min.toFixed(4)} - ${scrollDown.max.toFixed(4)}`
                                },
                                noScroll: {
                                    samples: noScroll.samples,
                                    mean: noScroll.mean,
                                    stdDev: noScroll.stdDev,
                                    range: `${noScroll.min.toFixed(4)} - ${noScroll.max.toFixed(4)}`
                                }
                            });
                        };
                        
                        generateHardcodedCode();
                    });
                }
            }
            
            console.log('👁️ Eye Tracking: ✅ Calibration complete!');
        }
    };
    
    const cancelCalibration = () => {
        setIsCalibrating(false);
        setCalibrationStep(null);
        setCalibrationSamples({ scrollUp: 0, scrollDown: 0, noScroll: 0 });
        if (eyeTrackingEngineRef.current) {
            eyeTrackingEngineRef.current.clearCalibration();
        }
        console.log('👁️ Eye Tracking: Calibration cancelled');
    };
    
    const clearCalibration = () => {
        if (eyeTrackingEngineRef.current) {
            eyeTrackingEngineRef.current.clearCalibration();
            setError(null);
            console.log('👁️ Eye Tracking: Calibration cleared');
        }
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
                        
                        {/* Accuracy Metrics Section */}
                        <div className="mt-3 p-2 bg-slate-900/70 rounded border border-slate-700">
                            <div className="text-xs font-semibold text-cyan-400 mb-2">📊 Accuracy Metrics</div>
                            
                            {/* Current Confidence */}
                            <div className="mb-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-400">Current Confidence:</span>
                                    <span className={`text-xs font-bold ${
                                        currentConfidence > 0.7 ? 'text-green-400' :
                                        currentConfidence > 0.4 ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`}>
                                        {(currentConfidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                    <div 
                                        className={`h-1.5 rounded-full transition-all ${
                                            currentConfidence > 0.7 ? 'bg-green-500' :
                                            currentConfidence > 0.4 ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }`}
                                        style={{ width: `${Math.min(currentConfidence * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            {/* Average Confidence */}
                            <div className="mb-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-400">Avg Confidence:</span>
                                    <span className={`text-xs font-bold ${
                                        averageConfidence > 0.7 ? 'text-green-400' :
                                        averageConfidence > 0.4 ? 'text-yellow-400' :
                                        'text-gray-400'
                                    }`}>
                                        {(averageConfidence * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-1.5">
                                    <div 
                                        className={`h-1.5 rounded-full transition-all ${
                                            averageConfidence > 0.7 ? 'bg-green-500' :
                                            averageConfidence > 0.4 ? 'bg-yellow-500' :
                                            'bg-gray-500'
                                        }`}
                                        style={{ width: `${Math.min(averageConfidence * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            
                            {/* Detection Rate */}
                            <div className="mb-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-400">Detection Rate:</span>
                                    <span className={`text-xs font-bold ${
                                        detectionRate > 80 ? 'text-green-400' :
                                        detectionRate > 50 ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`}>
                                        {detectionRate.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            
                            {/* Screen Position & Zone */}
                            {screenPosition && (
                                <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-400">Screen Position:</span>
                                        <span className="text-cyan-400 font-mono">
                                            X: {screenPosition.x.toFixed(2)} Y: {screenPosition.y.toFixed(2)}
                                        </span>
                                    </div>
                                    {viewportZone && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Viewport Zone:</span>
                                            <span className={`font-bold ${
                                                viewportZone === 'top' ? 'text-blue-400' :
                                                viewportZone === 'bottom' ? 'text-green-400' :
                                                'text-yellow-400'
                                            }`}>
                                                {viewportZone.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    {scrollIntensity !== 0 && (
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Scroll Intensity:</span>
                                            <span className={`font-bold ${
                                                scrollIntensity > 0 ? 'text-green-400' : 'text-blue-400'
                                            }`}>
                                                {scrollIntensity > 0 ? '↓' : '↑'} {Math.abs(scrollIntensity).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Gaze Direction */}
                        {gazeDirection && (
                            <div className="text-xs text-blue-400">
                                Direction: <span className="font-bold">{gazeDirection}</span>
                            </div>
                        )}
                        
                        {/* Auto-scroll Status */}
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
                        
                        {/* Accuracy Rating */}
                        <div className="text-xs text-gray-500 mt-2 p-2 bg-slate-900/50 rounded">
                            <div className="font-semibold text-cyan-400 mb-1">Accuracy Rating:</div>
                            <div className={`text-sm font-bold ${
                                averageConfidence > 0.7 && detectionRate > 80 ? 'text-green-400' :
                                averageConfidence > 0.4 && detectionRate > 50 ? 'text-yellow-400' :
                                'text-red-400'
                            }`}>
                                {averageConfidence > 0.7 && detectionRate > 80 ? '🟢 Excellent' :
                                 averageConfidence > 0.4 && detectionRate > 50 ? '🟡 Good' :
                                 '🔴 Poor - Check lighting & camera position'}
                            </div>
                        </div>
                        
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
                            <li>Look down to scroll down, look up to scroll up</li>
                            <li>The system uses pre-calibrated settings for optimal accuracy</li>
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

