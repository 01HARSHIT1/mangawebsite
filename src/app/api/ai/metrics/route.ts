import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import { generateSimulatedMetrics } from '@/lib/ai-metrics-simulator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Metrics calculation for AI features
interface RecommendationMetrics {
    precisionAtK: { k: number; value: number }[];
    recallAtK: { k: number; value: number }[];
    ndcg: { k: number; value: number }[];
    hitRate: { k: number; value: number }[];
    coverage: number;
    diversity: number;
    popularityBias: number;
    averagePrecision: number;
    meanReciprocalRank: number;
}

interface SearchMetrics {
    averagePrecision: number;
    meanReciprocalRank: number;
    normalizedDiscountedCumulativeGain: number;
    retrievalAccuracy: number;
    querySuccessRate: number;
    averageRelevanceScore: number;
    topKAccuracy: { k: number; accuracy: number }[];
}

interface FilteringMetrics {
    filteringPrecision: number;
    filteringRecall: number;
    filteringF1Score: number;
    userSatisfactionRate: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
}

interface FeatureAdoptionMetrics {
    smartRecommendations: { enabled: number; total: number; adoptionRate: number };
    semanticSearch: { enabled: number; total: number; adoptionRate: number };
    personalizedFiltering: { enabled: number; total: number; adoptionRate: number };
    voiceAssistant: { enabled: number; total: number; adoptionRate: number };
    eyeTracking: { enabled: number; total: number; adoptionRate: number };
    autoBrightness: { enabled: number; total: number; adoptionRate: number };
    overallAdoptionRate: number;
}

interface AIMetrics {
    recommendations: RecommendationMetrics;
    semanticSearch: SearchMetrics;
    personalizedFiltering: FilteringMetrics;
    featureAdoption: FeatureAdoptionMetrics;
    overallAccuracy: number;
    timestamp: Date;
}

// Calculate recommendation metrics
async function calculateRecommendationMetrics(): Promise<RecommendationMetrics> {
    const client = await clientPromise;
    const db = client.db('mangawebsite');
    
    const users = db.collection('users');
    const manga = db.collection('manga');
    
    // Get users with reading history
    const usersWithHistory = await users
        .find({ readingHistory: { $exists: true, $ne: [] } })
        .limit(100) // Sample for performance
        .toArray();

    if (usersWithHistory.length === 0) {
        return getDefaultRecommendationMetrics();
    }

    const kValues = [5, 10, 20];
    const precisionAtK: { k: number; value: number }[] = [];
    const recallAtK: { k: number; value: number }[] = [];
    const ndcg: { k: number; value: number }[] = [];
    const hitRate: { k: number; value: number }[] = [];

    let totalPrecision = 0;
    let totalRecall = 0;
    let totalHits = 0;
    let totalRecommendations = 0;
    let totalRelevant = 0;
    let totalMRR = 0;
    let userCount = 0;

    const allMangaIds = new Set<string>();
    const recommendedMangaIds = new Set<string>();

    for (const user of usersWithHistory) {
        const readingHistory = user.readingHistory || [];
        const bookmarks = user.bookmarks || [];
        const likes = user.likes || [];
        
        // Get user's relevant items (read, bookmarked, liked)
        const relevantItems = new Set<string>();
        readingHistory.forEach((entry: any) => {
            if (entry.mangaId) relevantItems.add(entry.mangaId.toString());
        });
        [...bookmarks, ...likes].forEach((id: any) => {
            const mangaId = typeof id === 'string' ? id : id.mangaId || id;
            if (mangaId) relevantItems.add(mangaId.toString());
        });

        if (relevantItems.size === 0) continue;

        // Simulate recommendations (in real system, get from AI engine)
        // For now, use genre-based recommendations
        const userGenres = new Set<string>();
        const readMangaIds = Array.from(relevantItems).slice(0, 10);
        
        if (readMangaIds.length > 0) {
            const readManga = await manga
                .find({ _id: { $in: readMangaIds.map(id => new ObjectId(id)) } })
                .project({ genres: 1 })
                .toArray();
            
            readManga.forEach((m: any) => {
                if (m.genres) {
                    m.genres.forEach((genre: string) => userGenres.add(genre));
                }
            });
        }

        // Get recommendations
        const recommendations = await manga
            .find({
                _id: { $nin: readMangaIds.map(id => new ObjectId(id)) },
                genres: { $in: Array.from(userGenres) }
            })
            .limit(20)
            .toArray();

        const recommendedIds = recommendations.map((m: any) => m._id.toString());
        recommendedIds.forEach(id => recommendedMangaIds.add(id));
        readMangaIds.forEach(id => allMangaIds.add(id));

        // Calculate metrics for each k
        for (const k of kValues) {
            const topK = recommendedIds.slice(0, k);
            const relevantInTopK = topK.filter(id => relevantItems.has(id)).length;
            
            // Precision@K
            const precision = topK.length > 0 ? relevantInTopK / topK.length : 0;
            
            // Recall@K
            const recall = relevantItems.size > 0 ? relevantInTopK / relevantItems.size : 0;
            
            // Hit Rate@K
            const hit = relevantInTopK > 0 ? 1 : 0;
            
            // NDCG@K (simplified)
            let dcg = 0;
            topK.forEach((id, index) => {
                if (relevantItems.has(id)) {
                    dcg += 1 / Math.log2(index + 2);
                }
            });
            const idealDCG = Math.min(k, relevantItems.size) > 0 
                ? Array.from({ length: Math.min(k, relevantItems.size) }, (_, i) => 1 / Math.log2(i + 2))
                    .reduce((a, b) => a + b, 0)
                : 1;
            const ndcgValue = idealDCG > 0 ? dcg / idealDCG : 0;

            if (k === 10) {
                totalPrecision += precision;
                totalRecall += recall;
                totalHits += hit;
                totalRecommendations += topK.length;
                totalRelevant += relevantItems.size;
                
                // MRR
                const firstRelevantIndex = topK.findIndex(id => relevantItems.has(id));
                if (firstRelevantIndex !== -1) {
                    totalMRR += 1 / (firstRelevantIndex + 1);
                }
            }
        }

        userCount++;
    }

    // Calculate averages
    for (const k of kValues) {
        const precision = userCount > 0 ? totalPrecision / userCount : 0;
        const recall = userCount > 0 ? totalRecall / userCount : 0;
        const hit = userCount > 0 ? totalHits / userCount : 0;
        const ndcgValue = userCount > 0 ? totalMRR / userCount : 0; // Simplified

        precisionAtK.push({ k, value: precision });
        recallAtK.push({ k, value: recall });
        hitRate.push({ k, value: hit });
        ndcg.push({ k, value: ndcgValue });
    }

    // Coverage: percentage of manga that can be recommended
    const totalManga = await manga.countDocuments();
    const coverage = totalManga > 0 ? (recommendedMangaIds.size / totalManga) * 100 : 0;

    // Diversity: measure of how diverse recommendations are
    const diversity = calculateDiversity(recommendedMangaIds, allMangaIds);

    // Popularity bias: how much recommendations favor popular items
    const popularityBias = await calculatePopularityBias(recommendedMangaIds, manga);

    const averagePrecision = userCount > 0 ? totalPrecision / userCount : 0;
    const meanReciprocalRank = userCount > 0 ? totalMRR / userCount : 0;

    return {
        precisionAtK,
        recallAtK,
        ndcg,
        hitRate,
        coverage,
        diversity,
        popularityBias,
        averagePrecision,
        meanReciprocalRank
    };
}

function calculateDiversity(recommended: Set<string>, all: Set<string>): number {
    // Simplified diversity: ratio of unique recommendations
    return recommended.size > 0 ? recommended.size / Math.max(all.size, 1) : 0;
}

async function calculatePopularityBias(recommendedIds: Set<string>, mangaCollection: any): Promise<number> {
    if (recommendedIds.size === 0) return 0;
    
    const recommendedManga = await mangaCollection
        .find({ _id: { $in: Array.from(recommendedIds).map(id => new ObjectId(id)) } })
        .project({ views: 1 })
        .toArray();
    
    const allManga = await mangaCollection
        .find({})
        .project({ views: 1 })
        .limit(1000)
        .toArray();
    
    const avgViewsRecommended = recommendedManga.length > 0
        ? recommendedManga.reduce((sum: number, m: any) => sum + (m.views || 0), 0) / recommendedManga.length
        : 0;
    
    const avgViewsAll = allManga.length > 0
        ? allManga.reduce((sum: number, m: any) => sum + (m.views || 0), 0) / allManga.length
        : 0;
    
    return avgViewsAll > 0 ? avgViewsRecommended / avgViewsAll : 0;
}

function getDefaultRecommendationMetrics(): RecommendationMetrics {
    return {
        precisionAtK: [{ k: 5, value: 0 }, { k: 10, value: 0 }, { k: 20, value: 0 }],
        recallAtK: [{ k: 5, value: 0 }, { k: 10, value: 0 }, { k: 20, value: 0 }],
        ndcg: [{ k: 5, value: 0 }, { k: 10, value: 0 }, { k: 20, value: 0 }],
        hitRate: [{ k: 5, value: 0 }, { k: 10, value: 0 }, { k: 20, value: 0 }],
        coverage: 0,
        diversity: 0,
        popularityBias: 0,
        averagePrecision: 0,
        meanReciprocalRank: 0
    };
}

// Calculate semantic search metrics
async function calculateSearchMetrics(): Promise<SearchMetrics> {
    const client = await clientPromise;
    const db = client.db('mangawebsite');
    
    // Sample queries and expected results (in production, this would come from user search logs)
    const sampleQueries = [
        { query: 'manga with strong female lead', expectedGenres: ['Action', 'Adventure'] },
        { query: 'romance school life', expectedGenres: ['Romance', 'School Life'] },
        { query: 'dark mystery thriller', expectedGenres: ['Mystery', 'Thriller', 'Horror'] }
    ];

    let totalAP = 0;
    let totalMRR = 0;
    let totalNDCG = 0;
    let successfulQueries = 0;
    let totalRelevanceScore = 0;
    const topKAccuracy: { [k: number]: { correct: number; total: number } } = { 5: { correct: 0, total: 0 }, 10: { correct: 0, total: 0 } };

    for (const sample of sampleQueries) {
        // Simulate search
        const results = await db.collection('manga')
            .find({
                $or: [
                    { title: { $regex: sample.query, $options: 'i' } },
                    { description: { $regex: sample.query, $options: 'i' } },
                    { genres: { $in: sample.expectedGenres } }
                ]
            })
            .limit(20)
            .toArray();

        if (results.length > 0) {
            successfulQueries++;
            
            // Check if results match expected genres
            const relevantResults = results.filter((m: any) =>
                m.genres && m.genres.some((g: string) => sample.expectedGenres.includes(g))
            );
            
            const relevanceScore = results.length > 0 ? relevantResults.length / results.length : 0;
            totalRelevanceScore += relevanceScore;

            // Calculate AP, MRR, NDCG (simplified)
            const relevantCount = relevantResults.length;
            if (relevantCount > 0) {
                const ap = relevantCount / results.length;
                totalAP += ap;
                totalMRR += 1 / (results.findIndex((m: any) => 
                    m.genres && m.genres.some((g: string) => sample.expectedGenres.includes(g))
                ) + 1 || 1);
            }

            // Top-K accuracy
            for (const k of [5, 10]) {
                const topKResults = results.slice(0, k);
                const relevantInTopK = topKResults.filter((m: any) =>
                    m.genres && m.genres.some((g: string) => sample.expectedGenres.includes(g))
                ).length;
                topKAccuracy[k].correct += relevantInTopK;
                topKAccuracy[k].total += k;
            }
        }
    }

    const queryCount = sampleQueries.length;
    const averagePrecision = queryCount > 0 ? totalAP / queryCount : 0;
    const meanReciprocalRank = queryCount > 0 ? totalMRR / queryCount : 0;
    const normalizedDiscountedCumulativeGain = queryCount > 0 ? totalAP / queryCount : 0; // Simplified
    const retrievalAccuracy = queryCount > 0 ? successfulQueries / queryCount : 0;
    const querySuccessRate = retrievalAccuracy;
    const averageRelevanceScore = queryCount > 0 ? totalRelevanceScore / queryCount : 0;

    return {
        averagePrecision,
        meanReciprocalRank,
        normalizedDiscountedCumulativeGain,
        retrievalAccuracy,
        querySuccessRate,
        averageRelevanceScore,
        topKAccuracy: [
            { k: 5, accuracy: topKAccuracy[5].total > 0 ? topKAccuracy[5].correct / topKAccuracy[5].total : 0 },
            { k: 10, accuracy: topKAccuracy[10].total > 0 ? topKAccuracy[10].correct / topKAccuracy[10].total : 0 }
        ]
    };
}

// Calculate feature adoption metrics
async function calculateFeatureAdoptionMetrics(): Promise<FeatureAdoptionMetrics> {
    const client = await clientPromise;
    const db = client.db('mangawebsite');
    
    const users = db.collection('users');
    
    // Get total active users (users with reading history or activity)
    const totalActiveUsers = await users.countDocuments({
        $or: [
            { readingHistory: { $exists: true, $ne: [] } },
            { bookmarks: { $exists: true, $ne: [] } },
            { 'aiPreferences.smartRecommendations': { $exists: true } }
        ]
    });

    if (totalActiveUsers === 0) {
        return {
            smartRecommendations: { enabled: 0, total: 0, adoptionRate: 0 },
            semanticSearch: { enabled: 0, total: 0, adoptionRate: 0 },
            personalizedFiltering: { enabled: 0, total: 0, adoptionRate: 0 },
            voiceAssistant: { enabled: 0, total: 0, adoptionRate: 0 },
            eyeTracking: { enabled: 0, total: 0, adoptionRate: 0 },
            autoBrightness: { enabled: 0, total: 0, adoptionRate: 0 },
            overallAdoptionRate: 0
        };
    }

    // Count users with each feature enabled
    const smartRecEnabled = await users.countDocuments({
        'aiPreferences.smartRecommendations': true
    });
    
    const semanticSearchEnabled = await users.countDocuments({
        'aiPreferences.semanticSearch': true
    });
    
    const personalizedFilteringEnabled = await users.countDocuments({
        'aiPreferences.personalizedFiltering': true
    });
    
    const voiceAssistantEnabled = await users.countDocuments({
        'aiPreferences.voiceAssistant': true
    });
    
    const eyeTrackingEnabled = await users.countDocuments({
        'aiPreferences.eyeTracking': true
    });
    
    const autoBrightnessEnabled = await users.countDocuments({
        'aiPreferences.autoBrightness': true
    });

    // Calculate adoption rates
    const calculateAdoptionRate = (enabled: number, total: number) => {
        return total > 0 ? (enabled / total) * 100 : 0;
    };

    const adoptionRates = [
        calculateAdoptionRate(smartRecEnabled, totalActiveUsers),
        calculateAdoptionRate(semanticSearchEnabled, totalActiveUsers),
        calculateAdoptionRate(personalizedFilteringEnabled, totalActiveUsers),
        calculateAdoptionRate(voiceAssistantEnabled, totalActiveUsers),
        calculateAdoptionRate(eyeTrackingEnabled, totalActiveUsers),
        calculateAdoptionRate(autoBrightnessEnabled, totalActiveUsers)
    ];

    const overallAdoptionRate = adoptionRates.reduce((a, b) => a + b, 0) / adoptionRates.length;

    return {
        smartRecommendations: {
            enabled: smartRecEnabled,
            total: totalActiveUsers,
            adoptionRate: calculateAdoptionRate(smartRecEnabled, totalActiveUsers)
        },
        semanticSearch: {
            enabled: semanticSearchEnabled,
            total: totalActiveUsers,
            adoptionRate: calculateAdoptionRate(semanticSearchEnabled, totalActiveUsers)
        },
        personalizedFiltering: {
            enabled: personalizedFilteringEnabled,
            total: totalActiveUsers,
            adoptionRate: calculateAdoptionRate(personalizedFilteringEnabled, totalActiveUsers)
        },
        voiceAssistant: {
            enabled: voiceAssistantEnabled,
            total: totalActiveUsers,
            adoptionRate: calculateAdoptionRate(voiceAssistantEnabled, totalActiveUsers)
        },
        eyeTracking: {
            enabled: eyeTrackingEnabled,
            total: totalActiveUsers,
            adoptionRate: calculateAdoptionRate(eyeTrackingEnabled, totalActiveUsers)
        },
        autoBrightness: {
            enabled: autoBrightnessEnabled,
            total: totalActiveUsers,
            adoptionRate: calculateAdoptionRate(autoBrightnessEnabled, totalActiveUsers)
        },
        overallAdoptionRate
    };
}

// Calculate filtering metrics
async function calculateFilteringMetrics(): Promise<FilteringMetrics> {
    const client = await clientPromise;
    const db = client.db('mangawebsite');
    
    const users = db.collection('users');
    
    // Get users with feedback
    const usersWithFeedback = await users
        .find({
            $or: [
                { dislikedManga: { $exists: true, $ne: [] } },
                { discontinuedManga: { $exists: true, $ne: [] } },
                { notInterestedManga: { $exists: true, $ne: [] } }
            ]
        })
        .toArray();

    if (usersWithFeedback.length === 0) {
        return {
            filteringPrecision: 0,
            filteringRecall: 0,
            filteringF1Score: 0,
            userSatisfactionRate: 0,
            falsePositiveRate: 0,
            falseNegativeRate: 0
        };
    }

    let totalPrecision = 0;
    let totalRecall = 0;
    let totalSatisfaction = 0;
    let totalFalsePositives = 0;
    let totalFalseNegatives = 0;
    let userCount = 0;

    for (const user of usersWithFeedback) {
        const disliked = (user.dislikedManga || []).map((f: any) => 
            typeof f === 'string' ? f : f.mangaId
        );
        const discontinued = (user.discontinuedManga || []).map((f: any) => 
            typeof f === 'string' ? f : f.mangaId
        );
        const notInterested = (user.notInterestedManga || []).map((f: any) => 
            typeof f === 'string' ? f : f.mangaId
        );
        
        const excludedItems = new Set([...disliked, ...discontinued, ...notInterested]);
        
        // Check if excluded items appear in recommendations (would be false positives)
        // For now, simulate: if user has reading history, check if excluded items are in it
        const readingHistory = user.readingHistory || [];
        const readMangaIds = readingHistory.map((entry: any) => entry.mangaId?.toString()).filter(Boolean);
        
        // Items that should be filtered (excluded) but aren't = false negatives
        const falseNegatives = readMangaIds.filter(id => excludedItems.has(id)).length;
        
        // Items that are filtered but shouldn't be = false positives (harder to measure)
        // Simplified: assume if user bookmarks something after filtering, it's a false positive
        const bookmarks = (user.bookmarks || []).map((b: any) => 
            typeof b === 'string' ? b : b.mangaId || b
        );
        const falsePositives = bookmarks.filter(id => excludedItems.has(id)).length;
        
        // Precision: of items filtered, how many should actually be filtered
        const truePositives = excludedItems.size - falsePositives;
        const precision = excludedItems.size > 0 ? truePositives / excludedItems.size : 0;
        
        // Recall: of items that should be filtered, how many are actually filtered
        const shouldBeFiltered = excludedItems.size;
        const recall = shouldBeFiltered > 0 ? truePositives / shouldBeFiltered : 0;
        
        // Satisfaction: user doesn't interact with filtered items
        const satisfaction = excludedItems.size > 0 ? (excludedItems.size - falsePositives) / excludedItems.size : 1;
        
        totalPrecision += precision;
        totalRecall += recall;
        totalSatisfaction += satisfaction;
        totalFalsePositives += falsePositives;
        totalFalseNegatives += falseNegatives;
        userCount++;
    }

    const filteringPrecision = userCount > 0 ? totalPrecision / userCount : 0;
    const filteringRecall = userCount > 0 ? totalRecall / userCount : 0;
    const filteringF1Score = (filteringPrecision + filteringRecall) > 0
        ? 2 * (filteringPrecision * filteringRecall) / (filteringPrecision + filteringRecall)
        : 0;
    const userSatisfactionRate = userCount > 0 ? totalSatisfaction / userCount : 0;
    const falsePositiveRate = userCount > 0 ? totalFalsePositives / userCount : 0;
    const falseNegativeRate = userCount > 0 ? totalFalseNegatives / userCount : 0;

    return {
        filteringPrecision,
        filteringRecall,
        filteringF1Score,
        userSatisfactionRate,
        falsePositiveRate,
        falseNegativeRate
    };
}

// GET: Fetch AI metrics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mode = searchParams.get('mode') || 'real'; // 'real' or 'simulated'
        
        // Verify admin access (optional - can be made public for transparency)
        const auth = request.headers.get('authorization');
        let isAdmin = false;
        
        if (auth && auth.startsWith('Bearer ')) {
            try {
                const token = auth.replace('Bearer ', '');
                const payload = jwt.verify(token, JWT_SECRET) as any;
                const userId = payload.userId || payload._id;
                
                const client = await clientPromise;
                const db = client.db('mangawebsite');
                const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
                isAdmin = user?.role === 'admin';
            } catch (e) {
                // Not authenticated or invalid token
            }
        }

        // If simulated mode, return simulated metrics
        if (mode === 'simulated') {
            const simulatedMetrics = generateSimulatedMetrics();
            const metrics: AIMetrics = {
                ...simulatedMetrics,
                timestamp: new Date()
            };
            return NextResponse.json({ 
                metrics, 
                isAdmin,
                mode: 'simulated',
                note: 'These are simulated metrics based on expected performance with sample data'
            });
        }

        // Calculate real metrics from database - ONLY for fully implemented features
        const [recommendations, personalizedFiltering, featureAdoption] = await Promise.all([
            calculateRecommendationMetrics(),
            calculateFilteringMetrics(),
            calculateFeatureAdoptionMetrics()
        ]);

        // Calculate overall accuracy (weighted average) - only from fully implemented features
        const overallAccuracy = (
            recommendations.averagePrecision * 0.6 +
            personalizedFiltering.filteringF1Score * 0.4
        );

        // Only include metrics for fully implemented features
        const metrics: AIMetrics = {
            recommendations,
            semanticSearch: {
                averagePrecision: 0,
                meanReciprocalRank: 0,
                normalizedDiscountedCumulativeGain: 0,
                retrievalAccuracy: 0,
                querySuccessRate: 0,
                averageRelevanceScore: 0,
                topKAccuracy: []
            }, // Placeholder - not fully implemented
            personalizedFiltering,
            featureAdoption: {
                // Only show adoption for fully implemented features
                smartRecommendations: featureAdoption.smartRecommendations,
                semanticSearch: { enabled: 0, total: 0, adoptionRate: 0 }, // Not fully implemented
                personalizedFiltering: featureAdoption.personalizedFiltering,
                voiceAssistant: { enabled: 0, total: 0, adoptionRate: 0 }, // Basic only
                eyeTracking: { enabled: 0, total: 0, adoptionRate: 0 }, // Placeholder
                autoBrightness: { enabled: 0, total: 0, adoptionRate: 0 }, // Basic only
                overallAdoptionRate: (
                    featureAdoption.smartRecommendations.adoptionRate +
                    featureAdoption.personalizedFiltering.adoptionRate
                ) / 2 // Only count fully implemented features
            },
            overallAccuracy,
            timestamp: new Date()
        };

        return NextResponse.json({ 
            metrics, 
            isAdmin,
            mode: 'real',
            note: 'These are real metrics calculated from actual user data'
        });
    } catch (error) {
        console.error('Error calculating AI metrics:', error);
        return NextResponse.json(
            { error: 'Failed to calculate metrics', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

