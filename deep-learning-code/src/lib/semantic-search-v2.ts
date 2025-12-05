// Deep Learning Semantic Search Engine v2
// Uses sentence transformers for true semantic understanding

import { generateEmbedding, cosineSimilarity, createMangaSearchText } from './embeddings';

interface MangaDocument {
    _id: string;
    title: string;
    description?: string;
    genres?: string[];
    tags?: string[];
    author?: string;
    status?: string;
    rating?: number;
    embedding?: number[]; // Pre-computed embedding
}

interface SearchResult {
    manga: MangaDocument;
    score: number;
    matchReasons: string[];
}

export class DeepSemanticSearchEngine {
    private embeddingCache: Map<string, number[]> = new Map();

    // Generate or retrieve embedding for manga
    private async getMangaEmbedding(manga: MangaDocument): Promise<number[]> {
        // Check cache first
        if (manga.embedding && manga.embedding.length > 0) {
            return manga.embedding;
        }

        const cacheKey = manga._id;
        if (this.embeddingCache.has(cacheKey)) {
            return this.embeddingCache.get(cacheKey)!;
        }

        // Generate embedding from manga text
        const searchText = createMangaSearchText(manga);
        const embedding = await generateEmbedding(searchText);
        
        // Cache it
        this.embeddingCache.set(cacheKey, embedding);
        
        return embedding;
    }

    // Perform semantic search using embeddings
    async search(
        query: string,
        mangaList: MangaDocument[],
        limit: number = 20
    ): Promise<SearchResult[]> {
        if (!query || query.trim().length === 0) {
            return [];
        }

        try {
            // Generate embedding for query
            const queryEmbedding = await generateEmbedding(query);

            // Calculate similarity for each manga
            const results: SearchResult[] = [];

            for (const manga of mangaList) {
                try {
                    const mangaEmbedding = await this.getMangaEmbedding(manga);
                    const similarity = cosineSimilarity(queryEmbedding, mangaEmbedding);

                    if (similarity > 0.1) { // Threshold to filter out irrelevant results
                        // Additional scoring based on metadata
                        let finalScore = similarity;
                        const reasons: string[] = [];

                        // Boost for exact title matches
                        if (manga.title.toLowerCase().includes(query.toLowerCase())) {
                            finalScore += 0.1;
                            reasons.push('Title match');
                        }

                        // Boost for high ratings
                        if (manga.rating && manga.rating > 4.0) {
                            finalScore += 0.05;
                        }

                        // Boost for ongoing manga (if query suggests current content)
                        if (manga.status === 'ongoing' && query.toLowerCase().includes('new') || 
                            query.toLowerCase().includes('latest') || 
                            query.toLowerCase().includes('current')) {
                            finalScore += 0.05;
                            reasons.push('Status match');
                        }

                        results.push({
                            manga,
                            score: Math.min(finalScore, 1.0), // Cap at 1.0
                            matchReasons: reasons.length > 0 ? reasons : ['Semantic match']
                        });
                    }
                } catch (error) {
                    console.error(`Error processing manga ${manga._id}:`, error);
                    // Continue with next manga
                }
            }

            // Sort by score (descending)
            results.sort((a, b) => b.score - a.score);

            return results.slice(0, limit);
        } catch (error) {
            console.error('Error in semantic search:', error);
            // Fallback to empty results
            return [];
        }
    }

    // Enhanced search with user preferences
    async searchWithPreferences(
        query: string,
        mangaList: MangaDocument[],
        userPreferences: {
            preferredGenres?: string[];
            dislikedGenres?: string[];
            minRating?: number;
            excludeDislikedManga?: boolean;
            dislikedMangaIds?: string[];
        } = {},
        limit: number = 20
    ): Promise<SearchResult[]> {
        // First, perform semantic search
        const semanticResults = await this.search(query, mangaList, limit * 2);

        // Apply user preferences
        const filteredResults = semanticResults
            .filter(result => {
                const manga = result.manga;

                // Exclude disliked manga
                if (userPreferences.excludeDislikedManga && userPreferences.dislikedMangaIds) {
                    if (userPreferences.dislikedMangaIds.includes(manga._id)) {
                        return false;
                    }
                }

                // Filter by minimum rating
                if (userPreferences.minRating && manga.rating && manga.rating < userPreferences.minRating) {
                    return false;
                }

                // Boost for preferred genres
                if (userPreferences.preferredGenres && userPreferences.preferredGenres.length > 0) {
                    const hasPreferredGenre = manga.genres?.some(genre =>
                        userPreferences.preferredGenres!.some(pref =>
                            genre.toLowerCase().includes(pref.toLowerCase())
                        )
                    );
                    if (hasPreferredGenre) {
                        result.score *= 1.15; // Boost score
                    }
                }

                // Reduce score for disliked genres
                if (userPreferences.dislikedGenres && userPreferences.dislikedGenres.length > 0) {
                    const hasDislikedGenre = manga.genres?.some(genre =>
                        userPreferences.dislikedGenres!.some(disliked =>
                            genre.toLowerCase().includes(disliked.toLowerCase())
                        )
                    );
                    if (hasDislikedGenre) {
                        result.score *= 0.7; // Reduce score but don't exclude
                    }
                }

                return true;
            })
            .sort((a, b) => b.score - a.score);

        return filteredResults.slice(0, limit);
    }

    // Clear embedding cache
    clearCache(): void {
        this.embeddingCache.clear();
    }
}

// Singleton instance
let searchEngine: DeepSemanticSearchEngine | null = null;

export function getDeepSemanticSearchEngine(): DeepSemanticSearchEngine {
    if (!searchEngine) {
        searchEngine = new DeepSemanticSearchEngine();
    }
    return searchEngine;
}

