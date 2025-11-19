// Deep Learning Embeddings Service for Semantic Search
// Uses Sentence Transformers for generating text embeddings

import { pipeline, Pipeline } from '@xenova/transformers';

let embeddingPipeline: Pipeline | null = null;

// Initialize the embedding model (lazy loading)
async function getEmbeddingPipeline(): Promise<Pipeline> {
    if (!embeddingPipeline) {
        try {
            // Use a lightweight multilingual model for better performance
            // 'Xenova/all-MiniLM-L6-v2' is a good balance of speed and accuracy
            embeddingPipeline = await pipeline(
                'feature-extraction',
                'Xenova/all-MiniLM-L6-v2',
                {
                    quantized: true, // Use quantized model for faster loading
                    device: 'cpu' // Use CPU (can be changed to 'gpu' if available)
                }
            );
            console.log('✅ Embedding model loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load embedding model:', error);
            throw error;
        }
    }
    return embeddingPipeline;
}

// Generate embedding for a text string
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        if (!text || text.trim().length === 0) {
            throw new Error('Text cannot be empty');
        }

        const model = await getEmbeddingPipeline();
        
        // Generate embedding
        const output = await model(text, {
            pooling: 'mean', // Use mean pooling for sentence-level embeddings
            normalize: true // Normalize embeddings for cosine similarity
        });

        // Convert tensor to array
        const embedding = Array.from(output.data);
        return embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

// Generate embeddings for multiple texts (batch processing)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        const model = await getEmbeddingPipeline();
        const embeddings: number[][] = [];

        // Process in batches to avoid memory issues
        const batchSize = 10;
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const batchEmbeddings = await Promise.all(
                batch.map(text => generateEmbedding(text))
            );
            embeddings.push(...batchEmbeddings);
        }

        return embeddings;
    } catch (error) {
        console.error('Error generating batch embeddings:', error);
        throw error;
    }
}

// Calculate cosine similarity between two embeddings
export function cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
}

// Create a searchable text representation for manga
export function createMangaSearchText(manga: {
    title: string;
    description?: string;
    genres?: string[];
    tags?: string[];
    author?: string;
}): string {
    const parts: string[] = [];

    // Title (most important)
    if (manga.title) {
        parts.push(manga.title);
    }

    // Description
    if (manga.description) {
        parts.push(manga.description);
    }

    // Genres
    if (manga.genres && manga.genres.length > 0) {
        parts.push(manga.genres.join(', '));
    }

    // Tags
    if (manga.tags && manga.tags.length > 0) {
        parts.push(manga.tags.join(', '));
    }

    // Author
    if (manga.author) {
        parts.push(`by ${manga.author}`);
    }

    return parts.join('. ');
}

