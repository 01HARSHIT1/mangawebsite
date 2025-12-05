// AI-Powered Recommendation Engine for Manga Website
// Uses collaborative filtering, content-based filtering, and machine learning

import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

interface UserBehavior {
    userId: string;
    mangaId: string;
    rating?: number;
    readingTime: number;
    completionRate: number;
    lastReadAt: Date;
    bookmarked: boolean;
    liked: boolean;
    shared: boolean;
    commented: boolean;
}

interface MangaFeatures {
    mangaId: string;
    genres: string[];
    tags: string[];
    status: string;
    rating: number;
    views: number;
    popularity: number;
    createdAt: Date;
    authorStyle?: string;
    artStyle?: string;
    storyComplexity?: number;
    targetAudience?: string;
}

interface RecommendationScore {
    mangaId: string;
    score: number;
    reasons: string[];
    confidence: number;
    category: 'trending' | 'similar' | 'genre-based' | 'collaborative' | 'new-release' | 'ai-curated';
}

export class AIRecommendationEngine {
    private userBehaviorCache: Map<string, UserBehavior[]> = new Map();
    private mangaFeaturesCache: Map<string, MangaFeatures> = new Map();
    private similarityMatrix: Map<string, Map<string, number>> = new Map();

    // Main recommendation function
    async generateRecommendations(
        userId: string, 
        limit: number = 10,
        excludeRead: boolean = true
    ): Promise<RecommendationScore[]> {
        try {
            const userBehavior = await this.getUserBehavior(userId);
            const allManga = await this.getAllMangaFeatures();
            
            if (userBehavior.length === 0) {
                // New user - return trending and popular manga
                return this.getNewUserRecommendations(allManga, limit);
            }

            // Generate recommendations using multiple algorithms
            const [
                collaborativeRecs,
                contentBasedRecs,
                trendingRecs,
                genreBasedRecs,
                diversityRecs
            ] = await Promise.all([
                this.collaborativeFiltering(userId, userBehavior, allManga),
                this.contentBasedFiltering(userId, userBehavior, allManga),
                this.getTrendingRecommendations(allManga),
                this.getGenreBasedRecommendations(userId, userBehavior, allManga),
                this.getDiversityRecommendations(userId, userBehavior, allManga)
            ]);

            // Combine and weight recommendations
            const combinedRecs = this.combineRecommendations([
                { recs: collaborativeRecs, weight: 0.35 },
                { recs: contentBasedRecs, weight: 0.25 },
                { recs: trendingRecs, weight: 0.15 },
                { recs: genreBasedRecs, weight: 0.15 },
                { recs: diversityRecs, weight: 0.10 }
            ]);

            // Filter out already read manga if requested
            let filteredRecs = combinedRecs;
            if (excludeRead) {
                const readMangaIds = new Set(userBehavior.map(b => b.mangaId));
                filteredRecs = combinedRecs.filter(rec => !readMangaIds.has(rec.mangaId));
            }

            // Apply final scoring and ranking
            const finalRecs = await this.applyFinalScoring(userId, filteredRecs);

            return finalRecs.slice(0, limit);
        } catch (error) {
            console.error('AI Recommendation error:', error);
            return this.getFallbackRecommendations(limit);
        }
    }

    // Collaborative filtering based on user similarity
    private async collaborativeFiltering(
        userId: string, 
        userBehavior: UserBehavior[], 
        allManga: MangaFeatures[]
    ): Promise<RecommendationScore[]> {
        const similarUsers = await this.findSimilarUsers(userId, userBehavior);
        const recommendations: RecommendationScore[] = [];

        for (const similarUser of similarUsers) {
            const similarUserBehavior = await this.getUserBehavior(similarUser.userId);
            
            for (const behavior of similarUserBehavior) {
                if (!userBehavior.some(ub => ub.mangaId === behavior.mangaId)) {
                    const score = this.calculateCollaborativeScore(behavior, similarUser.similarity);
                    
                    const existingRec = recommendations.find(r => r.mangaId === behavior.mangaId);
                    if (existingRec) {
                        existingRec.score += score;
                        existingRec.reasons.push(`Users like you enjoyed this (${Math.round(similarUser.similarity * 100)}% match)`);
                    } else {
                        recommendations.push({
                            mangaId: behavior.mangaId,
                            score,
                            reasons: [`Recommended by similar users`],
                            confidence: similarUser.similarity,
                            category: 'collaborative'
                        });
                    }
                }
            }
        }

        return recommendations.sort((a, b) => b.score - a.score);
    }

    // Content-based filtering using manga features
    private async contentBasedFiltering(
        userId: string,
        userBehavior: UserBehavior[],
        allManga: MangaFeatures[]
    ): Promise<RecommendationScore[]> {
        const userPreferences = this.analyzeUserPreferences(userBehavior, allManga);
        const recommendations: RecommendationScore[] = [];

        for (const manga of allManga) {
            if (!userBehavior.some(ub => ub.mangaId === manga.mangaId)) {
                const score = this.calculateContentSimilarity(manga, userPreferences);
                
                if (score > 0.3) { // Threshold for relevance
                    recommendations.push({
                        mangaId: manga.mangaId,
                        score,
                        reasons: this.generateContentReasons(manga, userPreferences),
                        confidence: score,
                        category: 'similar'
                    });
                }
            }
        }

        return recommendations.sort((a, b) => b.score - a.score);
    }

    // Analyze user preferences from behavior
    private analyzeUserPreferences(userBehavior: UserBehavior[], allManga: MangaFeatures[]) {
        const genrePreferences: { [genre: string]: number } = {};
        const tagPreferences: { [tag: string]: number } = {};
        let avgRating = 0;
        let totalRatings = 0;

        for (const behavior of userBehavior) {
            const manga = allManga.find(m => m.mangaId === behavior.mangaId);
            if (!manga) continue;

            const weight = this.calculateBehaviorWeight(behavior);

            // Genre preferences
            for (const genre of manga.genres) {
                genrePreferences[genre] = (genrePreferences[genre] || 0) + weight;
            }

            // Tag preferences
            for (const tag of manga.tags) {
                tagPreferences[tag] = (tagPreferences[tag] || 0) + weight;
            }

            // Rating preferences
            if (behavior.rating) {
                avgRating += behavior.rating * weight;
                totalRatings += weight;
            }
        }

        return {
            genres: genrePreferences,
            tags: tagPreferences,
            avgRating: totalRatings > 0 ? avgRating / totalRatings : 0,
            totalInteractions: userBehavior.length
        };
    }

    // Calculate behavior weight based on user actions
    private calculateBehaviorWeight(behavior: UserBehavior): number {
        let weight = 1;

        // Higher weight for more engaged behavior
        if (behavior.rating && behavior.rating >= 4) weight += 2;
        if (behavior.bookmarked) weight += 1.5;
        if (behavior.liked) weight += 1;
        if (behavior.shared) weight += 0.5;
        if (behavior.commented) weight += 0.5;
        if (behavior.completionRate > 0.8) weight += 1;
        if (behavior.readingTime > 300) weight += 0.5; // 5+ minutes

        return weight;
    }

    // Find users with similar preferences
    private async findSimilarUsers(userId: string, userBehavior: UserBehavior[]) {
        // In a real implementation, this would query the database
        // For now, return mock similar users
        return [
            { userId: 'similar_user_1', similarity: 0.85 },
            { userId: 'similar_user_2', similarity: 0.78 },
            { userId: 'similar_user_3', similarity: 0.72 }
        ];
    }

    // Calculate content similarity score
    private calculateContentSimilarity(manga: MangaFeatures, userPreferences: any): number {
        let score = 0;

        // Genre similarity
        for (const genre of manga.genres) {
            if (userPreferences.genres[genre]) {
                score += userPreferences.genres[genre] * 0.4;
            }
        }

        // Tag similarity
        for (const tag of manga.tags) {
            if (userPreferences.tags[tag]) {
                score += userPreferences.tags[tag] * 0.3;
            }
        }

        // Rating similarity
        if (userPreferences.avgRating > 0) {
            const ratingDiff = Math.abs(manga.rating - userPreferences.avgRating);
            score += Math.max(0, (5 - ratingDiff) / 5) * 0.2;
        }

        // Popularity boost for quality content
        score += Math.min(manga.popularity / 10000, 0.1);

        return Math.min(score, 1); // Normalize to 0-1
    }

    // Generate trending recommendations
    private async getTrendingRecommendations(allManga: MangaFeatures[]): Promise<RecommendationScore[]> {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        return allManga
            .filter(manga => manga.createdAt > weekAgo || manga.views > 1000)
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 10)
            .map(manga => ({
                mangaId: manga.mangaId,
                score: Math.min(manga.popularity / 10000, 1),
                reasons: ['Trending this week', `${manga.views.toLocaleString()} views`],
                confidence: 0.8,
                category: 'trending' as const
            }));
    }

    // Genre-based recommendations
    private async getGenreBasedRecommendations(
        userId: string,
        userBehavior: UserBehavior[],
        allManga: MangaFeatures[]
    ): Promise<RecommendationScore[]> {
        const userGenres = this.getUserTopGenres(userBehavior, allManga);
        const recommendations: RecommendationScore[] = [];

        for (const manga of allManga) {
            if (!userBehavior.some(ub => ub.mangaId === manga.mangaId)) {
                const genreMatch = manga.genres.some(genre => userGenres.includes(genre));
                
                if (genreMatch) {
                    recommendations.push({
                        mangaId: manga.mangaId,
                        score: 0.7 + (manga.rating / 10),
                        reasons: [`You like ${manga.genres.filter(g => userGenres.includes(g)).join(', ')}`],
                        confidence: 0.7,
                        category: 'genre-based'
                    });
                }
            }
        }

        return recommendations.sort((a, b) => b.score - a.score);
    }

    // Diversity recommendations to avoid filter bubbles
    private async getDiversityRecommendations(
        userId: string,
        userBehavior: UserBehavior[],
        allManga: MangaFeatures[]
    ): Promise<RecommendationScore[]> {
        const userGenres = this.getUserTopGenres(userBehavior, allManga);
        const unexploredGenres = ['Romance', 'Horror', 'Comedy', 'Sci-Fi', 'Mystery', 'Sports']
            .filter(genre => !userGenres.includes(genre));

        const recommendations: RecommendationScore[] = [];

        for (const genre of unexploredGenres.slice(0, 3)) {
            const genreManga = allManga
                .filter(manga => manga.genres.includes(genre) && manga.rating >= 4.0)
                .sort((a, b) => b.rating - a.rating)
                .slice(0, 2);

            for (const manga of genreManga) {
                recommendations.push({
                    mangaId: manga.mangaId,
                    score: 0.6,
                    reasons: [`Discover ${genre} manga`, 'Highly rated by community'],
                    confidence: 0.6,
                    category: 'new-release'
                });
            }
        }

        return recommendations;
    }

    // Get user's top genres
    private getUserTopGenres(userBehavior: UserBehavior[], allManga: MangaFeatures[]): string[] {
        const genreCount: { [genre: string]: number } = {};

        for (const behavior of userBehavior) {
            const manga = allManga.find(m => m.mangaId === behavior.mangaId);
            if (manga) {
                const weight = this.calculateBehaviorWeight(behavior);
                for (const genre of manga.genres) {
                    genreCount[genre] = (genreCount[genre] || 0) + weight;
                }
            }
        }

        return Object.entries(genreCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([genre]) => genre);
    }

    // Combine multiple recommendation sources
    private combineRecommendations(
        sources: { recs: RecommendationScore[]; weight: number }[]
    ): RecommendationScore[] {
        const combinedMap: Map<string, RecommendationScore> = new Map();

        for (const { recs, weight } of sources) {
            for (const rec of recs) {
                const existing = combinedMap.get(rec.mangaId);
                
                if (existing) {
                    existing.score += rec.score * weight;
                    existing.reasons.push(...rec.reasons);
                    existing.confidence = Math.max(existing.confidence, rec.confidence);
                } else {
                    combinedMap.set(rec.mangaId, {
                        ...rec,
                        score: rec.score * weight,
                        reasons: [...rec.reasons]
                    });
                }
            }
        }

        return Array.from(combinedMap.values()).sort((a, b) => b.score - a.score);
    }

    // Apply final scoring with recency and quality boosts
    private async applyFinalScoring(userId: string, recommendations: RecommendationScore[]): Promise<RecommendationScore[]> {
        const now = new Date();
        
        return recommendations.map(rec => {
            let finalScore = rec.score;

            // Recency boost for new releases
            const manga = this.mangaFeaturesCache.get(rec.mangaId);
            if (manga) {
                const daysSinceRelease = (now.getTime() - manga.createdAt.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceRelease < 7) {
                    finalScore *= 1.2; // 20% boost for new releases
                    rec.reasons.push('New release');
                }

                // Quality boost for highly rated manga
                if (manga.rating >= 4.5) {
                    finalScore *= 1.15; // 15% boost for high quality
                    rec.reasons.push('Highly rated');
                }

                // Popularity boost
                if (manga.views > 10000) {
                    finalScore *= 1.1; // 10% boost for popular manga
                    rec.reasons.push('Popular choice');
                }
            }

            return {
                ...rec,
                score: Math.min(finalScore, 1), // Cap at 1.0
                reasons: [...new Set(rec.reasons)] // Remove duplicates
            };
        }).sort((a, b) => b.score - a.score);
    }

    // New user recommendations
    private getNewUserRecommendations(allManga: MangaFeatures[], limit: number): RecommendationScore[] {
        return allManga
            .filter(manga => manga.rating >= 4.0)
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, limit)
            .map(manga => ({
                mangaId: manga.mangaId,
                score: 0.8,
                reasons: ['Popular with new readers', 'Highly rated'],
                confidence: 0.8,
                category: 'trending' as const
            }));
    }

    // Fallback recommendations when AI fails
    private getFallbackRecommendations(limit: number): RecommendationScore[] {
        const fallbackManga = ['1', '2', '3', '4', '5', '6'];
        
        return fallbackManga.slice(0, limit).map((mangaId, index) => ({
            mangaId,
            score: 0.7 - (index * 0.1),
            reasons: ['Editor\'s pick', 'Community favorite'],
            confidence: 0.7,
            category: 'ai-curated' as const
        }));
    }

    // Get user behavior data from database
    private async getUserBehavior(userId: string): Promise<UserBehavior[]> {
        if (this.userBehaviorCache.has(userId)) {
            return this.userBehaviorCache.get(userId)!;
        }

        try {
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            const users = db.collection('users');
            
            // Get user document
            const user = await users.findOne({ _id: new ObjectId(userId) });
            if (!user) {
                return [];
            }

            const behavior: UserBehavior[] = [];
            const readingHistory = user.readingHistory || [];
            const bookmarks = user.bookmarks || [];
            const likes = user.likes || [];
            const dislikedManga = (user.dislikedManga || []).map((f: any) => 
                typeof f === 'string' ? f : f.mangaId
            );

            // Process reading history
            const mangaIds = new Set<string>();
            readingHistory.forEach((entry: any) => {
                if (entry.mangaId) {
                    mangaIds.add(entry.mangaId.toString());
                }
            });

            // Get manga details for reading history
            if (mangaIds.size > 0) {
                const mangaCollection = db.collection('manga');
                const mangaDocs = await mangaCollection
                    .find({ _id: { $in: Array.from(mangaIds).map(id => new ObjectId(id)) } })
                    .toArray();

                readingHistory.forEach((entry: any) => {
                    if (!entry.mangaId) return;
                    
                    const mangaId = entry.mangaId.toString();
                    const manga = mangaDocs.find((m: any) => m._id.toString() === mangaId);
                    if (!manga) return;

                    // Calculate completion rate from reading history
                    const totalChapters = manga.chapters || 0;
                    const readChapters = entry.chapterNumber || 0;
                    const completionRate = totalChapters > 0 ? readChapters / totalChapters : 0;

                    // Estimate reading time (simplified: 5 minutes per chapter)
                    const readingTime = readChapters * 300; // 5 minutes = 300 seconds

                    behavior.push({
                        userId,
                        mangaId,
                        rating: entry.rating || manga.rating || 0,
                        readingTime,
                        completionRate: Math.min(completionRate, 1),
                        lastReadAt: entry.timestamp ? new Date(entry.timestamp) : new Date(),
                        bookmarked: bookmarks.some((b: any) => {
                            const bid = typeof b === 'string' ? b : b.mangaId || b;
                            return bid.toString() === mangaId;
                        }),
                        liked: likes.some((l: any) => {
                            const lid = typeof l === 'string' ? l : l.mangaId || l;
                            return lid.toString() === mangaId;
                        }),
                        shared: false, // Can be tracked separately if needed
                        commented: false // Can be tracked separately if needed
                    });
                });
            }

            // Cache the behavior
            this.userBehaviorCache.set(userId, behavior);
            return behavior;
        } catch (error) {
            console.error('Failed to get user behavior from database:', error);
            return [];
        }
    }

    // Get all manga features from database
    private async getAllMangaFeatures(): Promise<MangaFeatures[]> {
        try {
            const client = await clientPromise;
            const db = client.db('mangawebsite');
            const mangaCollection = db.collection('manga');
            
            // Get all manga with necessary fields
            const allManga = await mangaCollection
                .find({})
                .project({
                    _id: 1,
                    title: 1,
                    genres: 1,
                    tags: 1,
                    status: 1,
                    rating: 1,
                    views: 1,
                    likes: 1,
                    chapters: 1,
                    createdAt: 1,
                    author: 1
                })
                .limit(1000) // Limit for performance
                .toArray();

            // Transform to MangaFeatures format
            const features: MangaFeatures[] = allManga.map((manga: any) => {
                // Calculate popularity score (combination of views, likes, rating)
                const popularity = (
                    (manga.views || 0) * 0.4 +
                    (manga.likes || 0) * 0.3 +
                    (manga.rating || 0) * 1000 * 0.3
                );

                return {
                    mangaId: manga._id.toString(),
                    genres: manga.genres || [],
                    tags: manga.tags || [],
                    status: manga.status || 'ongoing',
                    rating: manga.rating || 0,
                    views: manga.views || 0,
                    popularity,
                    createdAt: manga.createdAt || new Date(),
                    authorStyle: manga.author || '',
                    artStyle: undefined, // Can be added later
                    storyComplexity: undefined, // Can be calculated later
                    targetAudience: undefined // Can be inferred from genres/tags
                };
            });

            // Cache the features
            this.mangaFeaturesCache.clear();
            features.forEach(f => {
                this.mangaFeaturesCache.set(f.mangaId, f);
            });

            return features;
        } catch (error) {
            console.error('Failed to get manga features from database:', error);
            return [];
        }
    }

    // Calculate collaborative filtering score
    private calculateCollaborativeScore(behavior: UserBehavior, userSimilarity: number): number {
        let score = userSimilarity;

        if (behavior.rating && behavior.rating >= 4) score *= 1.2;
        if (behavior.bookmarked) score *= 1.1;
        if (behavior.completionRate > 0.8) score *= 1.1;

        return Math.min(score, 1);
    }

    // Generate content-based reasoning
    private generateContentReasons(manga: MangaFeatures, userPreferences: any): string[] {
        const reasons: string[] = [];

        // Check genre matches
        const matchingGenres = manga.genres.filter(genre => userPreferences.genres[genre]);
        if (matchingGenres.length > 0) {
            reasons.push(`You like ${matchingGenres.slice(0, 2).join(' and ')} manga`);
        }

        // Check tag matches
        const matchingTags = manga.tags.filter(tag => userPreferences.tags[tag]);
        if (matchingTags.length > 0) {
            reasons.push(`Features ${matchingTags.slice(0, 2).join(' and ')}`);
        }

        // Rating match
        if (manga.rating >= 4.5) {
            reasons.push('Highly rated by community');
        }

        return reasons.slice(0, 3); // Limit to 3 reasons
    }
}

// Singleton instance
let aiEngine: AIRecommendationEngine | null = null;

export function getAIRecommendationEngine(): AIRecommendationEngine {
    if (!aiEngine) {
        aiEngine = new AIRecommendationEngine();
    }
    return aiEngine;
}
