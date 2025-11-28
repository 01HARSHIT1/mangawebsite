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
    
    // Check if browser supports camera
    useEffect(() => {
        setIsSupported(
            typeof navigator !== 'undefined' &&
            !!navigator.mediaDevices &&
            !!navigator.mediaDevices.getUserMedia
        );
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
    
    // CRITICAL: Lock position - use MutationObserver to prevent ANY style changes
    useEffect(() => {
        // Wait for ref to be set
        const setupPositionLock = () => {
            if (!widgetRef.current) {
                // Retry if ref not ready
                setTimeout(setupPositionLock, 10);
                return;
            }
            
            const el = widgetRef.current;
            const lockPosition = (source: string) => {
                try {
                    if (!el) {
                        console.warn('🔒 Auto-Brightness Position Lock: Element not found', { source });
                        return;
                    }
                    
                    // Get current computed styles BEFORE locking
                    let computedBefore: CSSStyleDeclaration;
                    let beforePosition: any;
                    try {
                        computedBefore = window.getComputedStyle(el);
                        beforePosition = {
                            position: computedBefore.position,
                            top: computedBefore.top,
                            right: computedBefore.right,
                            bottom: computedBefore.bottom,
                            left: computedBefore.left,
                            transform: computedBefore.transform,
                        };
                    } catch (error) {
                        console.error('🔒 Auto-Brightness Position Lock: ERROR getting computed styles before lock', {
                            error,
                            source,
                            errorMessage: error instanceof Error ? error.message : String(error),
                        });
                        beforePosition = {};
                    }
                    
                    // Lock position silently (only log errors)
                    
                    // Force position to stay fixed - override any other styles
                    // Use setProperty with 'important' flag (cssText doesn't support !important)
                    // CRITICAL properties for positioning (must succeed)
                    const criticalProperties = [
                        { prop: 'position', value: 'fixed' },
                        { prop: 'top', value: '50%' },
                        { prop: 'right', value: '1rem' },
                        { prop: 'transform', value: 'translateY(-50%)' },
                        { prop: 'bottom', value: 'auto' },
                        { prop: 'left', value: 'auto' },
                        { prop: 'z-index', value: '9998' },
                    ];
                    
                    // Optional properties (won't fail if they don't set)
                    const optionalProperties = [
                        { prop: 'margin', value: '0px' },
                        { prop: 'padding', value: '0px' },
                        { prop: 'max-height', value: 'calc(100vh - 2rem)' },
                    ];
                    
                    // Set critical properties (must succeed)
                    const criticalFailed: string[] = [];
                    criticalProperties.forEach(({ prop, value }) => {
                        try {
                            el.style.setProperty(prop, value, 'important');
                            // Verify it was set
                            const actualValue = el.style.getPropertyValue(prop);
                            const actualPriority = el.style.getPropertyPriority(prop);
                            if (actualValue !== value || actualPriority !== 'important') {
                                criticalFailed.push(prop);
                            }
                        } catch (error) {
                            criticalFailed.push(prop);
                        }
                    });
                    
                    // Set optional properties (silently fail)
                    optionalProperties.forEach(({ prop, value }) => {
                        try {
                            el.style.setProperty(prop, value, 'important');
                        } catch (error) {
                            // Silently ignore optional property failures
                        }
                    });
                    
                    // Only log if critical properties failed
                    if (criticalFailed.length > 0) {
                        console.warn('🔒 Auto-Brightness Position Lock: Some critical properties failed', {
                            failed: criticalFailed,
                            source,
                        });
                    }
                    
                    // Get computed styles AFTER locking
                    let computedAfter: CSSStyleDeclaration;
                    let afterPosition: any;
                    try {
                        computedAfter = window.getComputedStyle(el);
                        afterPosition = {
                            position: computedAfter.position,
                            top: computedAfter.top,
                            right: computedAfter.right,
                            bottom: computedAfter.bottom,
                            left: computedAfter.left,
                            transform: computedAfter.transform,
                        };
                    } catch (error) {
                        console.error('🔒 Auto-Brightness Position Lock: ERROR getting computed styles after lock', {
                            error,
                            source,
                            errorMessage: error instanceof Error ? error.message : String(error),
                        });
                        afterPosition = {};
                    }
                    
                    // Check if position actually changed
                    if (beforePosition && afterPosition) {
                        if (beforePosition.bottom !== afterPosition.bottom || beforePosition.top !== afterPosition.top) {
                            // Silently fix position if changed
                            if (afterPosition.bottom && afterPosition.bottom !== '1rem' && afterPosition.bottom !== 'auto') {
                                el.style.setProperty('bottom', '1rem', 'important');
                            }
                            if (afterPosition.top && afterPosition.top !== 'auto') {
                                el.style.setProperty('top', 'auto', 'important');
                            }
                        }
                        // Position locked - no need to log success
                        
                        // CRITICAL CHECK: Verify the position is actually fixed
                        if (afterPosition.position !== 'fixed') {
                            console.error('🔒 Auto-Brightness Position Lock: CRITICAL ERROR - Position is NOT fixed!', {
                                expected: 'fixed',
                                actual: afterPosition.position,
                                source,
                                allStyles: {
                                    position: afterPosition.position,
                                    top: afterPosition.top,
                                    bottom: afterPosition.bottom,
                                    right: afterPosition.right,
                                    left: afterPosition.left,
                                },
                                inlineStyle: el.style.cssText,
                            });
                        }
                        
                        // CRITICAL CHECK: Verify bottom is auto (not set to a value)
                        // Only warn if it's a significant value (ignore 0px which is effectively auto)
                        if (afterPosition.bottom && afterPosition.bottom !== 'auto' && afterPosition.bottom !== '0px') {
                            // Try to fix it
                            el.style.setProperty('bottom', 'auto', 'important');
                            // Don't log as error - just fix it silently
                        }
                    }
                } catch (error) {
                    console.error('🔒 Auto-Brightness Position Lock: EXCEPTION in lockPosition function', {
                        error,
                        source,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        errorStack: error instanceof Error ? error.stack : undefined,
                        element: el,
                        elementExists: !!el,
                    });
                }
            };
            
            // Lock immediately
            lockPosition('initial-setup');
            
            // Use MutationObserver to watch for ANY style/class changes and revert them
            let observer: MutationObserver | null = null;
            try {
                observer = new MutationObserver((mutations) => {
                    try {
                        mutations.forEach((mutation) => {
                            if (mutation.type === 'attributes') {
                                if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
                                    const el = mutation.target as HTMLElement;
                                    let computed: CSSStyleDeclaration;
                                    let currentPosition: any;
                                    try {
                                        computed = window.getComputedStyle(el);
                                        currentPosition = {
                                            position: computed.position,
                                            top: computed.top,
                                            right: computed.right,
                                            bottom: computed.bottom,
                                            left: computed.left,
                                            transform: computed.transform,
                                        };
                                    } catch (error) {
                                        console.error('🔒 Auto-Brightness Position Lock: ERROR getting computed styles in MutationObserver', {
                                            error,
                                            errorMessage: error instanceof Error ? error.message : String(error),
                                        });
                                        currentPosition = {};
                                    }
                                    
                                    // Silently fix position if changed
                                    if (currentPosition.bottom && currentPosition.bottom !== 'auto' && currentPosition.bottom !== '0px') {
                                        el.style.setProperty('bottom', 'auto', 'important');
                                    }
                                    if (currentPosition.position && currentPosition.position !== 'fixed') {
                                        el.style.setProperty('position', 'fixed', 'important');
                                    }
                                    
                                    // Style or class was changed - immediately lock it back
                                    lockPosition('mutation-observer');
                                }
                            }
                        });
                    } catch (error) {
                        console.error('🔒 Auto-Brightness Position Lock: EXCEPTION in MutationObserver callback', {
                            error,
                            errorMessage: error instanceof Error ? error.message : String(error),
                            errorStack: error instanceof Error ? error.stack : undefined,
                        });
                    }
                });
            } catch (error) {
                console.error('🔒 Auto-Brightness Position Lock: EXCEPTION creating MutationObserver', {
                    error,
                    errorMessage: error instanceof Error ? error.message : String(error),
                    errorStack: error instanceof Error ? error.stack : undefined,
                });
            }
            
            if (observer) {
                try {
                    observer.observe(el, {
                        attributes: true,
                        attributeFilter: ['style', 'class'],
                        childList: false,
                        subtree: false,
                        attributeOldValue: true, // Track old values for debugging
                    });
                    // MutationObserver set up silently
                } catch (error) {
                    console.error('🔒 Auto-Brightness Position Lock: EXCEPTION observing element', {
                        error,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        errorStack: error instanceof Error ? error.stack : undefined,
                    });
                }
            }
            
            // Also lock periodically as backup (every 100ms - less aggressive)
            let intervalId: NodeJS.Timeout | null = null;
            try {
                intervalId = setInterval(() => {
                    try {
                        const computed = window.getComputedStyle(el);
                        // Silently fix position if needed (don't log unless critical)
                        if (computed.position !== 'fixed') {
                            el.style.setProperty('position', 'fixed', 'important');
                        }
                        if (computed.bottom && computed.bottom !== 'auto' && computed.bottom !== '0px') {
                            el.style.setProperty('bottom', 'auto', 'important');
                        }
                        // Lock position silently
                        lockPosition('interval-check');
                    } catch (error) {
                        // Silently handle interval errors
                    }
                }, 100); // Reduced frequency from 5ms to 100ms
            } catch (error) {
                console.error('🔒 Auto-Brightness Position Lock: EXCEPTION creating interval', {
                    error,
                    errorMessage: error instanceof Error ? error.message : String(error),
                });
            }
            
            // Lock after any potential re-render
            const timeoutId = setTimeout(() => lockPosition('timeout'), 0);
            const rafId = requestAnimationFrame(() => {
                lockPosition('raf-1');
                requestAnimationFrame(() => lockPosition('raf-2'));
            });
            
            // Store cleanup function
            (el as any)._positionLockCleanup = () => {
                try {
                    console.log('🔒 Auto-Brightness Position Lock: Cleaning up', { isActive });
                    if (observer) {
                        observer.disconnect();
                    }
                    if (intervalId) {
                        clearInterval(intervalId);
                    }
                    if (timeoutId) {
                        clearTimeout(timeoutId);
                    }
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                    }
                } catch (error) {
                    console.error('🔒 Auto-Brightness Position Lock: EXCEPTION during cleanup', {
                        error,
                        errorMessage: error instanceof Error ? error.message : String(error),
                    });
                }
            };
        };
        
        setupPositionLock();
        
        return () => {
            // Cleanup
            if (widgetRef.current && (widgetRef.current as any)._positionLockCleanup) {
                (widgetRef.current as any)._positionLockCleanup();
            }
        };
    }, [isActive, showUI]); // Run whenever isActive or showUI changes
    
    const startBrightness = async () => {
        try {
            if (!videoRef.current) {
                setError('Video element not available');
                return;
            }

            console.log('💡 Auto-Brightness: Requesting camera access...');
            
            // Request camera access
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 320 },
                    height: { ideal: 240 }
                }
            });

            streamRef.current = stream;
            console.log('✅ Auto-Brightness: Camera access granted');

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                console.log('✅ Auto-Brightness: Video stream started');
                
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
                    console.log('💡 Auto-Brightness: Started');
                    
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
                    console.warn('💡 Auto-Brightness: Failed to initialize', error);
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
                        console.error('🔒 Auto-Brightness Position Lock: ERROR getting computed styles before setIsActive', {
                            error,
                            errorMessage: error instanceof Error ? error.message : String(error),
                        });
                        computedBeforeStyles = {};
                    }
                    
                    console.log('🔒 Auto-Brightness Position Lock: BEFORE setIsActive(true)', {
                        computedBefore: computedBeforeStyles,
                        inlineStyle: el.style.cssText,
                    });
                    
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
                        console.error('🔒 Auto-Brightness Position Lock: ERROR getting computed styles after setting', {
                            error,
                            errorMessage: error instanceof Error ? error.message : String(error),
                        });
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
                        console.error('🔒 Auto-Brightness Position Lock: CRITICAL ERROR - Position NOT fixed before setIsActive!', {
                            expected: 'fixed',
                            actual: computedAfterStyles.position,
                            allStyles: computedAfterStyles,
                        });
                    }
                } catch (error) {
                    console.error('🔒 Auto-Brightness Position Lock: EXCEPTION in position lock before setIsActive', {
                        error,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        errorStack: error instanceof Error ? error.stack : undefined,
                    });
                }
            } else {
                console.error('🔒 Auto-Brightness Position Lock: widgetRef.current is NULL before setIsActive!');
            }
            
            console.log('🔒 Auto-Brightness Position Lock: About to call setIsActive(true)');
            setIsActive(true);
            setError(null);
            console.log('🔒 Auto-Brightness Position Lock: setIsActive(true) called');
            
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
                            console.error('🔒 Auto-Brightness Position Lock: ERROR getting computed styles in setTimeout', {
                                error,
                                errorMessage: error instanceof Error ? error.message : String(error),
                            });
                            computedStyles = {};
                        }
                        
                        console.log('🔒 Auto-Brightness Position Lock: After setIsActive, in setTimeout', {
                            computed: computedStyles,
                            inlineStyle: el.style.cssText,
                            isActive,
                        });
                        
                        // CRITICAL CHECK: If position changed, log it
                        if (computedStyles.position !== 'fixed') {
                            console.error('🔒 Auto-Brightness Position Lock: CRITICAL - Position changed after setIsActive!', {
                                expected: 'fixed',
                                actual: computedStyles.position,
                                allStyles: computedStyles,
                            });
                        }
                        if (computedStyles.bottom !== 'auto' && computedStyles.bottom !== '0px') {
                            console.error('🔒 Auto-Brightness Position Lock: CRITICAL - Bottom changed after setIsActive!', {
                                expected: 'auto',
                                actual: computedStyles.bottom,
                                allStyles: computedStyles,
                            });
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
                            console.error('🔒 Auto-Brightness Position Lock: ERROR getting computed styles after setTimeout lock', {
                                error,
                                errorMessage: error instanceof Error ? error.message : String(error),
                            });
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
                        console.error('🔒 Auto-Brightness Position Lock: widgetRef.current is NULL in setTimeout!');
                    }
                } catch (error) {
                    console.error('🔒 Auto-Brightness Position Lock: EXCEPTION in setTimeout', {
                        error,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        errorStack: error instanceof Error ? error.stack : undefined,
                    });
                }
            }, 0);
        } catch (err: any) {
            console.error('Failed to start auto-brightness:', err);
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
                bottom: '1rem', // Stick to bottom
                right: '1rem', // Stick to right
                top: 'auto', // Remove top to use bottom
                transform: 'none', // No transform needed for bottom positioning
                left: 'auto',
                zIndex: 99999, // Very high z-index to ensure it's always on top
                maxHeight: 'calc(100vh - 2rem)',
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

