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
    const lastScrollTime = useRef<number>(0);
    const scrollCooldown = 200; // 200ms between scrolls to prevent vibration (increased from 30ms)
    const isManualScrolling = useRef<boolean>(false);
    const manualScrollTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Defer heavy checks to prevent blocking initial render
        // Only check for getUserMedia support after a delay
        const checkTimer = setTimeout(() => {
            if (typeof window !== 'undefined') {
                const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
                setIsSupported(hasGetUserMedia);
            }
        }, 1000); // Wait 1 second before checking camera support
        
        // Detect manual scrolling to prevent interference
        const handleScroll = () => {
            isManualScrolling.current = true;
            if (manualScrollTimeout.current) {
                clearTimeout(manualScrollTimeout.current);
            }
            // Disable eye tracking scrolling for 3 seconds after manual scroll
            manualScrollTimeout.current = setTimeout(() => {
                isManualScrolling.current = false;
            }, 3000);
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('wheel', handleScroll, { passive: true });
        
        return () => {
            clearTimeout(checkTimer);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('wheel', handleScroll);
            if (manualScrollTimeout.current) clearTimeout(manualScrollTimeout.current);
        };
    }, []);


    useEffect(() => {
        // Removed all console.log to prevent performance issues and infinite loops
        
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

            // Removed console.log to prevent performance issues
            
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            streamRef.current = stream;
            // Removed console.log to prevent performance issues

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                // Removed console.log to prevent performance issues
            }

            // Initialize MediaPipe Eye Tracking Engine
            // Removed console.log to prevent performance issues
            const engine = new EyeTrackingEngine();
            eyeTrackingEngineRef.current = engine;

            // Removed console.log to prevent performance issues
            await engine.initialize(videoRef.current, (gaze) => {
                // Store current normalized Y for manual feedback
                if (gaze.normalizedEyePosition) {
                    currentNormalizedYRef.current = gaze.normalizedEyePosition.y;
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
                            // Removed console.log to prevent performance issues
                            // Removed console.log to prevent performance issues
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
                    // Removed console.log to prevent performance issues
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
                        
                        // Removed console.log to prevent performance issues
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
                        
                        // Removed console.log to prevent performance issues
                    }
                }
            });
            
            // Removed console.log to prevent performance issues

            setError(null);
        } catch (err: any) {
            // Silently handle errors to prevent console spam
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
        // Removed console.log to prevent performance issues
        
        if (!isSupported) {
            // Silently handle - error already set
            setError('Eye tracking not supported in this browser');
            return;
        }

        if (!isActive) {
            // Starting tracking - request camera permission
            // Removed console.log to prevent performance issues
            try {
                // Request permission first
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                // Immediately stop it - we just wanted permission
                stream.getTracks().forEach(track => track.stop());
                // Removed console.log to prevent performance issues
            } catch (err: any) {
                // Silently handle errors to prevent console spam
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Camera permission denied. Please allow camera access in your browser settings.');
                    return;
                } else {
                    setError(`Failed to access camera: ${err.message}`);
                    return;
                }
            }
        } else {
            // Removed console.log to prevent performance issues
        }

        setIsActive(!isActive);
        setError(null);
        // Removed console.log to prevent performance issues
    };
    
    const startCalibration = () => {
        if (!isActive) {
            setError('Please start eye tracking first');
            return;
        }
        setIsCalibrating(true);
        setCalibrationStep('scrollUp');
        setCalibrationSamples({ scrollUp: 0, scrollDown: 0, noScroll: 0 });
        // Removed console.log to prevent performance issues
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
        
        // Removed console.log to prevent performance issues
        
        // Move to next step
        if (action === 'scrollUp' && calibrationSamples.scrollUp < 4) {
            // Continue collecting scrollUp samples
        } else if (action === 'scrollUp' && calibrationSamples.scrollUp >= 4) {
            setCalibrationStep('scrollDown');
            // Removed console.log to prevent performance issues
        } else if (action === 'scrollDown' && calibrationSamples.scrollDown < 4) {
            // Continue collecting scrollDown samples
        } else if (action === 'scrollDown' && calibrationSamples.scrollDown >= 4) {
            setCalibrationStep('noScroll');
            // Removed console.log to prevent performance issues
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
                            
                            // Removed console.log to prevent performance issues
                            
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
                                    // Removed console.log to prevent performance issues
                                } else {
                                    // Silently handle errors
                                }
                            }).catch(error => {
                                // Silently handle errors
                            });
                            
                            // Removed console.log to prevent performance issues
                            
                            // Try to copy to clipboard
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(code).catch(() => {
                                    // Silently handle clipboard errors
                                });
                            }
                            
                            // Removed console.log to prevent performance issues
                            // Calibration data summary removed to prevent performance issues
                        };
                        
                        generateHardcodedCode();
                    });
                }
            }
            
            // Removed console.log to prevent performance issues
        }
    };
    
    const cancelCalibration = () => {
        setIsCalibrating(false);
        setCalibrationStep(null);
        setCalibrationSamples({ scrollUp: 0, scrollDown: 0, noScroll: 0 });
        if (eyeTrackingEngineRef.current) {
            eyeTrackingEngineRef.current.clearCalibration();
        }
        // Removed console.log to prevent performance issues
    };
    
    const clearCalibration = () => {
        if (eyeTrackingEngineRef.current) {
            eyeTrackingEngineRef.current.clearCalibration();
            setError(null);
            setFeedbackCount(0);
            // Removed console.log to prevent performance issues
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
                
                // Removed console.log to prevent performance issues
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
            
            // Removed console.log to prevent performance issues
        } else {
            // Fallback: use single sample if collection failed
            const normalizedY = testResult.normalizedY || currentNormalizedYRef.current;
            if (normalizedY !== null) {
                eyeTrackingEngineRef.current.addCalibrationSample(action, normalizedY);
                // Removed console.log to prevent performance issues
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
            
            // Removed console.log to prevent performance issues
            
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
            
            // Removed console.log to prevent performance issues
            
            alert(`✅ Copied to clipboard!\n\nYour data: ${total} samples\n- Top: ${topSamples}\n- Middle: ${middleSamples}\n- Bottom: ${bottomSamples}\n\nNext: Save to user-calibration.json and run the merge script.\n\nCheck console (F12) for instructions.`);
        } catch (error) {
            // Silently handle errors
            alert('❌ Could not copy to clipboard.');
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
                
                // Removed console.log to prevent performance issues
                
                if (total >= 30) {
                    alert(`✅ Found your 30 samples in localStorage!\n\nTop: ${topSamples}\nMiddle: ${middleSamples}\nBottom: ${bottomSamples}\nTotal: ${total}\n\nCheck console (F12) for full data.`);
                } else {
                    alert(`⚠️ Found ${total} samples in localStorage (expected 30)\n\nTop: ${topSamples}\nMiddle: ${middleSamples}\nBottom: ${bottomSamples}\n\nCheck console (F12) for full data.`);
                }
            } else {
                alert('❌ No calibration data found in localStorage.\n\nYour 30 samples may not have been saved.\nPlease use the step-by-step feedback system to provide samples.');
            }
        } catch (error) {
            // Silently handle errors
            alert('Error checking localStorage.');
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
            // Silently handle errors
        }
        
        if (!calibration || (!calibration.calibrated && !localStorageData)) {
            setError('No calibration data available. Please provide feedback samples first.');
            return;
        }
        
        // Removed console.log to prevent performance issues
        
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
        
        // Removed console.log to prevent performance issues
        
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
                // Removed console.log to prevent performance issues
                alert(`✅ Calibration data exported!\n\nMerged Total: ${stats.merged.total} samples\n- Top: ${stats.merged.scrollUp}\n- Middle: ${stats.merged.noScroll}\n- Bottom: ${stats.merged.scrollDown}\n\n${stats.localStorage ? `Your localStorage: ${stats.localStorage.total} samples` : 'No localStorage data'}`);
            }
        } catch (error) {
            // Silently handle errors
            alert(`✅ Calibration data exported!\n\nTotal samples: ${stats.merged.total}\n- Top: ${stats.merged.scrollUp}\n- Middle: ${stats.merged.noScroll}\n- Bottom: ${stats.merged.scrollDown}`);
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
                // Removed console.log to prevent performance issues
            };
            checkChapterPage();
            // Check on route changes only (removed interval to prevent performance issues)
            const handleRouteChange = () => checkChapterPage();
            window.addEventListener('popstate', handleRouteChange);
            // Listen for Next.js route changes
            window.addEventListener('pushstate', handleRouteChange);
            return () => {
                window.removeEventListener('popstate', handleRouteChange);
                window.removeEventListener('pushstate', handleRouteChange);
            };
        }
    }, [eyeTrackingEnabled, showUI, isSupported]);

    // Debug logging - REMOVED to prevent performance issues
    // Excessive logging on every state change can cause page freezing

    // Always show UI on chapter pages, even if not enabled
    // This allows users to enable it from the chapter page itself
    if (!showUI) {
        return null;
    }
    
    // Show UI on chapter pages, or if explicitly enabled
    // ALWAYS show if we're on a chapter page OR if eyeTrackingEnabled is true
    const shouldShow = isChapterPage || eyeTrackingEnabled;
    
    if (!shouldShow) {
        return null;
    }
    
    // Removed console.log to prevent performance issues

    if (!isSupported) {
        return (
            <div 
                className="fixed right-4 z-50" 
                style={{ 
                    zIndex: 9998, 
                    position: 'fixed', 
                    bottom: '26rem', 
                    right: '1rem',
                    top: 'auto',
                    left: 'auto',
                    transform: 'none'
                }}
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

    // Removed console.log to prevent performance issues
    
    // CRITICAL: Lock position when isActive changes to prevent movement when activated
    const panelRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!panelRef.current) return;
        
        const el = panelRef.current;
        // Lock position immediately when isActive changes
        el.style.setProperty('position', 'fixed', 'important');
        el.style.setProperty('bottom', '26rem', 'important');
        el.style.setProperty('right', '1rem', 'important');
        el.style.setProperty('top', 'auto', 'important');
        el.style.setProperty('left', 'auto', 'important');
        el.style.setProperty('transform', 'none', 'important');
    }, [isActive]); // Run when isActive changes
    
    return (
        <div 
            ref={panelRef}
            className="fixed right-4 z-50" 
            style={{ 
                zIndex: 9998, // Lower than VoiceAssistant and AutoBrightness
                position: 'fixed',
                bottom: '26rem', // Top position - above VoiceAssistant (7rem + ~200px height + 1rem gap = ~26rem)
                right: '1rem',
                maxHeight: 'calc(100vh - 28rem)', // Prevent overflow - account for other widgets
                top: 'auto',
                left: 'auto',
                transform: 'none',
                width: 'auto' // Prevent width changes from affecting position
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

