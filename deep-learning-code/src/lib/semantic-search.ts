// Semantic Search Engine for Manga
// Uses text similarity and keyword matching for natural language queries

interface MangaDocument {
    _id: string;
    title: string;
    description: string;
    genres: string[];
    tags: string[];
    author: string;
    status: string;
    rating: number;
}

interface SearchResult {
    manga: MangaDocument;
    score: number;
    matchReasons: string[];
}

export class SemanticSearchEngine {
    // Natural language query patterns
    private queryPatterns = {
        'strong female lead': ['female', 'woman', 'girl', 'heroine', 'protagonist'],
        'school life': ['school', 'academy', 'student', 'education'],
        'mystery': ['mystery', 'detective', 'investigation', 'secret', 'puzzle'],
        'romance': ['romance', 'love', 'relationship', 'dating', 'couple'],
        'action': ['action', 'fight', 'battle', 'combat', 'war'],
        'comedy': ['comedy', 'funny', 'humor', 'laugh', 'joke'],
        'dark': ['dark', 'tragic', 'gritty', 'mature', 'serious'],
        'emotional': ['emotional', 'drama', 'feels', 'sad', 'touching'],
        'fast-paced': ['fast', 'quick', 'intense', 'exciting', 'thrilling'],
        'slow burn': ['slow', 'gradual', 'developing', 'building'],
    };

    // Extract keywords from natural language query
    private extractKeywords(query: string): string[] {
        const lowerQuery = query.toLowerCase();
        const keywords: string[] = [];
        
        // Check for pattern matches
        for (const [pattern, synonyms] of Object.entries(this.queryPatterns)) {
            if (lowerQuery.includes(pattern)) {
                keywords.push(...synonyms);
            }
        }
        
        // Extract individual words (remove common stop words)
        const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'where', 'when', 'why', 'how', 'manga', 'with', 'similar', 'like'];
        const words = lowerQuery.split(/\s+/).filter(word => 
            word.length > 2 && !stopWords.includes(word)
        );
        
        keywords.push(...words);
        
        return [...new Set(keywords)]; // Remove duplicates
    }

    // Calculate semantic similarity score
    private calculateSimilarity(query: string, manga: MangaDocument): { score: number; reasons: string[] } {
        const lowerQuery = query.toLowerCase();
        const keywords = this.extractKeywords(query);
        let score = 0;
        const reasons: string[] = [];

        // Title match (highest weight)
        const titleLower = manga.title.toLowerCase();
        if (titleLower.includes(lowerQuery)) {
            score += 0.4;
            reasons.push('Title matches');
        } else {
            // Partial title match
            const queryWords = lowerQuery.split(/\s+/);
            const titleWords = titleLower.split(/\s+/);
            const matchingTitleWords = queryWords.filter(qw => 
                titleWords.some(tw => tw.includes(qw) || qw.includes(tw))
            );
            if (matchingTitleWords.length > 0) {
                score += 0.2 * (matchingTitleWords.length / queryWords.length);
                reasons.push('Title partially matches');
            }
        }

        // Description match
        const descLower = (manga.description || '').toLowerCase();
        let descMatches = 0;
        keywords.forEach(keyword => {
            if (descLower.includes(keyword)) {
                descMatches++;
            }
        });
        if (descMatches > 0) {
            score += 0.3 * (descMatches / keywords.length);
            reasons.push('Description matches');
        }

        // Genre match
        const genreLower = manga.genres.map(g => g.toLowerCase());
        const genreMatches = keywords.filter(kw => 
            genreLower.some(genre => genre.includes(kw) || kw.includes(genre))
        );
        if (genreMatches.length > 0) {
            score += 0.15 * (genreMatches.length / keywords.length);
            reasons.push('Genre matches');
        }

        // Tag match
        const tagLower = (manga.tags || []).map(t => t.toLowerCase());
        const tagMatches = keywords.filter(kw => 
            tagLower.some(tag => tag.includes(kw) || kw.includes(tag))
        );
        if (tagMatches.length > 0) {
            score += 0.1 * (tagMatches.length / keywords.length);
            reasons.push('Tags match');
        }

        // Author match
        const authorLower = (manga.author || '').toLowerCase();
        if (authorLower.includes(lowerQuery) || lowerQuery.includes(authorLower)) {
            score += 0.05;
            reasons.push('Author matches');
        }

        // Boost for high-rated manga
        if (manga.rating >= 4.5) {
            score *= 1.1;
        }

        return { score: Math.min(score, 1), reasons };
    }

    // Search manga using semantic matching
    async search(
        query: string,
        mangaList: MangaDocument[],
        limit: number = 20
    ): Promise<SearchResult[]> {
        if (!query || query.trim().length === 0) {
            return [];
        }

        const results: SearchResult[] = [];

        for (const manga of mangaList) {
            const { score, reasons } = this.calculateSimilarity(query, manga);
            
            if (score > 0) {
                results.push({
                    manga,
                    score,
                    matchReasons: reasons
                });
            }
        }

        // Sort by score (descending)
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, limit);
    }

    // Enhanced search with user preferences
    async searchWithPreferences(
        query: string,
        mangaList: MangaDocument[],
        userPreferences: {
            preferredGenres?: string[];
            dislikedGenres?: string[];
            minRating?: number;
        } = {},
        limit: number = 20
    ): Promise<SearchResult[]> {
        const results = await this.search(query, mangaList, limit * 2);

        // Apply user preferences
        const filteredResults = results
            .filter(result => {
                const manga = result.manga;

                // Filter by preferred genres
                if (userPreferences.preferredGenres && userPreferences.preferredGenres.length > 0) {
                    const hasPreferredGenre = manga.genres.some(genre =>
                        userPreferences.preferredGenres!.some(pref => 
                            genre.toLowerCase().includes(pref.toLowerCase())
                        )
                    );
                    if (hasPreferredGenre) {
                        result.score *= 1.2; // Boost for preferred genres
                    }
                }

                // Filter out disliked genres
                if (userPreferences.dislikedGenres && userPreferences.dislikedGenres.length > 0) {
                    const hasDislikedGenre = manga.genres.some(genre =>
                        userPreferences.dislikedGenres!.some(disliked => 
                            genre.toLowerCase().includes(disliked.toLowerCase())
                        )
                    );
                    if (hasDislikedGenre) {
                        result.score *= 0.5; // Reduce score for disliked genres
                    }
                }

                // Filter by minimum rating
                if (userPreferences.minRating && manga.rating < userPreferences.minRating) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => b.score - a.score);

        return filteredResults.slice(0, limit);
    }
}

// Singleton instance
let searchEngine: SemanticSearchEngine | null = null;

export function getSemanticSearchEngine(): SemanticSearchEngine {
    if (!searchEngine) {
        searchEngine = new SemanticSearchEngine();
    }
    return searchEngine;
}

