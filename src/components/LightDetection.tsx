'use client';

import { useState, useEffect, useRef } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
import { useAIFeatures } from '@/hooks/useAIFeatures';

interface LightDetectionProps {
    enabled?: boolean;
    showUI?: boolean;
}

export default function LightDetection({ enabled = false, showUI = true }: LightDetectionProps) {
    const { isFeatureEnabled } = useAIFeatures();
    const autoBrightnessEnabled = enabled || isFeatureEnabled('autoBrightness');
    
    const [isSupported, setIsSupported] = useState(false);
    const [ambientLight, setAmbientLight] = useState<number | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sensorRef = useRef<any>(null);

    useEffect(() => {
        // Check if AmbientLightSensor is supported
        if (typeof window !== 'undefined') {
            const hasAmbientLight = 'AmbientLightSensor' in window;
            setIsSupported(hasAmbientLight);
        }
    }, []);

    useEffect(() => {
        if (!autoBrightnessEnabled || !isSupported) {
            stopDetection();
            return;
        }

        if (autoBrightnessEnabled) {
            startDetection();
        }

        return () => {
            stopDetection();
        };
    }, [autoBrightnessEnabled, isSupported]);

    const startDetection = async () => {
        try {
            // Request permission for ambient light sensor
            if ('permissions' in navigator) {
                const permission = await (navigator.permissions as any).query({ name: 'ambient-light-sensor' });
                if (permission.state === 'denied') {
                    setError('Ambient light sensor permission denied');
                    return;
                }
            }

            // Create AmbientLightSensor (if supported)
            if ('AmbientLightSensor' in window) {
                const sensor = new (window as any).AmbientLightSensor();
                
                sensor.onreading = () => {
                    const illuminance = sensor.illuminance;
                    setAmbientLight(illuminance);
                    adjustBrightness(illuminance);
                };

                sensor.onerror = (event: any) => {
                    console.error('Ambient light sensor error:', event.error);
                    setError('Failed to read ambient light');
                };

                sensor.start();
                sensorRef.current = sensor;
            } else {
                // Fallback: Use screen brightness API or time-based detection
                useTimeBasedDetection();
            }
        } catch (err: any) {
            console.error('Failed to start light detection:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Permission denied. Please enable ambient light sensor access.');
            } else {
                setError('Failed to start light detection');
                // Fallback to time-based detection
                useTimeBasedDetection();
            }
        }
    };

    const useTimeBasedDetection = () => {
        // Fallback: Adjust based on time of day
        const hour = new Date().getHours();
        const isNight = hour >= 20 || hour < 6;
        
        setAmbientLight(isNight ? 10 : 500); // Simulated values
        adjustBrightness(isNight ? 10 : 500);
    };

    const adjustBrightness = (illuminance: number) => {
        // Adjust screen brightness based on ambient light
        // Low light (< 50 lux) = darker theme
        // High light (> 200 lux) = lighter theme
        
        const shouldBeDark = illuminance < 50;
        
        if (shouldBeDark !== isDarkMode) {
            setIsDarkMode(shouldBeDark);
            
            // Apply dark mode class
            if (shouldBeDark) {
                document.documentElement.classList.add('dark');
                // Also adjust CSS filter for brightness
                document.documentElement.style.filter = 'brightness(0.9)';
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.style.filter = 'brightness(1.0)';
            }
        }

        // Adjust brightness filter based on light level
        if (illuminance < 20) {
            // Very dark - reduce brightness more
            document.documentElement.style.filter = 'brightness(0.8)';
        } else if (illuminance < 50) {
            // Dark - slightly reduce brightness
            document.documentElement.style.filter = 'brightness(0.9)';
        } else if (illuminance > 500) {
            // Very bright - increase brightness slightly
            document.documentElement.style.filter = 'brightness(1.1)';
        } else {
            // Normal - reset brightness
            document.documentElement.style.filter = 'brightness(1.0)';
        }
    };

    const stopDetection = () => {
        if (sensorRef.current) {
            try {
                sensorRef.current.stop();
            } catch (e) {
                // Ignore errors
            }
            sensorRef.current = null;
        }
        
        // Reset brightness
        document.documentElement.style.filter = '';
    };

    if (!showUI) {
        return null;
    }

    return (
        <div className="fixed bottom-44 right-4 z-50">
            <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border border-slate-700 shadow-xl p-4 max-w-sm">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">Auto Brightness</h3>
                    <div className={`p-2 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-yellow-500'}`}>
                        {isDarkMode ? <FaMoon className="text-white" /> : <FaSun className="text-white" />}
                    </div>
                </div>

                {error && (
                    <div className="text-xs text-red-400 mb-2 p-2 bg-red-900/20 rounded">
                        {error}
                    </div>
                )}

                {autoBrightnessEnabled && (
                    <div className="mb-2">
                        {isSupported ? (
                            <>
                                {ambientLight !== null ? (
                                    <div className="text-xs text-gray-400">
                                        Ambient light: {ambientLight.toFixed(0)} lux
                                    </div>
                                ) : (
                                    <div className="text-xs text-gray-400">
                                        Detecting ambient light...
                                    </div>
                                )}
                                <div className="text-xs text-blue-400 mt-1">
                                    Mode: {isDarkMode ? 'Dark' : 'Light'}
                                </div>
                            </>
                        ) : (
                            <div className="text-xs text-yellow-400">
                                Using time-based detection (sensor not available)
                            </div>
                        )}
                    </div>
                )}

                {!autoBrightnessEnabled && (
                    <div className="text-xs text-gray-400">
                        Enable in Settings → AI Features
                    </div>
                )}
            </div>
        </div>
    );
}

