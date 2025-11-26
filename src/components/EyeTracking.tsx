'use client';

import { useState, useEffect, useRef } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { EyeTrackingEngine } from '@/lib/eye-tracking';
import { AutoBrightnessController } from '@/lib/auto-brightness';

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
    
    // Step-by-step feedback system for active learning
    const [feedbackMode, setFeedbackMode] = useState<'idle' | 'testing' | 'feedback'>('idle');
    const [testResult, setTestResult] = useState<{zone: string | null, normalizedY: number | null}>({zone: null, normalizedY: null});
    const [feedbackCount, setFeedbackCount] = useState(0);
    const [testCount, setTestCount] = useState(0);
    const [calibrationStats, setCalibrationStats] = useState<{scrollUp: number, scrollDown: number, noScroll: number, total: number} | null>(null);
    const currentNormalizedYRef = useRef<number | null>(null);
    const testTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const testSamplesRef = useRef<{normalizedY: number, zone: string | null}[]>([]);
    
    // Statistics tracking
    const detectionCountRef = useRef<number>(0);
    const totalFramesRef = useRef<number>(0);
    const confidenceHistoryRef = useRef<number[]>([]);
    const lastUpdateTimeRef = useRef<number>(Date.now());
    
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const eyeTrackingEngineRef = useRef<EyeTrackingEngine | null>(null);
    const autoBrightnessRef = useRef<AutoBrightnessController | null>(null);
    
    // Auto-brightness state
    const [autoBrightnessEnabled, setAutoBrightnessEnabled] = useState(true);
    const [currentBrightness, setCurrentBrightness] = useState(1.0);
    const lastScrollTime = useRef<number>(0);
    const scrollCooldown = 200; // 200ms between scrolls to prevent vibration (increased from 30ms)
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
            // Clean up test timeout
            if (testTimeoutRef.current) {
                clearTimeout(testTimeoutRef.current);
                testTimeoutRef.current = null;
            }
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
                
                // Initialize Auto-Brightness Controller
                if (autoBrightnessEnabled && videoRef.current) {
                    try {
                        const brightnessController = new AutoBrightnessController(videoRef.current, {
                            enabled: true,
                            minBrightness: 0.3,
                            maxBrightness: 1.0,
                            sensitivity: 0.7,
                            smoothing: 0.8
                        });
                        autoBrightnessRef.current = brightnessController;
                        brightnessController.start();
                        console.log('💡 Auto-Brightness: Initialized and started');
                    } catch (error) {
                        console.warn('💡 Auto-Brightness: Failed to initialize', error);
                    }
                }
            }

            // Initialize MediaPipe Eye Tracking Engine
            console.log('👁️ Eye Tracking: Creating EyeTrackingEngine instance...');
            const engine = new EyeTrackingEngine();
            eyeTrackingEngineRef.current = engine;

            console.log('👁️ Eye Tracking: Initializing engine with video element...');
            await engine.initialize(videoRef.current, (gaze) => {
                // Store current normalized Y for manual feedback
                if (gaze.normalizedEyePosition) {
                    currentNormalizedYRef.current = gaze.normalizedEyePosition.y;
                }
                
                // Update brightness display if auto-brightness is active
                if (autoBrightnessRef.current && autoBrightnessEnabled) {
                    const brightness = autoBrightnessRef.current.getCurrentBrightness();
                    setCurrentBrightness(brightness);
                }
                
                // Update calibration stats display (check on first load and periodically)
                if (eyeTrackingEngineRef.current) {
                    const calibration = eyeTrackingEngineRef.current.getCalibration();
                    if (calibration) {
                        const totalSamples = (calibration.scrollUp?.samples?.length || 0) + 
                                            (calibration.scrollDown?.samples?.length || 0) + 
                                            (calibration.noScroll?.samples?.length || 0);
                        
                        setCalibrationStats({
                            scrollUp: calibration.scrollUp?.samples?.length || 0,
                            scrollDown: calibration.scrollDown?.samples?.length || 0,
                            noScroll: calibration.noScroll?.samples?.length || 0,
                            total: totalSamples
                        });
                        
                        // Log calibration info on first load
                        if (totalSamples > 15) {
                            console.log('👁️ Eye Tracking: ✅ Using merged calibration with', totalSamples, 'total samples');
                            console.log('  - Top:', calibration.scrollUp?.samples?.length || 0, 'samples');
                            console.log('  - Middle:', calibration.noScroll?.samples?.length || 0, 'samples');
                            console.log('  - Bottom:', calibration.scrollDown?.samples?.length || 0, 'samples');
                        }
                    }
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
                
                // Log more frequently when confidence is low to help debug
                if (gaze.confidence < 0.2 || Math.random() < 0.05) {
                    console.log('👁️ Eye Tracking: Gaze callback', {
                        direction: gaze.direction,
                        confidence: (gaze.confidence * 100).toFixed(1) + '%',
                        hasEyePosition: !!gaze.eyePosition,
                        screenPosition: gaze.screenPosition,
                        viewportZone: gaze.viewportZone,
                        scrollIntensity: gaze.scrollIntensity?.toFixed(2),
                        hasCalibration: !!eyeTrackingEngineRef.current?.getCalibration()?.calibrated
                    });
                }
                
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
                    // SIGNIFICANTLY INCREASED speeds for better page coverage
                    // Base and max speeds are now much higher to cover more content per scroll
                    const baseScrollSpeed = 8.0; // Increased from 3.0 - covers more content per scroll
                    const maxScrollSpeed = 25.0; // Increased from 12.0 - covers much more content per scroll
                    const intensityFactor = Math.abs(gaze.scrollIntensity);
                    const confidenceFactor = Math.max(0.6, gaze.confidence); // Use confidence to adjust speed
                    
                    // Smooth acceleration curve (ease-in-out) - more aggressive for better responsiveness
                    const easedIntensity = intensityFactor < 0.5 
                        ? 2 * intensityFactor * intensityFactor 
                        : 1 - Math.pow(-2 * intensityFactor + 2, 2) / 2;
                    
                    // Calculate scroll speed with higher minimum for better page coverage
                    const calculatedSpeed = baseScrollSpeed + (easedIntensity * (maxScrollSpeed - baseScrollSpeed) * confidenceFactor);
                    const scrollSpeed = Math.max(8.0, calculatedSpeed); // Minimum 8.0 to ensure good page coverage
                    
                    // PROFESSIONAL INTENT-BASED SCROLLING
                    // Uses fixation time, velocity detection, and 5-zone system
                    // Prevents accidental scrolling while reading
                    
                    // Get screen position (0.0 = top, 1.0 = bottom)
                    const screenY = gaze.screenPosition?.y ?? 0.5;
                    // Note: 'now' is already defined above (line 255)
                    
                    // CRITICAL: Middle zone NEVER scrolls (user is reading)
                    if (gaze.viewportZone === 'middle') {
                        return; // NO SCROLLING in middle zone - safe reading zone
                    }
                    
                    // Intent detection is already done in eye-tracking.ts
                    // scrollIntensity is set to 0 if intent detector says no scroll
                    // Only proceed if scrollIntensity is non-zero (intent confirmed)
                    if (Math.abs(gaze.scrollIntensity) === 0) {
                        return; // Intent detector blocked scrolling
                    }
                    
                    // Minimum confidence threshold
                    const minConfidence = 0.65;
                    if (gaze.confidence < minConfidence) {
                        return; // Not confident enough
                    }
                    
                    // Calculate scroll amount (4% of viewport height - between 3-5%)
                    const viewportHeight = window.innerHeight;
                    const scrollPercentage = 0.04; // 4% of viewport
                    const scrollAmount = viewportHeight * scrollPercentage;
                    
                    // Scroll based on intent (scrollIntensity already validated by intent detector)
                    if (gaze.scrollIntensity < 0 && currentScroll > 50) {
                        // Scroll UP (negative intensity)
                        lastScrollTime.current = now;
                        
                        // Record scroll in intent detector (for cooldown)
                        if (eyeTrackingEngineRef.current) {
                            eyeTrackingEngineRef.current.recordScroll();
                        }
                        
                        requestAnimationFrame(() => {
                            window.scrollBy({ 
                                top: -scrollAmount, // Scroll UP (to previous content)
                                behavior: 'auto'
                            });
                        });
                        
                        if (Math.random() < 0.01) { // 1% of frames
                            console.log('👁️ Eye tracking: Intent confirmed → Scrolling UP', {
                                screenY: (screenY * 100).toFixed(1) + '%',
                                confidence: (gaze.confidence * 100).toFixed(1) + '%',
                                intensity: gaze.scrollIntensity.toFixed(2),
                                scrollAmount: Math.round(scrollAmount) + 'px'
                            });
                        }
                    } else if (gaze.scrollIntensity > 0 && currentScroll < maxScroll - 50) {
                        // Scroll DOWN (positive intensity)
                        lastScrollTime.current = now;
                        
                        // Record scroll in intent detector (for cooldown)
                        if (eyeTrackingEngineRef.current) {
                            eyeTrackingEngineRef.current.recordScroll();
                        }
                        
                        requestAnimationFrame(() => {
                            window.scrollBy({ 
                                top: scrollAmount, // Scroll DOWN (to new content)
                                behavior: 'auto'
                            });
                        });
                        
                        if (Math.random() < 0.01) { // 1% of frames
                            console.log('👁️ Eye tracking: Intent confirmed → Scrolling DOWN', {
                                screenY: (screenY * 100).toFixed(1) + '%',
                                confidence: (gaze.confidence * 100).toFixed(1) + '%',
                                intensity: gaze.scrollIntensity.toFixed(2),
                                scrollAmount: Math.round(scrollAmount) + 'px'
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
        // Stop auto-brightness
        if (autoBrightnessRef.current) {
            autoBrightnessRef.current.stop();
            autoBrightnessRef.current = null;
        }
        
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
            setFeedbackCount(0);
            console.log('👁️ Eye Tracking: Calibration cleared');
        }
    };
    
    // Start zone test - captures current gaze for feedback
    const startZoneTest = () => {
        if (!isActive || !eyeTrackingEngineRef.current) {
            setError('Please start eye tracking first');
            return;
        }
        
        setFeedbackMode('testing');
        setTestResult({zone: null, normalizedY: null});
        testSamplesRef.current = []; // Clear previous samples
        
        // Collect samples for 1.5 seconds (captures ~20-50 frames at 30fps)
        const startTime = Date.now();
        const TEST_DURATION = 1500; // 1.5 seconds (as per recommendation)
        const SAMPLE_INTERVAL = 30; // Sample every 30ms (~33 samples/second)
        
        const sampleInterval = setInterval(() => {
            if (currentNormalizedYRef.current !== null && viewportZone) {
                testSamplesRef.current.push({
                    normalizedY: currentNormalizedYRef.current,
                    zone: viewportZone
                });
            }
        }, SAMPLE_INTERVAL);
        
        // Stop collecting after TEST_DURATION
        testTimeoutRef.current = setTimeout(() => {
            clearInterval(sampleInterval);
            
            if (testSamplesRef.current.length > 0) {
                // Calculate average normalizedY and most common zone from collected samples
                const avgNormalizedY = testSamplesRef.current.reduce((sum, s) => sum + s.normalizedY, 0) / testSamplesRef.current.length;
                const zoneCounts: {[key: string]: number} = {};
                testSamplesRef.current.forEach(s => {
                    if (s.zone) zoneCounts[s.zone] = (zoneCounts[s.zone] || 0) + 1;
                });
                const mostCommonZone = Object.keys(zoneCounts).reduce((a, b) => 
                    zoneCounts[a] > zoneCounts[b] ? a : b
                ) as 'top' | 'middle' | 'bottom' | null;
                
                setTestResult({
                    zone: mostCommonZone,
                    normalizedY: avgNormalizedY
                });
                setFeedbackMode('feedback');
                setTestCount(prev => prev + 1);
                
                console.log(`👁️ Eye Tracking: Collected ${testSamplesRef.current.length} frames during test`);
            } else {
                setError('Could not detect gaze. Please try again.');
                setFeedbackMode('idle');
            }
        }, TEST_DURATION);
    };
    
    // Stop zone test
    const stopZoneTest = () => {
        if (testTimeoutRef.current) {
            clearTimeout(testTimeoutRef.current);
            testTimeoutRef.current = null;
        }
        setFeedbackMode('idle');
        setTestResult({zone: null, normalizedY: null});
        testSamplesRef.current = []; // Clear collected samples
    };
    
    // Handle zone feedback for active learning
    // ⭐ Now saves ALL collected frames (20-50 samples per test) instead of just 1
    const handleZoneFeedback = (correctZone: 'top' | 'middle' | 'bottom') => {
        if (!eyeTrackingEngineRef.current || !isActive) {
            setError('Eye tracking not ready. Please wait a moment.');
            return;
        }
        
        // Map zone to calibration action
        let action: 'scrollUp' | 'scrollDown' | 'noScroll';
        if (correctZone === 'top') {
            action = 'scrollUp';
        } else if (correctZone === 'bottom') {
            action = 'scrollDown';
        } else {
            action = 'noScroll';
        }
        
        // ⭐ Save ALL collected frames (20-50 samples) instead of just 1
        // This gives the system much better data distribution
        if (testSamplesRef.current.length > 0) {
            let savedCount = 0;
            testSamplesRef.current.forEach(sample => {
                eyeTrackingEngineRef.current?.addCalibrationSample(action, sample.normalizedY);
                savedCount++;
            });
            
            console.log(`👁️ Eye Tracking: Saved ${savedCount} samples for ${correctZone} zone`);
        } else {
            // Fallback: use single sample if collection failed
            const normalizedY = testResult.normalizedY || currentNormalizedYRef.current;
            if (normalizedY !== null) {
                eyeTrackingEngineRef.current.addCalibrationSample(action, normalizedY);
                console.log(`👁️ Eye Tracking: Saved 1 fallback sample for ${correctZone} zone`);
            } else {
                setError('No gaze data available. Please try the test again.');
                return;
            }
        }
        
            // Update feedback count
            setFeedbackCount(prev => prev + 1);
            
            // Update calibration stats
            const updatedCalibration = eyeTrackingEngineRef.current.getCalibration();
            if (updatedCalibration && updatedCalibration.calibrated) {
                setCalibrationStats({
                    scrollUp: updatedCalibration.scrollUp.samples.length,
                    scrollDown: updatedCalibration.scrollDown.samples.length,
                    noScroll: updatedCalibration.noScroll.samples.length,
                    total: updatedCalibration.scrollUp.samples.length + updatedCalibration.scrollDown.samples.length + updatedCalibration.noScroll.samples.length
                });
            }
            
            console.log('👁️ Eye Tracking: Feedback saved', {
                detected: detectedZone,
                correct: correctZone,
                normalizedY: normalizedY.toFixed(6),
                action,
                totalFeedback: feedbackCount + 1,
                wasCorrect: detectedZone === correctZone,
                totalSamples: updatedCalibration ? 
                    (updatedCalibration.scrollUp.samples.length + updatedCalibration.scrollDown.samples.length + updatedCalibration.noScroll.samples.length) : 0
            });
            
            // Show success and reset for next test
            setError(null);
            setTimeout(() => {
                setFeedbackMode('idle');
                setTestResult({zone: null, normalizedY: null});
            }, 1500); // Show success for 1.5 seconds
    };
    
    // Copy localStorage data to clipboard for easy sharing
    const copyLocalStorageToClipboard = async () => {
        try {
            const stored = localStorage.getItem('eyeTrackingCalibration');
            if (!stored) {
                alert('❌ No calibration data found in localStorage.\n\nPlease use the step-by-step feedback system to provide samples first.');
                return;
            }
            
            const data = JSON.parse(stored);
            const jsonString = JSON.stringify(data, null, 2);
            
            // Copy to clipboard
            await navigator.clipboard.writeText(jsonString);
            
            const topSamples = data.scrollUp?.samples?.length || 0;
            const middleSamples = data.noScroll?.samples?.length || 0;
            const bottomSamples = data.scrollDown?.samples?.length || 0;
            const total = topSamples + middleSamples + bottomSamples;
            
            console.log('👁️ Eye Tracking: ✅ Copied to clipboard!');
            console.log('📊 Your localStorage data:');
            console.log('  Top:', topSamples, '| Middle:', middleSamples, '| Bottom:', bottomSamples, '| Total:', total);
            console.log('='.repeat(80));
            console.log('📋 Next steps:');
            console.log('  1. Save this JSON to a file: user-calibration.json');
            console.log('  2. Run: node scripts/merge-calibration-data.js user-calibration.json');
            console.log('  3. This will merge your', total, 'samples with master calibration (15) =', total + 15, 'total');
            
            alert(`✅ Copied to clipboard!\n\nYour data: ${total} samples\n- Top: ${topSamples}\n- Middle: ${middleSamples}\n- Bottom: ${bottomSamples}\n\nNext: Save to user-calibration.json and run the merge script.\n\nCheck console (F12) for instructions.`);
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            alert('❌ Could not copy to clipboard. Check console for the data.');
        }
    };
    
    // Check localStorage data to verify 30 samples
    const checkLocalStorageData = () => {
        try {
            const stored = localStorage.getItem('eyeTrackingCalibration');
            if (stored) {
                const data = JSON.parse(stored);
                const topSamples = data.scrollUp?.samples?.length || 0;
                const middleSamples = data.noScroll?.samples?.length || 0;
                const bottomSamples = data.scrollDown?.samples?.length || 0;
                const total = topSamples + middleSamples + bottomSamples;
                
                console.log('👁️ Eye Tracking: 📋 LOCALSTORAGE DATA CHECK');
                console.log('='.repeat(80));
                console.log('Your localStorage samples:');
                console.log('  Top (scrollUp):', topSamples, 'samples');
                console.log('  Middle (noScroll):', middleSamples, 'samples');
                console.log('  Bottom (scrollDown):', bottomSamples, 'samples');
                console.log('  TOTAL:', total, 'samples');
                console.log('='.repeat(80));
                console.log('Full data:', JSON.stringify(data, null, 2));
                
                if (total >= 30) {
                    alert(`✅ Found your 30 samples in localStorage!\n\nTop: ${topSamples}\nMiddle: ${middleSamples}\nBottom: ${bottomSamples}\nTotal: ${total}\n\nCheck console (F12) for full data.`);
                } else {
                    alert(`⚠️ Found ${total} samples in localStorage (expected 30)\n\nTop: ${topSamples}\nMiddle: ${middleSamples}\nBottom: ${bottomSamples}\n\nCheck console (F12) for full data.`);
                }
            } else {
                alert('❌ No calibration data found in localStorage.\n\nYour 30 samples may not have been saved.\nPlease use the step-by-step feedback system to provide samples.');
            }
        } catch (error) {
            console.error('Error checking localStorage:', error);
            alert('Error checking localStorage. Check console for details.');
        }
    };
    
    // Export calibration data to share with system
    const exportCalibrationData = async () => {
        if (!eyeTrackingEngineRef.current) {
            setError('Eye tracking not initialized');
            return;
        }
        
        // Get both merged calibration and raw localStorage data
        const calibration = eyeTrackingEngineRef.current.getCalibration();
        let localStorageData = null;
        
        // Also get raw localStorage data
        try {
            const stored = localStorage.getItem('eyeTrackingCalibration');
            if (stored) {
                localStorageData = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Could not read localStorage:', error);
        }
        
        if (!calibration || (!calibration.calibrated && !localStorageData)) {
            setError('No calibration data available. Please provide feedback samples first.');
            return;
        }
        
        // Log to console for easy access
        console.log('👁️ Eye Tracking: 📤 EXPORTING CALIBRATION DATA');
        console.log('='.repeat(80));
        console.log('MERGED CALIBRATION (Master + User Feedback):');
        console.log(JSON.stringify(calibration, null, 2));
        console.log('='.repeat(80));
        
        if (localStorageData) {
            console.log('RAW LOCALSTORAGE DATA (Your 30 samples):');
            console.log(JSON.stringify(localStorageData, null, 2));
            console.log('='.repeat(80));
        }
        
        // Calculate stats
        const stats = {
            merged: {
                scrollUp: calibration.scrollUp?.samples?.length || 0,
                scrollDown: calibration.scrollDown?.samples?.length || 0,
                noScroll: calibration.noScroll?.samples?.length || 0,
                total: (calibration.scrollUp?.samples?.length || 0) + 
                       (calibration.scrollDown?.samples?.length || 0) + 
                       (calibration.noScroll?.samples?.length || 0)
            },
            localStorage: localStorageData ? {
                scrollUp: localStorageData.scrollUp?.samples?.length || 0,
                scrollDown: localStorageData.scrollDown?.samples?.length || 0,
                noScroll: localStorageData.noScroll?.samples?.length || 0,
                total: (localStorageData.scrollUp?.samples?.length || 0) + 
                       (localStorageData.scrollDown?.samples?.length || 0) + 
                       (localStorageData.noScroll?.samples?.length || 0)
            } : null
        };
        
        console.log('📊 STATISTICS:');
        console.log('Merged (Master + User):', stats.merged);
        if (stats.localStorage) {
            console.log('Your localStorage samples:', stats.localStorage);
        }
        console.log('='.repeat(80));
        console.log('👁️ Eye Tracking: Copy the JSON above and share it');
        
        // Also try to send to API for analysis
        try {
            const response = await fetch('/api/eye-tracking/export-calibration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    calibrationData: calibration,
                    localStorageData: localStorageData,
                    stats: stats
                })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('👁️ Eye Tracking: ✅ Calibration data sent to server');
                console.log('Analysis:', result.analysis);
                alert(`✅ Calibration data exported!\n\nMerged Total: ${stats.merged.total} samples\n- Top: ${stats.merged.scrollUp}\n- Middle: ${stats.merged.noScroll}\n- Bottom: ${stats.merged.scrollDown}\n\n${stats.localStorage ? `Your localStorage: ${stats.localStorage.total} samples` : 'No localStorage data'}\n\nCheck console (F12) for full data.`);
            }
        } catch (error) {
            console.warn('Could not send to server, but data is in console:', error);
            alert(`✅ Calibration data logged to console!\n\nTotal samples: ${stats.merged.total}\n- Top: ${stats.merged.scrollUp}\n- Middle: ${stats.merged.noScroll}\n- Bottom: ${stats.merged.scrollDown}\n\nCheck browser console (F12) for full data.`);
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
                        
                        {/* Auto-Brightness Toggle */}
                        {isActive && (
                            <div className="mt-2 pt-2 border-t border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-400">
                                        💡 Auto-Brightness:
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newEnabled = !autoBrightnessEnabled;
                                            setAutoBrightnessEnabled(newEnabled);
                                            if (autoBrightnessRef.current) {
                                                if (newEnabled) {
                                                    autoBrightnessRef.current.start();
                                                } else {
                                                    autoBrightnessRef.current.stop();
                                                }
                                            }
                                        }}
                                        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                                            autoBrightnessEnabled
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                                        }`}
                                    >
                                        {autoBrightnessEnabled ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                                {autoBrightnessEnabled && autoBrightnessRef.current && (
                                    <div className="text-xs text-cyan-400 mt-1">
                                        Brightness: {(currentBrightness * 100).toFixed(0)}%
                                    </div>
                                )}
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
                                 currentConfidence === 0 ? '🔴 No Face Detected - Check camera & lighting' :
                                 '🔴 Poor - Check lighting & camera position'}
                            </div>
                            {currentConfidence === 0 && (
                                <div className="text-xs text-red-300 mt-2 space-y-1">
                                    <div>⚠️ Troubleshooting:</div>
                                    <div>• Ensure camera is on and working</div>
                                    <div>• Check browser permissions</div>
                                    <div>• Improve lighting (face should be visible)</div>
                                    <div>• Look directly at camera</div>
                                    <div>• Check browser console (F12) for errors</div>
                                </div>
                            )}
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-2 p-2 bg-slate-900/50 rounded">
                            💡 Look down to scroll, look up to scroll back
                        </div>
                        
                        {/* Calibration Stats Display */}
                        {calibrationStats && (
                            <div className="mt-3 p-2 bg-blue-900/30 rounded border border-blue-700/50">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs font-semibold text-blue-400">
                                        📊 Calibration Data
                                    </div>
                                    <button
                                        onClick={checkLocalStorageData}
                                        className="text-xs text-blue-300 hover:text-blue-200"
                                        title="Check localStorage for your 30 samples"
                                    >
                                        🔍 Verify
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div className="text-center">
                                        <div className="text-blue-300 font-bold">{calibrationStats.scrollUp}</div>
                                        <div className="text-gray-400">Top</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-yellow-300 font-bold">{calibrationStats.noScroll}</div>
                                        <div className="text-gray-400">Middle</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-green-300 font-bold">{calibrationStats.scrollDown}</div>
                                        <div className="text-gray-400">Bottom</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-purple-300 font-bold">{calibrationStats.total}</div>
                                        <div className="text-gray-400">Total</div>
                                    </div>
                                </div>
                                {calibrationStats.total >= 30 && (
                                    <div className="text-xs text-green-400 mt-2 text-center">
                                        ✅ Excellent! {calibrationStats.total} samples loaded (Master + Your 30 samples)
                                    </div>
                                )}
                                {calibrationStats.total < 30 && calibrationStats.total > 15 && (
                                    <div className="text-xs text-yellow-400 mt-2 text-center">
                                        ⚠️ {calibrationStats.total} samples - Your 30 samples may not be in localStorage
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Zone System Explanation */}
                        <div className="mt-3 p-3 bg-cyan-900/30 rounded border border-cyan-700/50">
                            <div className="text-xs font-semibold text-cyan-400 mb-2">
                                📐 How Zones Work
                            </div>
                            <div className="text-xs text-gray-400 space-y-1">
                                <div><strong className="text-cyan-300">You calibrate with 3 zones:</strong></div>
                                <div className="ml-2">• <span className="text-blue-400">TOP</span> - Look at top of screen</div>
                                <div className="ml-2">• <span className="text-yellow-400">MIDDLE</span> - Look at center</div>
                                <div className="ml-2">• <span className="text-green-400">BOTTOM</span> - Look at bottom</div>
                                <div className="mt-2"><strong className="text-cyan-300">System automatically uses 5 zones:</strong></div>
                                <div className="ml-2 text-xs">
                                    <div>• <span className="text-blue-400">0-5%</span> Top Scroll (scrolls UP)</div>
                                    <div>• <span className="text-gray-400">5-15%</span> Top Reading (no scroll)</div>
                                    <div>• <span className="text-yellow-400">15-75%</span> Middle (no scroll)</div>
                                    <div>• <span className="text-gray-400">75-95%</span> Bottom Reading (no scroll)</div>
                                    <div>• <span className="text-green-400">95-100%</span> Bottom Scroll (scrolls DOWN)</div>
                                </div>
                                <div className="mt-2 text-cyan-300">
                                    ✅ Only top 5% and bottom 5% trigger scrolling
                                </div>
                            </div>
                        </div>
                        
                        {/* Step-by-Step Feedback System for Active Learning */}
                        <div className="mt-3 p-3 bg-purple-900/30 rounded border border-purple-700/50">
                            <div className="text-xs font-semibold text-purple-400 mb-3">
                                🎯 Step-by-Step Zone Training
                            </div>
                            
                            {feedbackMode === 'idle' && (
                                <div className="space-y-2">
                                    <div className="text-xs text-gray-400 mb-3 space-y-1">
                                        <div><strong>How to calibrate:</strong></div>
                                        <div>1. Look at TOP/MIDDLE/BOTTOM of screen</div>
                                        <div>2. Click "Start Test" and hold your gaze for 1.5 seconds</div>
                                        <div>3. System collects 20-50 frames automatically</div>
                                        <div>4. Confirm the detected zone (or correct it)</div>
                                        <div className="mt-2 text-cyan-400">
                                            <strong>Target: 30-50 samples per zone</strong> (repeat 2-3 times per zone)
                                        </div>
                                    </div>
                                    <button
                                        onClick={startZoneTest}
                                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-semibold text-sm transition-all"
                                    >
                                        🚀 Start Test
                                    </button>
                                    {testCount > 0 && (
                                        <div className="text-xs text-gray-400 text-center">
                                            Tests completed: {testCount} | Feedback given: {feedbackCount}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {feedbackMode === 'testing' && (
                                <div className="space-y-3">
                                    <div className="text-xs text-yellow-400 font-semibold animate-pulse">
                                        ⏳ Testing... Look at TOP, MIDDLE, or BOTTOM of screen
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        Collecting 20-50 frames (1.5 seconds)... Keep looking at the zone!
                                    </div>
                                    <div className="text-xs text-cyan-400">
                                        Frames collected: {testSamplesRef.current.length}
                                    </div>
                                    <button
                                        onClick={stopZoneTest}
                                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-sm transition-all"
                                    >
                                        Stop Test
                                    </button>
                                </div>
                            )}
                            
                            {feedbackMode === 'feedback' && testResult.zone && (
                                <div className="space-y-3">
                                    <div className="text-xs text-gray-400 mb-2">
                                        Detected Zone:
                                    </div>
                                    <div className={`text-lg font-bold text-center p-3 rounded ${
                                        testResult.zone === 'top' ? 'bg-blue-600 text-white' :
                                        testResult.zone === 'bottom' ? 'bg-green-600 text-white' :
                                        'bg-yellow-600 text-white'
                                    }`}>
                                        {testResult.zone.toUpperCase()}
                                    </div>
                                    <div className="text-xs text-gray-500 text-center mb-3">
                                        Is this correct? Select the actual zone you were looking at:
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => handleZoneFeedback('top')}
                                            className={`px-3 py-2 rounded text-xs font-semibold transition-all ${
                                                testResult.zone === 'top'
                                                    ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                                    : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/70'
                                            }`}
                                        >
                                            ↑ TOP
                                        </button>
                                        <button
                                            onClick={() => handleZoneFeedback('middle')}
                                            className={`px-3 py-2 rounded text-xs font-semibold transition-all ${
                                                testResult.zone === 'middle'
                                                    ? 'bg-yellow-600 text-white ring-2 ring-yellow-300'
                                                    : 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800/70'
                                            }`}
                                        >
                                            • MIDDLE
                                        </button>
                                        <button
                                            onClick={() => handleZoneFeedback('bottom')}
                                            className={`px-3 py-2 rounded text-xs font-semibold transition-all ${
                                                testResult.zone === 'bottom'
                                                    ? 'bg-green-600 text-white ring-2 ring-green-300'
                                                    : 'bg-green-900/50 text-green-300 hover:bg-green-800/70'
                                            }`}
                                        >
                                            ↓ BOTTOM
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setFeedbackMode('idle')}
                                        className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded font-semibold text-sm transition-all mt-2"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                            
                            {feedbackCount > 0 && (
                                <div className="space-y-2">
                                    <div className="text-xs text-green-400 mt-3 pt-3 border-t border-purple-700/50 text-center">
                                        ✓ {feedbackCount} feedback sample{feedbackCount !== 1 ? 's' : ''} collected - System is learning!
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={exportCalibrationData}
                                            className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-all"
                                            title="Export your calibration data to console"
                                        >
                                            📤 Export
                                        </button>
                                        <button
                                            onClick={copyLocalStorageToClipboard}
                                            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-all"
                                            title="Copy localStorage data to clipboard for merging with master calibration"
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>
                            )}
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

