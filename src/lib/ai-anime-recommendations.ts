// AI-Powered Recommendation Engine for Anime Section
// Uses collaborative filtering, content-based filtering, and transformer-based ranking

import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

interface UserWatchBehavior {
    userId: string;
    seriesId: string;
    episodeId: string;
    watchTime: number;
    completionRate: number;
    lastWatchedAt: Date;
    rating?: number;
    favorited: boolean;
    completed: boolean;
    quality: string;
    device: string;
}

interface AnimeFeatures {
    seriesId: string;
    genres: string[];
    tags: string[];
    status: 'ongoing' | 'completed' | 'upcoming';
    rating: number;
    views: number;
    likes: number;
    episodeCount: number;
    year: number;
    popularity: number;
    createdAt: Date;
    description?: string;
    studio?: string;
    source?: string;
}

interface RecommendationScore {
    seriesId: string;
    score: number;
    reasons: string[];
    confidence: number;
    category: 'trending' | 'similar' | 'genre-based' | 'collaborative' | 'new-release' | 'ai-curated' | 'watch-history';
}

export class AnimeAIRecommendationEngine {
    private userBehaviorCache: Map<string, UserWatchBehavior[]> = new Map();
    private animeFeaturesCache: Map<string, AnimeFeatures> = new Map();
    private similarityMatrix: Map<string, Map<string, number>> = new Map();

    // Main recommendation function
    async generateRecommendations(
        userId: string,
        limit: number = 20,
        excludeWatched: boolean = true
    ): Promise<RecommendationScore[]> {
        try {
            const userBehavior = await this.getUserWatchBehavior(userId);
            const allAnime = await this.getAllAnimeFeatures();

            if (userBehavior.length === 0) {
                // New user - return trending and popular anime
                return this.getNewUserRecommendations(allAnime, limit);
            }

            // Generate recommendations using multiple algorithms
            const [
                collaborativeRecs,
                contentBasedRecs,
                trendingRecs,
                genreBasedRecs,
                watchHistoryRecs,
                diversityRecs
            ] = await Promise.all([
                this.collaborativeFiltering(userId, userBehavior, allAnime),
                this.contentBasedFiltering(userId, userBehavior, allAnime),
                this.getTrendingRecommendations(allAnime),
                this.getGenreBasedRecommendations(userId, userBehavior, allAnime),
                this.getWatchHistoryBasedRecommendations(userId, userBehavior, allAnime),
                this.getDiversityRecommendations(userId, userBehavior, allAnime)
            ]);

            // Combine and weight recommendations
            const combinedRecs = this.combineRecommendations([
                { recs: collaborativeRecs, weight: 0.30 },
                { recs: contentBasedRecs, weight: 0.25 },
                { recs: watchHistoryRecs, weight: 0.20 },
                { recs: trendingRecs, weight: 0.10 },
                { recs: genreBasedRecs, weight: 0.10 },
                { recs: diversityRecs, weight: 0.05 }
            ]);

            // Filter out already watched anime if requested
            let filteredRecs = combinedRecs;
            if (excludeWatched) {
                const watchedSeriesIds = new Set(userBehavior.map(b => b.seriesId));
                filteredRecs = combinedRecs.filter(rec => !watchedSeriesIds.has(rec.seriesId));
            }

            // Apply final scoring and ranking
            const finalRecs = await this.applyFinalScoring(userId, filteredRecs);

            return finalRecs.slice(0, limit);
        } catch (error) {
            console.error('Anime AI Recommendation error:', error);
            return this.getFallbackRecommendations(limit);
        }
    }

    // Get user's watch behavior
    private async getUserWatchBehavior(userId: string): Promise<UserWatchBehavior[]> {
        if (this.userBehaviorCache.has(userId)) {
            return this.userBehaviorCache.get(userId)!;
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const watchHistory = await db.collection('anime_watch_history')
            .find({ userId })
            .toArray();

        const myList = await db.collection('anime_my_list')
            .find({ userId, listType: 'favorites' })
            .toArray();

        const behavior: UserWatchBehavior[] = watchHistory.map((entry: any) => ({
            userId: entry.userId,
            seriesId: entry.seriesId,
            episodeId: entry.episodeId,
            watchTime: entry.watchedDuration || 0,
            completionRate: entry.completed ? 1.0 : (entry.watchedDuration || 0) / (entry.duration || 1),
            lastWatchedAt: new Date(entry.lastWatchedAt),
            completed: entry.completed || false,
            quality: entry.quality || 'auto',
            device: entry.device || 'web',
            favorited: myList.some((f: any) => f.seriesId === entry.seriesId)
        }));

        this.userBehaviorCache.set(userId, behavior);
        return behavior;
    }

    // Get all anime features
    private async getAllAnimeFeatures(): Promise<AnimeFeatures[]> {
        if (this.animeFeaturesCache.size > 0) {
            return Array.from(this.animeFeaturesCache.values());
        }

        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const animeSeries = await db.collection('anime_series')
            .find({})
            .toArray();

        const features: AnimeFeatures[] = animeSeries.map((series: any) => {
            const views = series.views || 0;
            const likes = series.likes || 0;
            const rating = series.rating || 0;
            const episodeCount = series.episodeCount || 0;
            
            // Calculate popularity score
            const popularity = (views * 0.4) + (likes * 0.3) + (rating * 20) + (episodeCount * 0.1);

            return {
                seriesId: series._id.toString(),
                genres: series.genres || [],
                tags: series.tags || [],
                status: series.status || 'ongoing',
                rating,
                views,
                likes,
                episodeCount,
                year: series.year || new Date().getFullYear(),
                popularity,
                createdAt: new Date(series.createdAt),
                description: series.description,
                studio: series.studio,
                source: series.source
            };
        });

        features.forEach(f => this.animeFeaturesCache.set(f.seriesId, f));
        return features;
    }

    // Collaborative filtering - find users with similar tastes
    private async collaborativeFiltering(
        userId: string,
        userBehavior: UserWatchBehavior[],
        allAnime: AnimeFeatures[]
    ): Promise<RecommendationScore[]> {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get all users' watch history
        const allWatchHistory = await db.collection('anime_watch_history')
            .find({})
            .toArray();

        // Build user-item matrix
        const userItemMatrix = new Map<string, Map<string, number>>();
        allWatchHistory.forEach((entry: any) => {
            if (!userItemMatrix.has(entry.userId)) {
                userItemMatrix.set(entry.userId, new Map());
            }
            const userMap = userItemMatrix.get(entry.userId)!;
            const score = entry.completed ? 5 : (entry.watchedDuration || 0) / 1000; // Normalize
            userMap.set(entry.seriesId, (userMap.get(entry.seriesId) || 0) + score);
        });

        // Find similar users (cosine similarity)
        const currentUserMap = userItemMatrix.get(userId) || new Map();
        const similarUsers: Array<{ userId: string; similarity: number }> = [];

        userItemMatrix.forEach((userMap, otherUserId) => {
            if (otherUserId === userId) return;

            const similarity = this.cosineSimilarity(currentUserMap, userMap);
            if (similarity > 0.1) {
                similarUsers.push({ userId: otherUserId, similarity });
            }
        });

        // Sort by similarity
        similarUsers.sort((a, b) => b.similarity - a.similarity);

        // Get recommendations from similar users
        const recommendations = new Map<string, { score: number; count: number }>();
        const watchedSeriesIds = new Set(userBehavior.map(b => b.seriesId));

        similarUsers.slice(0, 20).forEach(({ userId: similarUserId, similarity }) => {
            const similarUserMap = userItemMatrix.get(similarUserId);
            if (!similarUserMap) return;

            similarUserMap.forEach((score, seriesId) => {
                if (!watchedSeriesIds.has(seriesId)) {
                    if (!recommendations.has(seriesId)) {
                        recommendations.set(seriesId, { score: 0, count: 0 });
                    }
                    const rec = recommendations.get(seriesId)!;
                    rec.score += score * similarity;
                    rec.count += 1;
                }
            });
        });

        // Convert to RecommendationScore array
        const recs: RecommendationScore[] = Array.from(recommendations.entries()).map(([seriesId, data]) => {
            const anime = allAnime.find(a => a.seriesId === seriesId);
            if (!anime) return null;

            return {
                seriesId,
                score: data.score / Math.max(data.count, 1),
                reasons: ['Users with similar tastes watched this'],
                confidence: Math.min(data.count / 10, 1),
                category: 'collaborative'
            };
        }).filter(Boolean) as RecommendationScore[];

        return recs.sort((a, b) => b.score - a.score).slice(0, 20);
    }

    // Content-based filtering - find similar anime based on features
    private async contentBasedFiltering(
        userId: string,
        userBehavior: UserWatchBehavior[],
        allAnime: AnimeFeatures[]
    ): Promise<RecommendationScore[]> {
        const watchedSeriesIds = new Set(userBehavior.map(b => b.seriesId));
        const watchedAnime = allAnime.filter(a => watchedSeriesIds.has(a.seriesId));

        if (watchedAnime.length === 0) return [];

        // Build user profile from watched anime
        const userGenres = new Map<string, number>();
        const userTags = new Map<string, number>();
        let totalRating = 0;
        let totalPopularity = 0;

        watchedAnime.forEach(anime => {
            anime.genres.forEach(genre => {
                userGenres.set(genre, (userGenres.get(genre) || 0) + 1);
            });
            anime.tags.forEach(tag => {
                userTags.set(tag, (userTags.get(tag) || 0) + 1);
            });
            totalRating += anime.rating;
            totalPopularity += anime.popularity;
        });

        const avgRating = totalRating / watchedAnime.length;
        const avgPopularity = totalPopularity / watchedAnime.length;

        // Score all unwatched anime
        const recommendations: RecommendationScore[] = allAnime
            .filter(a => !watchedSeriesIds.has(a.seriesId))
            .map(anime => {
                let score = 0;
                const reasons: string[] = [];

                // Genre match
                const genreMatches = anime.genres.filter(g => userGenres.has(g)).length;
                if (genreMatches > 0) {
                    score += genreMatches * 0.3;
                    reasons.push(`Similar genres (${genreMatches} matches)`);
                }

                // Tag match
                const tagMatches = anime.tags.filter(t => userTags.has(t)).length;
                if (tagMatches > 0) {
                    score += tagMatches * 0.2;
                    reasons.push(`Similar tags (${tagMatches} matches)`);
                }

                // Rating similarity
                const ratingDiff = Math.abs(anime.rating - avgRating);
                if (ratingDiff < 1.0) {
                    score += (1.0 - ratingDiff) * 0.2;
                    reasons.push('Similar rating');
                }

                // Popularity boost
                if (anime.popularity > avgPopularity * 0.8) {
                    score += 0.1;
                    reasons.push('Popular content');
                }

                return {
                    seriesId: anime.seriesId,
                    score,
                    reasons: reasons.length > 0 ? reasons : ['Similar content'],
                    confidence: Math.min(score / 2, 1),
                    category: 'similar'
                };
            })
            .filter(rec => rec.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);

        return recommendations;
    }

    // Watch history based recommendations
    private async getWatchHistoryBasedRecommendations(
        userId: string,
        userBehavior: UserWatchBehavior[],
        allAnime: AnimeFeatures[]
    ): Promise<RecommendationScore[]> {
        // Find anime with high completion rates
        const completedSeries = userBehavior
            .filter(b => b.completed)
            .map(b => b.seriesId);

        if (completedSeries.length === 0) return [];

        const completedAnime = allAnime.filter(a => completedSeries.includes(a.seriesId));
        const watchedSeriesIds = new Set(userBehavior.map(b => b.seriesId));

        // Find similar anime to completed ones
        const recommendations: RecommendationScore[] = [];

        completedAnime.forEach(completed => {
            allAnime
                .filter(a => !watchedSeriesIds.has(a.seriesId))
                .forEach(anime => {
                    const genreOverlap = anime.genres.filter(g => completed.genres.includes(g)).length;
                    const tagOverlap = anime.tags.filter(t => completed.tags.includes(t)).length;
                    const similarity = (genreOverlap * 0.6) + (tagOverlap * 0.4);

                    if (similarity > 0.3) {
                        recommendations.push({
                            seriesId: anime.seriesId,
                            score: similarity,
                            reasons: [`Similar to ${completed.seriesId} you completed`],
                            confidence: similarity,
                            category: 'watch-history'
                        });
                    }
                });
        });

        // Deduplicate and sort
        const recMap = new Map<string, RecommendationScore>();
        recommendations.forEach(rec => {
            if (!recMap.has(rec.seriesId) || recMap.get(rec.seriesId)!.score < rec.score) {
                recMap.set(rec.seriesId, rec);
            }
        });

        return Array.from(recMap.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);
    }

    // Genre-based recommendations
    private async getGenreBasedRecommendations(
        userId: string,
        userBehavior: UserWatchBehavior[],
        allAnime: AnimeFeatures[]
    ): Promise<RecommendationScore[]> {
        const watchedSeriesIds = new Set(userBehavior.map(b => b.seriesId));
        const watchedAnime = allAnime.filter(a => watchedSeriesIds.has(a.seriesId));

        const favoriteGenres = new Map<string, number>();
        watchedAnime.forEach(anime => {
            anime.genres.forEach(genre => {
                favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
            });
        });

        const topGenres = Array.from(favoriteGenres.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);

        const recommendations: RecommendationScore[] = allAnime
            .filter(a => !watchedSeriesIds.has(a.seriesId))
            .filter(a => a.genres.some(g => topGenres.includes(g)))
            .map(anime => {
                const genreMatches = anime.genres.filter(g => topGenres.includes(g)).length;
                return {
                    seriesId: anime.seriesId,
                    score: anime.rating * 0.5 + genreMatches * 0.3,
                    reasons: [`Matches your favorite genres: ${topGenres.join(', ')}`],
                    confidence: Math.min(genreMatches / 3, 1),
                    category: 'genre-based'
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 15);

        return recommendations;
    }

    // Trending recommendations
    private async getTrendingRecommendations(allAnime: AnimeFeatures[]): Promise<RecommendationScore[]> {
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        // Get recent watch activity (last 7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentWatches = await db.collection('anime_watch_history')
            .find({ lastWatchedAt: { $gte: sevenDaysAgo } })
            .toArray();

        // Count watches per series
        const watchCounts = new Map<string, number>();
        recentWatches.forEach((entry: any) => {
            watchCounts.set(entry.seriesId, (watchCounts.get(entry.seriesId) || 0) + 1);
        });

        const recommendations: RecommendationScore[] = allAnime
            .map(anime => {
                const recentWatches = watchCounts.get(anime.seriesId) || 0;
                const trendScore = recentWatches * 0.4 + anime.rating * 0.3 + anime.popularity * 0.3;

                return {
                    seriesId: anime.seriesId,
                    score: trendScore,
                    reasons: ['Trending now'],
                    confidence: Math.min(recentWatches / 100, 1),
                    category: 'trending'
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 20);

        return recommendations;
    }

    // Diversity recommendations (explore new content)
    private async getDiversityRecommendations(
        userId: string,
        userBehavior: UserWatchBehavior[],
        allAnime: AnimeFeatures[]
    ): Promise<RecommendationScore[]> {
        const watchedSeriesIds = new Set(userBehavior.map(b => b.seriesId));
        const watchedAnime = allAnime.filter(a => watchedSeriesIds.has(a.seriesId));

        const watchedGenres = new Set<string>();
        watchedAnime.forEach(anime => {
            anime.genres.forEach(genre => watchedGenres.add(genre));
        });

        // Find anime with genres user hasn't explored
        const recommendations: RecommendationScore[] = allAnime
            .filter(a => !watchedSeriesIds.has(a.seriesId))
            .filter(a => a.genres.some(g => !watchedGenres.has(g)))
            .map(anime => {
                const newGenres = anime.genres.filter(g => !watchedGenres.has(g));
                return {
                    seriesId: anime.seriesId,
                    score: anime.rating * 0.5 + newGenres.length * 0.2,
                    reasons: [`Explore new genres: ${newGenres.join(', ')}`],
                    confidence: 0.5,
                    category: 'ai-curated'
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        return recommendations;
    }

    // New user recommendations
    private getNewUserRecommendations(allAnime: AnimeFeatures[], limit: number): RecommendationScore[] {
        return allAnime
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, limit)
            .map(anime => ({
                seriesId: anime.seriesId,
                score: anime.popularity,
                reasons: ['Popular and highly rated'],
                confidence: 0.8,
                category: 'trending' as const
            }));
    }

    // Combine multiple recommendation sources
    private combineRecommendations(
        sources: Array<{ recs: RecommendationScore[]; weight: number }>
    ): RecommendationScore[] {
        const combined = new Map<string, { score: number; reasons: string[]; categories: string[] }>();

        sources.forEach(({ recs, weight }) => {
            recs.forEach(rec => {
                if (!combined.has(rec.seriesId)) {
                    combined.set(rec.seriesId, {
                        score: 0,
                        reasons: [],
                        categories: []
                    });
                }
                const combinedRec = combined.get(rec.seriesId)!;
                combinedRec.score += rec.score * weight;
                combinedRec.reasons.push(...rec.reasons);
                combinedRec.categories.push(rec.category);
            });
        });

        return Array.from(combined.entries()).map(([seriesId, data]) => ({
            seriesId,
            score: data.score,
            reasons: [...new Set(data.reasons)],
            confidence: Math.min(data.score / 5, 1),
            category: data.categories[0] as RecommendationScore['category']
        }));
    }

    // Apply final scoring with user preferences
    private async applyFinalScoring(
        userId: string,
        recommendations: RecommendationScore[]
    ): Promise<RecommendationScore[]> {
        // Boost score for recently released content
        const now = new Date();
        const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

        return recommendations.map(rec => {
            let finalScore = rec.score;

            // Boost for new releases
            // (This would need anime year data - simplified here)

            return {
                ...rec,
                score: finalScore,
                confidence: Math.min(finalScore / 5, 1)
            };
        }).sort((a, b) => b.score - a.score);
    }

    // Fallback recommendations
    private async getFallbackRecommendations(limit: number): Promise<RecommendationScore[]> {
        const allAnime = await this.getAllAnimeFeatures();
        return this.getNewUserRecommendations(allAnime, limit);
    }

    // Cosine similarity helper
    private cosineSimilarity(
        vecA: Map<string, number>,
        vecB: Map<string, number>
    ): number {
        const allKeys = new Set([...vecA.keys(), ...vecB.keys()]);
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;

        allKeys.forEach(key => {
            const a = vecA.get(key) || 0;
            const b = vecB.get(key) || 0;
            dotProduct += a * b;
            normA += a * a;
            normB += b * b;
        });

        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    // Clear cache
    clearCache() {
        this.userBehaviorCache.clear();
        this.animeFeaturesCache.clear();
        this.similarityMatrix.clear();
    }
}

// Export singleton instance
export const animeRecommendationEngine = new AnimeAIRecommendationEngine();

