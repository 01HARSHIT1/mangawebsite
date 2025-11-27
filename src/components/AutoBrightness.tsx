'use client';

import { useState, useEffect, useRef } from 'react';
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
                    
                    // Update brightness display periodically
                    const updateInterval = setInterval(() => {
                        if (autoBrightnessRef.current) {
                            const brightness = autoBrightnessRef.current.getCurrentBrightness();
                            setCurrentBrightness(brightness);
                        }
                    }, 500); // Update every 500ms
                    
                    // Store interval for cleanup
                    (autoBrightnessRef.current as any).updateInterval = updateInterval;
                } catch (error) {
                    console.warn('💡 Auto-Brightness: Failed to initialize', error);
                    setError('Failed to initialize brightness controller');
                }
            }

            setIsActive(true);
            setError(null);
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
    return (
        <>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="hidden"
            />
            
            {showUI && (
                <div 
                    className="fixed bottom-4 right-4 z-50"
                    style={{ 
                        zIndex: 9998, // Below eye tracking panel (which is at 9999)
                        position: 'fixed',
                        bottom: '1rem', // 1rem from bottom (EyeTracking is at 8rem = 32, so this is below it)
                        right: '1rem' // Same right position, will stack vertically
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
            )}
        </>
    );
}

