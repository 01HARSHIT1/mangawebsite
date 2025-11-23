// Deep Learning Mood-Based Discovery Service
// Recommends manga based on user's current mood using sentiment analysis

import { generateEmbedding } from './embeddings';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export type MoodType = 'funny' | 'dark' | 'chill' | 'emotional' | 'fast-paced' | 'romantic' | 'mysterious' | 'action-packed';

export interface MoodProfile {
    mood: MoodType;
    description: string;
    keywords: string[];
    genres: string[];
    emotionalTone: string[];
}

export const MOOD_PROFILES: Record<MoodType, MoodProfile> = {
    'funny': {
        mood: 'funny',
        description: 'Light-hearted and humorous content',
        keywords: ['comedy', 'funny', 'humor', 'laugh', 'joke', 'lighthearted', 'entertaining'],
        genres: ['Comedy', 'Slice of Life', 'Gag'],
        emotionalTone: ['comedy', 'light']
    },
    'dark': {
        mood: 'dark',
        description: 'Dark, intense, and serious themes',
        keywords: ['dark', 'serious', 'intense', 'tragic', 'drama', 'mature', 'psychological'],
        genres: ['Horror', 'Psychological', 'Thriller', 'Drama'],
        emotionalTone: ['serious', 'emotional']
    },
    'chill': {
        mood: 'chill',
        description: 'Relaxing and easy-going stories',
        keywords: ['relaxing', 'calm', 'peaceful', 'slice of life', 'gentle', 'soothing'],
        genres: ['Slice of Life', 'Isekai', 'Comedy'],
        emotionalTone: ['light']
    },
    'emotional': {
        mood: 'emotional',
        description: 'Emotionally impactful and moving stories',
        keywords: ['emotional', 'touching', 'heartfelt', 'sad', 'moving', 'tearjerker'],
        genres: ['Drama', 'Romance', 'Slice of Life'],
        emotionalTone: ['emotional', 'serious']
    },
    'fast-paced': {
        mood: 'fast-paced',
        description: 'Action-packed and thrilling adventures',
        keywords: ['action', 'fast', 'thrilling', 'exciting', 'adventure', 'intense'],
        genres: ['Action', 'Adventure', 'Shounen'],
        emotionalTone: ['action']
    },
    'romantic': {
        mood: 'romantic',
        description: 'Love stories and romantic content',
        keywords: ['romance', 'love', 'romantic', 'dating', 'relationship', 'heart'],
        genres: ['Romance', 'Shoujo', 'Slice of Life'],
        emotionalTone: ['romance']
    },
    'mysterious': {
        mood: 'mysterious',
        description: 'Mystery and intrigue',
        keywords: ['mystery', 'mysterious', 'secret', 'investigation', 'clue', 'puzzle'],
        genres: ['Mystery', 'Thriller', 'Horror'],
        emotionalTone: ['mystery']
    },
    'action-packed': {
        mood: 'action-packed',
        description: 'High-energy action and combat',
        keywords: ['action', 'fight', 'battle', 'combat', 'war', 'power', 'strength'],
        genres: ['Action', 'Shounen', 'Adventure'],
        emotionalTone: ['action']
    }
};

// Find manga matching a specific mood using deep learning
export async function findMangaByMood(
    mood: MoodType,
    userId?: string,
    limit: number = 20
): Promise<any[]> {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const moodProfile = MOOD_PROFILES[mood];
        
        // Get user preferences if userId provided
        let userPreferences: any = null;
        if (userId) {
            const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
            userPreferences = user?.aiPreferences || {};
        }
        
        // Build query based on mood profile
        const query: any = {
            status: 'published'
        };
        
        // Match genres
        if (moodProfile.genres.length > 0) {
            query.genres = { $in: moodProfile.genres };
        }
        
        // Get all manga matching basic criteria
        let mangaList = await db.collection('manga')
            .find(query)
            .limit(limit * 3) // Get more to filter later
            .toArray();
        
        // Score manga based on mood match using deep learning
        const scoredManga = await scoreMangaByMood(mangaList, moodProfile, userPreferences);
        
        // Sort by score and return top results
        const topManga = scoredManga
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.manga);
        
        return topManga;
    } catch (error) {
        console.error('Error finding manga by mood:', error);
        throw error;
    }
}

// Score manga based on mood match using embeddings
async function scoreMangaByMood(
    mangaList: any[],
    moodProfile: MoodProfile,
    userPreferences: any
): Promise<Array<{ manga: any; score: number; reasons: string[] }>> {
    try {
        // Generate mood embedding
        const moodText = `${moodProfile.description}. ${moodProfile.keywords.join(', ')}. ${moodProfile.genres.join(', ')}`;
        const moodEmbedding = await generateEmbedding(moodText);
        
        const scored: Array<{ manga: any; score: number; reasons: string[] }> = [];
        
        for (const manga of mangaList) {
            let score = 0;
            const reasons: string[] = [];
            
            // Build manga text representation
            const mangaText = createMangaText(manga);
            const mangaEmbedding = await generateEmbedding(mangaText);
            
            // Calculate semantic similarity
            const similarity = cosineSimilarity(moodEmbedding, mangaEmbedding);
            score += similarity * 50; // Base score from semantic similarity
            
            if (similarity > 0.7) {
                reasons.push('Strong semantic match with mood');
            }
            
            // Genre match bonus
            if (manga.genres && Array.isArray(manga.genres)) {
                const genreMatches = manga.genres.filter((g: string) => 
                    moodProfile.genres.some(mg => g.toLowerCase().includes(mg.toLowerCase()))
                );
                if (genreMatches.length > 0) {
                    score += genreMatches.length * 10;
                    reasons.push(`Matches ${genreMatches.length} preferred genre(s)`);
                }
            }
            
            // Tag/keyword match bonus
            if (manga.tags && Array.isArray(manga.tags)) {
                const tagMatches = manga.tags.filter((tag: string) =>
                    moodProfile.keywords.some(kw => tag.toLowerCase().includes(kw.toLowerCase()))
                );
                if (tagMatches.length > 0) {
                    score += tagMatches.length * 5;
                    reasons.push(`Contains ${tagMatches.length} mood-relevant tag(s)`);
                }
            }
            
            // Rating bonus (higher rated manga get slight boost)
            if (manga.rating) {
                score += (manga.rating / 5) * 5;
            }
            
            // Popularity bonus
            if (manga.views) {
                score += Math.log10(manga.views + 1) * 2;
            }
            
            // User preference bonus (if user has liked similar manga)
            if (userPreferences && userPreferences.smartRecommendations) {
                // This could be enhanced with user's reading history analysis
                score += 5; // Small bonus for personalized recommendations
            }
            
            scored.push({ manga, score, reasons });
        }
        
        return scored;
    } catch (error) {
        console.error('Error scoring manga by mood:', error);
        // Fallback to basic scoring
        return mangaList.map(manga => ({
            manga,
            score: calculateBasicMoodScore(manga, moodProfile),
            reasons: ['Basic mood match']
        }));
    }
}

// Create text representation of manga for embedding
function createMangaText(manga: any): string {
    const parts: string[] = [];
    
    if (manga.title) parts.push(manga.title);
    if (manga.description) parts.push(manga.description);
    if (manga.genres && Array.isArray(manga.genres)) parts.push(manga.genres.join(', '));
    if (manga.tags && Array.isArray(manga.tags)) parts.push(manga.tags.join(', '));
    if (manga.author) parts.push(`by ${manga.author}`);
    
    return parts.join('. ');
}

// Calculate cosine similarity
function cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }
    
    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;
    
    return dotProduct / denominator;
}

// Basic mood scoring (fallback)
function calculateBasicMoodScore(manga: any, moodProfile: MoodProfile): number {
    let score = 0;
    
    // Genre match
    if (manga.genres && Array.isArray(manga.genres)) {
        const genreMatches = manga.genres.filter((g: string) =>
            moodProfile.genres.some(mg => g.toLowerCase().includes(mg.toLowerCase()))
        );
        score += genreMatches.length * 20;
    }
    
    // Tag match
    if (manga.tags && Array.isArray(manga.tags)) {
        const tagMatches = manga.tags.filter((tag: string) =>
            moodProfile.keywords.some(kw => tag.toLowerCase().includes(kw.toLowerCase()))
        );
        score += tagMatches.length * 10;
    }
    
    // Rating
    if (manga.rating) {
        score += manga.rating * 10;
    }
    
    return score;
}

// Get mood recommendations for a user
export async function getMoodRecommendations(
    userId: string,
    mood: MoodType,
    limit: number = 12
): Promise<any[]> {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Get user's reading history to exclude already read manga
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        const readingHistory = user?.readingHistory || [];
        const readMangaIds = new Set(readingHistory.map((h: any) => h.mangaId));
        
        // Get disliked manga
        const dislikedManga = user?.dislikedManga || [];
        const dislikedIds = new Set(dislikedManga.map((m: any) => m.mangaId));
        
        // Find mood-based manga
        const moodManga = await findMangaByMood(mood, userId, limit * 2);
        
        // Filter out already read and disliked manga
        const filtered = moodManga.filter(manga => {
            const mangaId = manga._id.toString();
            return !readMangaIds.has(mangaId) && !dislikedIds.has(mangaId);
        });
        
        return filtered.slice(0, limit);
    } catch (error) {
        console.error('Error getting mood recommendations:', error);
        throw error;
    }
}

