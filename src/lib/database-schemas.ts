/**
 * Database Schema Definitions for Streaming Platform
 * This file documents the MongoDB collections and their schemas
 */

// User Schema (existing - extended)
export interface User {
    _id: string;
    email: string;
    username: string;
    password?: string; // Hashed
    role: 'user' | 'creator' | 'admin';
    isCreator: boolean;
    coins?: number;
    subscription?: {
        planId: string;
        planName: 'free' | 'premium' | 'premium_plus';
        status: 'active' | 'cancelled' | 'expired';
        startsAt: Date;
        endsAt?: Date;
        paymentProviderId?: string;
        region?: string;
    };
    preferences?: {
        language?: string;
        subtitleLanguage?: string;
        defaultQuality?: 'auto' | '1080p' | '720p' | '480p' | '360p';
        autoplay?: boolean;
        skipIntro?: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

// Subscription Plans Schema
export interface SubscriptionPlan {
    _id: string;
    name: 'free' | 'premium' | 'premium_plus';
    displayName: string;
    price: number;
    currency: string;
    interval: 'monthly' | 'yearly';
    features: {
        adsAllowed: boolean;
        maxQuality: string;
        offlineDownloads: boolean;
        simultaneousStreams: number;
        regions?: string[]; // Allowed regions
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Anime Series Schema
export interface AnimeSeries {
    _id: string;
    title: string;
    titleAlternatives?: string[];
    description: string;
    synopsis?: string;
    coverImage: string;
    bannerImage?: string;
    posterImage?: string;
    genres: string[];
    tags?: string[];
    studio?: string;
    studios?: string[];
    director?: string;
    cast?: Array<{
        name: string;
        character: string;
        role: 'main' | 'supporting';
    }>;
    year: number;
    season?: 'spring' | 'summer' | 'fall' | 'winter';
    status: 'ongoing' | 'completed' | 'upcoming' | 'cancelled';
    type: 'TV' | 'Movie' | 'OVA' | 'ONA' | 'Special';
    rating: number;
    ratingCount?: number;
    episodeCount: number;
    totalEpisodes?: number;
    duration?: number; // Average episode duration in seconds
    language: string;
    languages?: string[]; // Available languages
    releaseDate?: Date;
    endDate?: Date;
    ageRating?: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
    contentWarnings?: string[];
    geoRestrictions?: {
        allowed: string[]; // ISO country codes
        blocked: string[];
    };
    drmEnabled?: boolean;
    isExclusive?: boolean;
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

// Season Schema
export interface Season {
    _id: string;
    seriesId: string;
    seasonNumber: number;
    title?: string;
    description?: string;
    posterImage?: string;
    episodeCount: number;
    releaseDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Episode Schema
export interface Episode {
    _id: string;
    seriesId: string;
    seasonId?: string;
    seasonNumber?: number;
    episodeNumber: number;
    title: string;
    description?: string;
    thumbnail?: string;
    duration: number; // seconds
    videoUrl?: string; // Master URL (for transcoding)
    hlsManifestUrl?: string; // HLS playlist URL
    dashManifestUrl?: string; // DASH manifest URL
    subtitles?: Array<{
        language: string;
        languageCode: string; // ISO 639-1
        url: string;
        format: 'vtt' | 'srt' | 'ass';
        isDefault?: boolean;
    }>;
    audioTracks?: Array<{
        language: string;
        languageCode: string;
        url: string;
        isDefault?: boolean;
    }>;
    qualityLevels?: Array<{
        quality: '1080p' | '720p' | '480p' | '360p';
        bitrate: number;
        manifestUrl: string;
    }>;
    drmEnabled?: boolean;
    drmLicenseUrl?: string;
    geoRestrictions?: {
        allowed: string[];
        blocked: string[];
    };
    airDate?: Date;
    releaseDate?: Date;
    isPreview?: boolean; // Free preview episode
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

// Watch History Schema
export interface WatchHistory {
    _id: string;
    userId: string;
    seriesId: string;
    episodeId: string;
    lastPosition: number; // seconds
    watchedDuration: number; // total seconds watched
    completed: boolean;
    watchedAt: Date;
    lastWatchedAt: Date;
    quality?: string;
    device?: string;
    createdAt: Date;
    updatedAt: Date;
}

// My List / Favorites Schema
export interface MyList {
    _id: string;
    userId: string;
    seriesId: string;
    listType: 'favorites' | 'watchlist' | 'watching' | 'completed' | 'dropped' | 'on_hold';
    addedAt: Date;
    updatedAt: Date;
}

// Recommendations Cache Schema
export interface RecommendationsCache {
    _id: string;
    userId: string;
    recommendations: Array<{
        seriesId: string;
        score: number;
        reason: string; // Why recommended
    }>;
    generatedAt: Date;
    expiresAt: Date;
}

// Transcode Job Schema
export interface TranscodeJob {
    _id: string;
    episodeId: string;
    seriesId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    inputUrl: string;
    outputManifests?: {
        hls?: string;
        dash?: string;
    };
    qualityLevels?: Array<{
        quality: string;
        status: string;
        outputUrl?: string;
    }>;
    progress?: number; // 0-100
    error?: string;
    logs?: string[];
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Playback Event Schema (Analytics)
export interface PlaybackEvent {
    _id: string;
    userId?: string; // Nullable for anonymous
    episodeId: string;
    seriesId: string;
    eventType: 'play' | 'pause' | 'seek' | 'quality_change' | 'subtitle_change' | 'audio_change' | 'complete' | 'error' | 'heartbeat';
    timestamp: Date;
    position?: number; // Current playback position
    duration?: number; // Total video duration
    quality?: string;
    device?: string;
    browser?: string;
    ipAddress?: string;
    region?: string;
    payload?: Record<string, any>;
}

// Content Rights Schema
export interface ContentRights {
    _id: string;
    seriesId?: string;
    episodeId?: string;
    regions: string[]; // ISO country codes
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Ad Configuration Schema
export interface AdConfig {
    _id: string;
    seriesId?: string;
    episodeId?: string;
    placement: 'pre-roll' | 'mid-roll' | 'post-roll';
    vastUrl?: string;
    vmapUrl?: string;
    targeting?: Record<string, any>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

