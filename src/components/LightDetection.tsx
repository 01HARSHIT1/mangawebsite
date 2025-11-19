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

    // User preference learning
    const [userPreferences, setUserPreferences] = useState<{
        minBrightness: number;
        maxBrightness: number;
        preferredBrightness: { [lux: number]: number };
    }>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('lightDetectionPrefs');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    // Invalid data, use defaults
                }
            }
        }
        return {
            minBrightness: 20,
            maxBrightness: 100,
            preferredBrightness: {}
        };
    });

    // Save preferences to localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('lightDetectionPrefs', JSON.stringify(userPreferences));
        }
    }, [userPreferences]);

    const adjustBrightness = (illuminance: number) => {
        // Enhanced brightness adjustment with learning
        // Low light (< 50 lux) = darker theme, lower brightness
        // High light (> 200 lux) = lighter theme
        
        // Check if we have learned preference for this light level
        const luxKey = Math.round(illuminance / 10) * 10; // Round to nearest 10
        let brightness = userPreferences.preferredBrightness[luxKey];
        
        // If no learned preference, calculate based on light level
        if (brightness === undefined) {
            // Map illuminance (0-1000 lux) to brightness (20-100%)
            brightness = Math.max(
                userPreferences.minBrightness,
                Math.min(
                    userPreferences.maxBrightness,
                    20 + (illuminance / 1000) * 80
                )
            );
        }
        
        const shouldBeDark = illuminance < 50;
        
        if (shouldBeDark !== isDarkMode) {
            setIsDarkMode(shouldBeDark);
            
            // Apply dark mode class
            if (shouldBeDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }

        // Apply brightness filter with smooth transition
        const brightnessValue = brightness / 100;
        document.documentElement.style.transition = 'filter 0.3s ease-in-out';
        document.documentElement.style.filter = `brightness(${brightnessValue})`;
        
        // Learn from user adjustments (if user manually changes brightness, we'll learn it)
        // This can be triggered by user interaction
    };

    // Function to learn user preference (can be called when user manually adjusts)
    const learnPreference = (lux: number, brightness: number) => {
        const luxKey = Math.round(lux / 10) * 10;
        setUserPreferences(prev => ({
            ...prev,
            preferredBrightness: {
                ...prev.preferredBrightness,
                [luxKey]: brightness
            }
        }));
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

