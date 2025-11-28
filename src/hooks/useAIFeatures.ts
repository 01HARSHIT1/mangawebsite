import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_AI_PREFERENCES, type UserAIPreferences } from '@/lib/ai-features-config';

export function useAIFeatures() {
    const { isAuthenticated } = useAuth();
    const [preferences, setPreferences] = useState<Partial<UserAIPreferences>>(DEFAULT_AI_PREFERENCES);
    const [loading, setLoading] = useState(true);
    const fetchingRef = useRef(false);

    const loadPreferences = useCallback(async () => {
        // Prevent multiple simultaneous fetches
        if (fetchingRef.current) return;
        
        fetchingRef.current = true;
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setPreferences(DEFAULT_AI_PREFERENCES);
                setLoading(false);
                return;
            }

            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const response = await fetch('/api/user/ai-preferences', {
                headers: { Authorization: `Bearer ${token}` },
                signal: controller.signal
            });

            if (response.ok) {
                const data = await response.json();
                if (data.preferences) {
                    setPreferences(data.preferences);
                }
            }
            clearTimeout(timeoutId);
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                // Silently handle errors - don't log to prevent console spam
            }
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            loadPreferences();
        } else {
            setPreferences(DEFAULT_AI_PREFERENCES);
            setLoading(false);
        }
    }, [isAuthenticated, loadPreferences]);

    const updatePreference = async (feature: keyof UserAIPreferences, value: boolean) => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                console.warn('No token found, cannot update preferences');
                return;
            }

            // Update local state immediately for responsive UI
            setPreferences(prev => ({
                ...prev,
                [feature]: value
            }));

            // Save to server
            const response = await fetch('/api/user/ai-preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    [feature]: value
                })
            });

            if (!response.ok) {
                // Revert on error
                setPreferences(prev => ({
                    ...prev,
                    [feature]: !value
                }));
                console.error('Failed to update preference');
            }
        } catch (error) {
            console.error('Error updating preference:', error);
            // Revert on error
            setPreferences(prev => ({
                ...prev,
                [feature]: !value
            }));
        }
    };

    // Memoize isFeatureEnabled to prevent unnecessary recalculations
    const isFeatureEnabled = useCallback((feature: keyof UserAIPreferences) => {
        return preferences[feature] ?? DEFAULT_AI_PREFERENCES[feature] ?? false;
    }, [preferences]);

    return {
        aiPreferences: preferences,
        preferences,
        loading,
        updatePreference,
        isFeatureEnabled,
        voiceAssistantEnabled: isFeatureEnabled('voiceAssistant'),
        eyeTrackingEnabled: isFeatureEnabled('eyeTracking'),
        autoBrightnessEnabled: isFeatureEnabled('autoBrightness'),
    };
}

