import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_AI_PREFERENCES, type UserAIPreferences } from '@/lib/ai-features-config';

export function useAIFeatures() {
    const { isAuthenticated } = useAuth();
    const [preferences, setPreferences] = useState<Partial<UserAIPreferences>>(DEFAULT_AI_PREFERENCES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            loadPreferences();
        } else {
            setPreferences(DEFAULT_AI_PREFERENCES);
            setLoading(false);
        }
    }, [isAuthenticated]);

    const loadPreferences = async () => {
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setPreferences(DEFAULT_AI_PREFERENCES);
                setLoading(false);
                return;
            }

            const response = await fetch('/api/user/ai-preferences', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.preferences) {
                    setPreferences(data.preferences);
                }
            }
        } catch (error) {
            console.error('Failed to load AI preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    return {
        preferences,
        loading,
        isFeatureEnabled: (feature: keyof UserAIPreferences) => {
            return preferences[feature] ?? DEFAULT_AI_PREFERENCES[feature] ?? false;
        }
    };
}

