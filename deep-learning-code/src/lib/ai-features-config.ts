// AI Features Configuration and Management
// This file manages all AI-powered features and their settings

export interface AIFeatureConfig {
    id: string;
    name: string;
    description: string;
    category: 'reading' | 'discovery' | 'accessibility' | 'analytics';
    enabled: boolean;
    requiresPermission?: boolean;
    icon: string;
}

export interface UserAIPreferences {
    userId: string;
    // Recommendation System
    smartRecommendations: boolean;
    personalizedFiltering: boolean;
    excludeDislikedManga: boolean;
    
    // Search
    semanticSearch: boolean;
    naturalLanguageSearch: boolean;
    
    // Voice Features
    voiceAssistant: boolean;
    voiceCommands: boolean;
    
    // Eye Tracking
    eyeTracking: boolean;
    autoScroll: boolean;
    
    // Light Detection
    autoBrightness: boolean;
    ambientLightDetection: boolean;
    
    // Reading Enhancements
    smartPanelFlow: boolean;
    chapterSummaries: boolean;
    previouslyOnRecap: boolean;
    
    // Analytics
    readingStats: boolean;
    behaviorTracking: boolean;
    
    // Discovery
    moodBasedDiscovery: boolean;
    similarityEngine: boolean;
    
    // Privacy
    dataCollectionConsent: boolean;
    
    updatedAt: Date;
}

export const AI_FEATURES: AIFeatureConfig[] = [
    {
        id: 'smart-recommendations',
        name: 'Smart Recommendations',
        description: 'AI-powered personalized manga recommendations based on your reading history',
        category: 'discovery',
        enabled: true,
        icon: 'brain'
    },
    {
        id: 'semantic-search',
        name: 'Semantic Search',
        description: 'Search manga using natural language (e.g., "manga with strong female lead")',
        category: 'discovery',
        enabled: true,
        icon: 'search'
    },
    {
        id: 'voice-assistant',
        name: 'Voice Assistant',
        description: 'Control reading with voice commands (e.g., "next page", "bookmark this")',
        category: 'accessibility',
        enabled: false,
        requiresPermission: true,
        icon: 'microphone'
    },
    {
        id: 'eye-tracking',
        name: 'Eye Tracking Auto-Scroll',
        description: 'Automatically scroll based on your eye movement (requires camera permission)',
        category: 'reading',
        enabled: false,
        requiresPermission: true,
        icon: 'eye'
    },
    {
        id: 'auto-brightness',
        name: 'Auto Brightness',
        description: 'Automatically adjust screen brightness based on ambient light',
        category: 'reading',
        enabled: false,
        requiresPermission: true,
        icon: 'sun'
    },
    {
        id: 'personalized-filtering',
        name: 'Personalized Filtering',
        description: 'Hide manga you\'ve disliked or discontinued from recommendations',
        category: 'discovery',
        enabled: true,
        icon: 'filter'
    },
    {
        id: 'chapter-summaries',
        name: 'Chapter Summaries',
        description: 'AI-generated summaries for each chapter',
        category: 'reading',
        enabled: true,
        icon: 'file-text'
    },
    {
        id: 'previously-on',
        name: 'Previously On...',
        description: 'Get AI-generated recaps when returning to a manga',
        category: 'reading',
        enabled: true,
        icon: 'history'
    },
    {
        id: 'mood-discovery',
        name: 'Mood-Based Discovery',
        description: 'Find manga based on your current mood (funny, dark, emotional, etc.)',
        category: 'discovery',
        enabled: true,
        icon: 'heart'
    },
    {
        id: 'reading-stats',
        name: 'Reading Statistics',
        description: 'Track your reading habits, streaks, and achievements',
        category: 'analytics',
        enabled: true,
        icon: 'chart'
    }
];

export const DEFAULT_AI_PREFERENCES: Omit<UserAIPreferences, 'userId' | 'updatedAt'> = {
    smartRecommendations: true,
    personalizedFiltering: true,
    excludeDislikedManga: true,
    semanticSearch: true,
    naturalLanguageSearch: true,
    voiceAssistant: false,
    voiceCommands: false,
    eyeTracking: false,
    autoScroll: false,
    autoBrightness: false,
    ambientLightDetection: false,
    smartPanelFlow: false,
    chapterSummaries: true,
    previouslyOnRecap: true,
    readingStats: true,
    behaviorTracking: true,
    moodBasedDiscovery: true,
    similarityEngine: true,
    dataCollectionConsent: false
};

// Check if a feature is enabled for a user
export function isFeatureEnabled(userPreferences: Partial<UserAIPreferences>, featureId: string): boolean {
    const feature = AI_FEATURES.find(f => f.id === featureId);
    if (!feature) return false;
    
    switch (featureId) {
        case 'smart-recommendations':
            return userPreferences.smartRecommendations ?? DEFAULT_AI_PREFERENCES.smartRecommendations;
        case 'semantic-search':
            return userPreferences.semanticSearch ?? DEFAULT_AI_PREFERENCES.semanticSearch;
        case 'voice-assistant':
            return userPreferences.voiceAssistant ?? DEFAULT_AI_PREFERENCES.voiceAssistant;
        case 'eye-tracking':
            return userPreferences.eyeTracking ?? DEFAULT_AI_PREFERENCES.eyeTracking;
        case 'auto-brightness':
            return userPreferences.autoBrightness ?? DEFAULT_AI_PREFERENCES.autoBrightness;
        case 'personalized-filtering':
            return userPreferences.personalizedFiltering ?? DEFAULT_AI_PREFERENCES.personalizedFiltering;
        case 'chapter-summaries':
            return userPreferences.chapterSummaries ?? DEFAULT_AI_PREFERENCES.chapterSummaries;
        case 'previously-on':
            return userPreferences.previouslyOnRecap ?? DEFAULT_AI_PREFERENCES.previouslyOnRecap;
        case 'mood-discovery':
            return userPreferences.moodBasedDiscovery ?? DEFAULT_AI_PREFERENCES.moodBasedDiscovery;
        case 'reading-stats':
            return userPreferences.readingStats ?? DEFAULT_AI_PREFERENCES.readingStats;
        default:
            return false;
    }
}

