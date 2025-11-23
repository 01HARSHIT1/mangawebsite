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
            // Enhanced ambient light detection with better scanning
            // Request permission for ambient light sensor
            if ('permissions' in navigator) {
                try {
                    const permission = await (navigator.permissions as any).query({ name: 'ambient-light-sensor' });
                    if (permission.state === 'denied') {
                        setError('Ambient light sensor permission denied');
                        useTimeBasedDetection();
                        return;
                    }
                } catch (permError) {
                    // Permission API might not support this query, continue anyway
                    console.log('Permission query not supported, trying sensor directly');
                }
            }

            // Create AmbientLightSensor (if supported)
            if ('AmbientLightSensor' in window) {
                const sensor = new (window as any).AmbientLightSensor({
                    frequency: 1 // Sample every second for better accuracy
                });
                
                // Enhanced reading with averaging for stability
                let readings: number[] = [];
                const maxReadings = 5; // Average last 5 readings
                
                sensor.onreading = () => {
                    const illuminance = sensor.illuminance;
                    
                    // Add to readings array
                    readings.push(illuminance);
                    if (readings.length > maxReadings) {
                        readings.shift();
                    }
                    
                    // Calculate average for smoother adjustments
                    const avgIlluminance = readings.reduce((sum, val) => sum + val, 0) / readings.length;
                    
                    setAmbientLight(avgIlluminance);
                    adjustBrightness(avgIlluminance);
                };

                sensor.onerror = (event: any) => {
                    console.error('Ambient light sensor error:', event.error);
                    setError('Failed to read ambient light. Using fallback.');
                    // Fallback to time-based detection
                    useTimeBasedDetection();
                };

                sensor.start();
                sensorRef.current = sensor;
            } else {
                // Fallback: Use enhanced time-based detection with screen analysis
                useEnhancedFallbackDetection();
            }
        } catch (err: any) {
            console.error('Failed to start light detection:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Permission denied. Using fallback detection.');
            } else {
                setError('Sensor not available. Using fallback detection.');
            }
            // Fallback to enhanced detection
            useEnhancedFallbackDetection();
        }
    };

    const useTimeBasedDetection = () => {
        // Fallback: Adjust based on time of day
        const hour = new Date().getHours();
        const isNight = hour >= 20 || hour < 6;
        
        setAmbientLight(isNight ? 10 : 500); // Simulated values
        adjustBrightness(isNight ? 10 : 500);
    };

    const useEnhancedFallbackDetection = () => {
        // Enhanced fallback: Time-based + screen brightness analysis
        const hour = new Date().getHours();
        
        // More nuanced time-based detection
        let estimatedLux = 500; // Default daylight
        
        if (hour >= 20 || hour < 6) {
            // Night time
            estimatedLux = 10;
        } else if (hour >= 18 || hour < 8) {
            // Dawn/Dusk
            estimatedLux = 200;
        } else if (hour >= 8 && hour < 12) {
            // Morning
            estimatedLux = 600;
        } else if (hour >= 12 && hour < 18) {
            // Afternoon (brightest)
            estimatedLux = 800;
        }
        
        // Try to detect screen brightness if available
        if ('screen' in window && (window.screen as any).brightness !== undefined) {
            const screenBrightness = (window.screen as any).brightness;
            // Adjust estimated lux based on screen brightness
            estimatedLux = estimatedLux * (0.5 + screenBrightness * 0.5);
        }
        
        setAmbientLight(estimatedLux);
        adjustBrightness(estimatedLux);
        
        // Update periodically
        const interval = setInterval(() => {
            const newHour = new Date().getHours();
            if (newHour !== hour) {
                useEnhancedFallbackDetection();
            }
        }, 60000); // Check every minute
        
        // Cleanup on unmount
        return () => clearInterval(interval);
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
        // Enhanced brightness adjustment optimized for manga reading
        // Scans environment light and adjusts screen brightness accordingly
        
        // Check if we have learned preference for this light level
        const luxKey = Math.round(illuminance / 10) * 10; // Round to nearest 10
        let brightness = userPreferences.preferredBrightness[luxKey];
        
        // If no learned preference, calculate based on light level
        if (brightness === undefined) {
            // Enhanced mapping for manga reading comfort
            // Low light (< 50 lux): Dim screen for night reading
            // Medium light (50-200 lux): Moderate brightness
            // High light (> 200 lux): Full brightness
            
            if (illuminance < 20) {
                // Very dark environment (night reading)
                brightness = Math.max(userPreferences.minBrightness, 30);
            } else if (illuminance < 50) {
                // Dark environment
                brightness = Math.max(userPreferences.minBrightness, 40);
            } else if (illuminance < 100) {
                // Low light
                brightness = 50;
            } else if (illuminance < 200) {
                // Medium light
                brightness = 60 + ((illuminance - 100) / 100) * 20; // 60-80%
            } else if (illuminance < 500) {
                // Bright environment
                brightness = 80 + ((illuminance - 200) / 300) * 15; // 80-95%
            } else {
                // Very bright environment (daylight)
                brightness = Math.min(userPreferences.maxBrightness, 100);
            }
            
            // Ensure within bounds
            brightness = Math.max(
                userPreferences.minBrightness,
                Math.min(userPreferences.maxBrightness, brightness)
            );
        }
        
        // Determine dark mode based on ambient light
        // Use threshold that's comfortable for manga reading
        const shouldBeDark = illuminance < 50;
        
        if (shouldBeDark !== isDarkMode) {
            setIsDarkMode(shouldBeDark);
            
            // Apply dark mode class smoothly
            if (shouldBeDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }

        // Apply brightness filter with smooth transition for manga reading
        // Use CSS filter for non-intrusive brightness adjustment
        const brightnessValue = brightness / 100;
        document.documentElement.style.transition = 'filter 0.5s ease-in-out';
        document.documentElement.style.filter = `brightness(${brightnessValue})`;
        
        // Also adjust contrast slightly for better manga readability
        const contrastValue = 0.95 + (brightness / 100) * 0.1; // Slight contrast adjustment
        document.documentElement.style.filter = `brightness(${brightnessValue}) contrast(${contrastValue})`;
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

