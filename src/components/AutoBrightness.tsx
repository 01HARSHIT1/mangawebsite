'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useAIFeatures } from '@/hooks/useAIFeatures';
import { AutoBrightnessController } from '@/lib/auto-brightness';

interface AutoBrightnessProps {
    enabled?: boolean;
    showUI?: boolean;
}

export default function AutoBrightness({ enabled = false, showUI = true }: AutoBrightnessProps) {
    const { isFeatureEnabled } = useAIFeatures();
    const autoBrightnessEnabled = enabled || isFeatureEnabled('autoBrightness');
    
    const [isActive, setIsActive] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentBrightness, setCurrentBrightness] = useState(1.0);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const autoBrightnessRef = useRef<AutoBrightnessController | null>(null);
    const widgetRef = useRef<HTMLDivElement>(null);
    
    // Check if browser supports camera - defer to prevent blocking
    useEffect(() => {
        // Defer camera support check to prevent blocking initial render
        const checkTimer = setTimeout(() => {
            setIsSupported(
                typeof navigator !== 'undefined' &&
                !!navigator.mediaDevices &&
                !!navigator.mediaDevices.getUserMedia
            );
        }, 1000); // Wait 1 second before checking camera support
        
        return () => clearTimeout(checkTimer);
    }, []);
    
    const stopBrightness = () => {
        // Stop auto-brightness controller
        if (autoBrightnessRef.current) {
            // Clear update interval
            if ((autoBrightnessRef.current as any).updateInterval) {
                clearInterval((autoBrightnessRef.current as any).updateInterval);
            }
            autoBrightnessRef.current.stop();
            autoBrightnessRef.current = null;
        }

        // Stop camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setIsActive(false);
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopBrightness();
        };
    }, []);
    
    // CRITICAL FIX: Only run position locking when component is actually visible
    // This prevents the heavy MutationObserver and setInterval from blocking the page
    // Position stays locked even when isActive changes (when user clicks to start)
    useEffect(() => {
        // ONLY set up position locking if component is actually being shown
        // This prevents blocking when component is disabled
        if (!showUI || !widgetRef.current) {
            return;
        }
        
        // Lock position immediately when isActive changes to prevent movement
        if (widgetRef.current) {
            const el = widgetRef.current;
            el.style.setProperty('position', 'fixed', 'important');
            el.style.setProperty('bottom', '1rem', 'important');
            el.style.setProperty('right', '1rem', 'important');
            el.style.setProperty('top', 'auto', 'important');
            el.style.setProperty('transform', 'none', 'important');
            el.style.setProperty('left', 'auto', 'important');
            el.style.setProperty('z-index', '99999', 'important');
        }
        
        // Wait for ref to be set
        const setupPositionLock = () => {
            if (!widgetRef.current) {
                // Retry if ref not ready (but limit retries to prevent infinite loop)
                const retryCount = (setupPositionLock as any).retryCount || 0;
                if (retryCount < 5) {
                    (setupPositionLock as any).retryCount = retryCount + 1;
                    setTimeout(setupPositionLock, 50); // Increased delay
                }
                return;
            }
            
            const el = widgetRef.current;
            
            // LIGHTWEIGHT position lock - only set styles, no expensive getComputedStyle calls
            const lockPosition = () => {
                if (!el) return;
                
                // Simply set the critical properties - no verification needed
                el.style.setProperty('position', 'fixed', 'important');
                el.style.setProperty('bottom', '1rem', 'important');
                el.style.setProperty('right', '1rem', 'important');
                el.style.setProperty('top', 'auto', 'important');
                el.style.setProperty('transform', 'none', 'important');
                el.style.setProperty('left', 'auto', 'important');
                el.style.setProperty('z-index', '99999', 'important');
            };
            
            // Lock immediately
            lockPosition();
            
            // Use a MUCH lighter MutationObserver - only watch for style changes, don't call getComputedStyle
            let observer: MutationObserver | null = null;
            try {
                observer = new MutationObserver(() => {
                    // Just re-apply styles without expensive getComputedStyle calls
                    lockPosition();
                });
                
                observer.observe(el, {
                    attributes: true,
                    attributeFilter: ['style', 'class'],
                    childList: false,
                    subtree: false,
                });
            } catch (error) {
                // Silently handle errors
            }
            
            // MUCH less frequent interval - only every 1 second instead of 100ms
            let intervalId: NodeJS.Timeout | null = null;
            try {
                intervalId = setInterval(() => {
                    lockPosition();
                }, 1000); // Changed from 100ms to 1000ms (10x less frequent)
            } catch (error) {
                // Silently handle errors
            }
            
            // Store cleanup function
            (el as any)._positionLockCleanup = () => {
                try {
                    if (observer) {
                        observer.disconnect();
                    }
                    if (intervalId) {
                        clearInterval(intervalId);
                    }
                } catch (error) {
                    // Silently handle errors
                }
            };
        };
        
        // Delay setup to prevent blocking initial render
        const setupTimer = setTimeout(setupPositionLock, 500);
        
        return () => {
            clearTimeout(setupTimer);
            if (widgetRef.current && (widgetRef.current as any)._positionLockCleanup) {
                (widgetRef.current as any)._positionLockCleanup();
            }
        };
    }, [showUI, isActive]); // Run when showUI OR isActive changes to lock position when activated
    
    const startBrightness = async () => {
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
                    width: { ideal: 320 },
                    height: { ideal: 240 }
                }
            });

            streamRef.current = stream;
            // Removed console.log to prevent performance issues

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                // Removed console.log to prevent performance issues
                
                // Initialize Auto-Brightness Controller
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
                    // Removed console.log to prevent performance issues
                    
                    // Update brightness display frequently for real-time feedback
                    const updateInterval = setInterval(() => {
                        if (autoBrightnessRef.current) {
                            const brightness = autoBrightnessRef.current.getCurrentBrightness();
                            setCurrentBrightness(brightness);
                        }
                    }, 100); // Update every 100ms for real-time feedback (was 500ms)
                    
                    // Store interval for cleanup
                    (autoBrightnessRef.current as any).updateInterval = updateInterval;
                } catch (error) {
                    // Silently handle errors
                    setError('Failed to initialize brightness controller');
                }
            }

            // CRITICAL: Lock position BEFORE state change to prevent movement
            if (widgetRef.current) {
                const el = widgetRef.current;
                try {
                    let computedBefore: CSSStyleDeclaration;
                    let computedBeforeStyles: any;
                    try {
                        computedBefore = window.getComputedStyle(el);
                        computedBeforeStyles = {
                            position: computedBefore.position,
                            top: computedBefore.top,
                            right: computedBefore.right,
                            bottom: computedBefore.bottom,
                            left: computedBefore.left,
                            transform: computedBefore.transform,
                        };
                    } catch (error) {
                        // Silently handle errors to prevent console spam
                        computedBeforeStyles = {};
                    }
                    
                    // Removed console.log to prevent performance issues
                    
                    // Set critical properties only (silently handle optional ones)
                    const criticalProps = [
                        { prop: 'position', value: 'fixed' },
                        { prop: 'bottom', value: '1rem' },
                        { prop: 'right', value: '1rem' },
                        { prop: 'top', value: 'auto' },
                        { prop: 'transform', value: 'none' },
                        { prop: 'left', value: 'auto' },
                        { prop: 'z-index', value: '99999' },
                    ];
                    
                    criticalProps.forEach(({ prop, value }) => {
                        try {
                            el.style.setProperty(prop, value, 'important');
                        } catch (error) {
                            // Silently handle errors
                        }
                    });
                    
                    // Set optional properties silently
                    try {
                        el.style.setProperty('margin', '0px', 'important');
                        el.style.setProperty('padding', '0px', 'important');
                        el.style.setProperty('max-height', 'calc(100vh - 2rem)', 'important');
                    } catch (error) {
                        // Ignore optional property errors
                    }
                    
                    let computedAfter: CSSStyleDeclaration;
                    let computedAfterStyles: any;
                    try {
                        computedAfter = window.getComputedStyle(el);
                        computedAfterStyles = {
                            position: computedAfter.position,
                            top: computedAfter.top,
                            right: computedAfter.right,
                            bottom: computedAfter.bottom,
                            left: computedAfter.left,
                            transform: computedAfter.transform,
                        };
                    } catch (error) {
                        // Silently handle errors to prevent console spam
                        computedAfterStyles = {};
                    }
                    
                    // Silently verify and fix position if needed
                    if (computedAfterStyles.bottom && computedAfterStyles.bottom !== '1rem' && computedAfterStyles.bottom !== 'auto') {
                        el.style.setProperty('bottom', '1rem', 'important');
                    }
                    if (computedAfterStyles.top && computedAfterStyles.top !== 'auto') {
                        el.style.setProperty('top', 'auto', 'important');
                    }
                    
                    // CRITICAL CHECK: Verify position is fixed
                    if (computedAfterStyles.position !== 'fixed') {
                        // Silently fix position
                        el.style.setProperty('position', 'fixed', 'important');
                    }
                } catch (error) {
                    // Silently handle errors to prevent console spam
                }
            } else {
                // Silently handle - ref not ready yet
            }
            
            // Removed console.log to prevent performance issues
            setIsActive(true);
            setError(null);
            // Removed console.log to prevent performance issues
            
            // Lock again after state change
            setTimeout(() => {
                try {
                    if (widgetRef.current) {
                        const el = widgetRef.current;
                        let computed: CSSStyleDeclaration;
                        let computedStyles: any;
                        try {
                            computed = window.getComputedStyle(el);
                            computedStyles = {
                                position: computed.position,
                                top: computed.top,
                                right: computed.right,
                                bottom: computed.bottom,
                                left: computed.left,
                                transform: computed.transform,
                            };
                        } catch (error) {
                            // Silently handle errors to prevent console spam
                            computedStyles = {};
                        }
                        
                        // Removed console.log to prevent performance issues
                        
                        // CRITICAL CHECK: If position changed, fix it silently
                        if (computedStyles.position !== 'fixed') {
                            el.style.setProperty('position', 'fixed', 'important');
                        }
                        if (computedStyles.bottom !== 'auto' && computedStyles.bottom !== '0px') {
                            el.style.setProperty('bottom', '1rem', 'important');
                        }
                        
                        // Set all properties with error handling
                        // Set critical properties only
                        const criticalProps = [
                            { prop: 'position', value: 'fixed' },
                            { prop: 'bottom', value: '1rem' },
                            { prop: 'right', value: '1rem' },
                            { prop: 'top', value: 'auto' },
                            { prop: 'transform', value: 'none' },
                            { prop: 'left', value: 'auto' },
                            { prop: 'z-index', value: '99999' },
                        ];
                        
                        criticalProps.forEach(({ prop, value }) => {
                            try {
                                el.style.setProperty(prop, value, 'important');
                            } catch (error) {
                                // Silently handle errors
                            }
                        });
                        
                        // Set optional properties silently
                        try {
                            el.style.setProperty('margin', '0px', 'important');
                            el.style.setProperty('padding', '0px', 'important');
                            el.style.setProperty('max-height', 'calc(100vh - 2rem)', 'important');
                        } catch (error) {
                            // Ignore optional property errors
                        }
                        
                        let computedAfter: CSSStyleDeclaration;
                        let computedAfterStyles: any;
                        try {
                            computedAfter = window.getComputedStyle(el);
                            computedAfterStyles = {
                                position: computedAfter.position,
                                top: computedAfter.top,
                                right: computedAfter.right,
                                bottom: computedAfter.bottom,
                                left: computedAfter.left,
                                transform: computedAfter.transform,
                            };
                        } catch (error) {
                            // Silently handle errors to prevent console spam
                            computedAfterStyles = {};
                        }
                        
                        // Silently verify position is correct (don't log unless critical)
                        
                        // CRITICAL CHECK: Fix position if not fixed
                        if (computedAfterStyles.position !== 'fixed') {
                            el.style.setProperty('position', 'fixed', 'important');
                        }
                        // Fix bottom if not 1rem
                        if (computedAfterStyles.bottom && computedAfterStyles.bottom !== '1rem' && computedAfterStyles.bottom !== 'auto') {
                            el.style.setProperty('bottom', '1rem', 'important');
                        }
                        // Fix top if not auto
                        if (computedAfterStyles.top && computedAfterStyles.top !== 'auto') {
                            el.style.setProperty('top', 'auto', 'important');
                        }
                        // Fix transform if not none
                        if (computedAfterStyles.transform && computedAfterStyles.transform !== 'none') {
                            el.style.setProperty('transform', 'none', 'important');
                        }
                    } else {
                        // Silently handle - ref not ready yet
                    }
                } catch (error) {
                    // Silently handle errors to prevent console spam
                }
            }, 0);
        } catch (err: any) {
            // Silently handle errors to prevent console spam
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Camera permission denied. Please enable camera access.');
            } else {
                setError(`Failed to start auto-brightness: ${err.message}`);
            }
            setIsActive(false);
        }
    };
    
    const toggleBrightness = async () => {
        if (isActive) {
            stopBrightness();
        } else {
            await startBrightness();
        }
    };
    
    // Always render UI (like EyeTracking), but show message if feature not enabled in settings
    const [mounted, setMounted] = useState(false);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    const widgetContent = showUI ? (
        <div 
            ref={widgetRef}
            // CRITICAL: Use fixed positioning at bottom-right - render via Portal to ensure it's outside scrolling containers
            style={{
                position: 'fixed',
                bottom: '1rem', // Bottom position - lowest widget (AutoBrightness)
                right: '1rem', // Stick to right
                top: 'auto', // Remove top to use bottom
                transform: 'none', // No transform needed for bottom positioning
                left: 'auto',
                zIndex: 99999, // Highest z-index to ensure it's always on top
                maxHeight: 'calc(100vh - 2rem)', // Prevent overflow
                willChange: 'transform',
                margin: 0,
                padding: 0,
                pointerEvents: 'auto',
            } as React.CSSProperties}
            onMouseEnter={() => {
                // Lock position on hover to prevent any shifts
                if (widgetRef.current) {
                    const el = widgetRef.current;
                    el.style.setProperty('position', 'fixed', 'important');
                    el.style.setProperty('bottom', '1rem', 'important');
                    el.style.setProperty('right', '1rem', 'important');
                    el.style.setProperty('top', 'auto', 'important');
                    el.style.setProperty('transform', 'none', 'important');
                    el.style.setProperty('left', 'auto', 'important');
                    el.style.setProperty('z-index', '99999', 'important');
                }
            }}
        >
                <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border-2 border-yellow-500/50 shadow-xl p-3 max-w-xs">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h3 className="text-white font-semibold text-sm">Auto Brightness</h3>
                            {!autoBrightnessEnabled && (
                                <p className="text-xs text-gray-400 mt-0.5">Enable in settings</p>
                            )}
                        </div>
                        <button
                            onClick={toggleBrightness}
                            disabled={!autoBrightnessEnabled || !isSupported}
                            className={`p-2 rounded-full transition-all ${
                                isActive
                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white animate-pulse'
                                    : autoBrightnessEnabled
                                    ? 'bg-slate-700 hover:bg-slate-600 text-gray-300'
                                    : 'bg-slate-800 text-gray-500'
                            } ${(!autoBrightnessEnabled || !isSupported) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={
                                !autoBrightnessEnabled 
                                    ? 'Enable auto-brightness from settings first'
                                    : !isSupported
                                    ? 'Not supported in this browser'
                                    : isActive 
                                    ? 'Stop auto-brightness' 
                                    : 'Start auto-brightness (will request camera permission)'
                            }
                        >
                            {isActive ? <FaSun /> : <FaMoon />}
                        </button>
                    </div>

                    {error && (
                        <div className="text-xs text-red-400 mb-2 p-2 bg-red-900/20 rounded">
                            {error}
                        </div>
                    )}
                    
                    {isActive && (
                        <div className="text-xs text-yellow-400 space-y-1">
                            <div className="flex justify-between">
                                <span>Brightness:</span>
                                <span className="font-bold">{(currentBrightness * 100).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1">
                                <div 
                                    className="bg-yellow-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${currentBrightness * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    
                    {!isActive && !error && (
                        <div className="text-xs text-gray-400">
                            Click to start detecting ambient light
                        </div>
                    )}
                </div>
                </div>
    ) : null;
    
    return (
        <>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
            />
            
            {/* Render widget via Portal to document.body to ensure it's outside any scrolling containers */}
            {mounted && typeof window !== 'undefined' && widgetContent && createPortal(
                widgetContent,
                document.body
            )}
        </>
    );
}

