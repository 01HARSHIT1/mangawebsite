"use client";

import { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaMicrophone, FaMicrophoneSlash, FaSun, FaMoon, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAIFeatures } from '@/hooks/useAIFeatures';

interface AIFeatureTogglesProps {
    position?: 'fixed' | 'absolute';
}

export default function AIFeatureToggles({ position = 'fixed' }: AIFeatureTogglesProps) {
    const { aiPreferences, updatePreference, isFeatureEnabled } = useAIFeatures();
    const [isMounted, setIsMounted] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Check if mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
            // Auto-collapse on mobile
            if (window.innerWidth < 768) {
                setIsCollapsed(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Get current states
    const eyeTrackingEnabled = isFeatureEnabled('eyeTracking');
    const voiceAssistantEnabled = isFeatureEnabled('voiceAssistant');
    const autoBrightnessEnabled = isFeatureEnabled('autoBrightness');

    const toggleEyeTracking = async () => {
        const newValue = !eyeTrackingEnabled;
        await updatePreference('eyeTracking', newValue);
        // Also toggle auto-scroll if eye tracking is enabled
        if (newValue) {
            await updatePreference('autoScroll', true);
        }
    };

    const toggleVoiceAssistant = async () => {
        const newValue = !voiceAssistantEnabled;
        await updatePreference('voiceAssistant', newValue);
        if (newValue) {
            await updatePreference('voiceCommands', true);
        }
    };

    const toggleAutoBrightness = async () => {
        const newValue = !autoBrightnessEnabled;
        await updatePreference('autoBrightness', newValue);
        if (newValue) {
            await updatePreference('ambientLightDetection', true);
        }
    };

    if (!isMounted) {
        return null;
    }

    if (!isMounted) {
        return null;
    }

    return (
        <div className={`${position} top-4 right-4 z-50 flex flex-col gap-3 transition-all duration-300`}>
            {/* Collapse/Expand Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="self-end mb-2 p-2 bg-slate-800/90 backdrop-blur-md rounded-lg border border-slate-700 hover:bg-slate-700/90 transition-all text-gray-400 hover:text-white"
                title={isCollapsed ? 'Expand AI Features' : 'Collapse AI Features'}
            >
                {isCollapsed ? <FaChevronLeft /> : <FaChevronRight />}
            </button>

            {!isCollapsed && (
                <>
            {/* Eye Tracking Toggle */}
            <button
                onClick={toggleEyeTracking}
                className={`
                    group relative flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg
                    backdrop-blur-md border-2 transition-all duration-300
                    shadow-lg hover:shadow-xl transform hover:scale-105
                    min-w-[200px] md:min-w-[240px]
                    ${eyeTrackingEnabled
                        ? 'bg-green-500/20 border-green-400/50 text-green-300 hover:bg-green-500/30'
                        : 'bg-slate-800/80 border-slate-600/50 text-gray-400 hover:bg-slate-700/80'
                    }
                `}
                title={eyeTrackingEnabled ? 'Disable Eye Tracking' : 'Enable Eye Tracking'}
            >
                <div className={`
                    p-1.5 md:p-2 rounded-full transition-all flex-shrink-0
                    ${eyeTrackingEnabled ? 'bg-green-500/30' : 'bg-slate-700/50'}
                `}>
                    {eyeTrackingEnabled ? (
                        <FaEye className="text-green-400 text-base md:text-lg" />
                    ) : (
                        <FaEyeSlash className="text-gray-500 text-base md:text-lg" />
                    )}
                </div>
                <div className="flex flex-col items-start flex-grow min-w-0">
                    <span className="text-xs md:text-sm font-semibold truncate w-full">
                        Eye Tracking
                    </span>
                    <span className="text-xs opacity-75">
                        {eyeTrackingEnabled ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div className={`
                    ml-auto w-10 md:w-12 h-5 md:h-6 rounded-full transition-all duration-300 relative flex-shrink-0
                    ${eyeTrackingEnabled ? 'bg-green-500' : 'bg-slate-600'}
                `}>
                    <div className={`
                        absolute top-0.5 left-0.5 w-4 md:w-5 h-4 md:h-5 bg-white rounded-full
                        transition-transform duration-300 shadow-md
                        ${eyeTrackingEnabled ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}
                    `} />
                </div>
            </button>

            {/* Voice Assistant Toggle */}
            <button
                onClick={toggleVoiceAssistant}
                className={`
                    group relative flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg
                    backdrop-blur-md border-2 transition-all duration-300
                    shadow-lg hover:shadow-xl transform hover:scale-105
                    min-w-[200px] md:min-w-[240px]
                    ${voiceAssistantEnabled
                        ? 'bg-blue-500/20 border-blue-400/50 text-blue-300 hover:bg-blue-500/30'
                        : 'bg-slate-800/80 border-slate-600/50 text-gray-400 hover:bg-slate-700/80'
                    }
                `}
                title={voiceAssistantEnabled ? 'Disable Voice Assistant' : 'Enable Voice Assistant'}
            >
                <div className={`
                    p-1.5 md:p-2 rounded-full transition-all flex-shrink-0
                    ${voiceAssistantEnabled ? 'bg-blue-500/30' : 'bg-slate-700/50'}
                `}>
                    {voiceAssistantEnabled ? (
                        <FaMicrophone className="text-blue-400 text-base md:text-lg" />
                    ) : (
                        <FaMicrophoneSlash className="text-gray-500 text-base md:text-lg" />
                    )}
                </div>
                <div className="flex flex-col items-start flex-grow min-w-0">
                    <span className="text-xs md:text-sm font-semibold truncate w-full">
                        Voice Assistant
                    </span>
                    <span className="text-xs opacity-75">
                        {voiceAssistantEnabled ? 'Listening' : 'Off'}
                    </span>
                </div>
                <div className={`
                    ml-auto w-10 md:w-12 h-5 md:h-6 rounded-full transition-all duration-300 relative flex-shrink-0
                    ${voiceAssistantEnabled ? 'bg-blue-500' : 'bg-slate-600'}
                `}>
                    <div className={`
                        absolute top-0.5 left-0.5 w-4 md:w-5 h-4 md:h-5 bg-white rounded-full
                        transition-transform duration-300 shadow-md
                        ${voiceAssistantEnabled ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}
                    `} />
                </div>
            </button>

            {/* Auto Brightness Toggle */}
            <button
                onClick={toggleAutoBrightness}
                className={`
                    group relative flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg
                    backdrop-blur-md border-2 transition-all duration-300
                    shadow-lg hover:shadow-xl transform hover:scale-105
                    min-w-[200px] md:min-w-[240px]
                    ${autoBrightnessEnabled
                        ? 'bg-yellow-500/20 border-yellow-400/50 text-yellow-300 hover:bg-yellow-500/30'
                        : 'bg-slate-800/80 border-slate-600/50 text-gray-400 hover:bg-slate-700/80'
                    }
                `}
                title={autoBrightnessEnabled ? 'Disable Auto Brightness' : 'Enable Auto Brightness'}
            >
                <div className={`
                    p-1.5 md:p-2 rounded-full transition-all flex-shrink-0
                    ${autoBrightnessEnabled ? 'bg-yellow-500/30' : 'bg-slate-700/50'}
                `}>
                    {autoBrightnessEnabled ? (
                        <FaSun className="text-yellow-400 text-base md:text-lg" />
                    ) : (
                        <FaMoon className="text-gray-500 text-base md:text-lg" />
                    )}
                </div>
                <div className="flex flex-col items-start flex-grow min-w-0">
                    <span className="text-xs md:text-sm font-semibold truncate w-full">
                        Auto Brightness
                    </span>
                    <span className="text-xs opacity-75">
                        {autoBrightnessEnabled ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div className={`
                    ml-auto w-10 md:w-12 h-5 md:h-6 rounded-full transition-all duration-300 relative flex-shrink-0
                    ${autoBrightnessEnabled ? 'bg-yellow-500' : 'bg-slate-600'}
                `}>
                    <div className={`
                        absolute top-0.5 left-0.5 w-4 md:w-5 h-4 md:h-5 bg-white rounded-full
                        transition-transform duration-300 shadow-md
                        ${autoBrightnessEnabled ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}
                    `} />
                </div>
            </button>
                </>
            )}
        </div>
    );
}

