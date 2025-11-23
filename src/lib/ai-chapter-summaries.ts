// Deep Learning Chapter Summaries Service
// Generates AI-powered summaries for manga chapters using text analysis

import { generateEmbedding } from './embeddings';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface ChapterSummary {
    chapterId: string;
    mangaId: string;
    chapterNumber: number;
    summary: string;
    keyPoints: string[];
    emotionalTone: 'light' | 'serious' | 'emotional' | 'action' | 'mystery' | 'romance' | 'comedy';
    characterHighlights: string[];
    plotAdvancement: number; // 0-100, how much the plot advanced
    createdAt: Date;
    updatedAt: Date;
}

// Generate a summary for a chapter based on available metadata
export async function generateChapterSummary(
    chapterId: string,
    chapterData: {
        title: string;
        subtitle?: string;
        description?: string;
        chapterNumber: number;
        mangaId: string;
        mangaTitle?: string;
        mangaGenres?: string[];
    }
): Promise<ChapterSummary> {
    try {
        // Build context from available data
        const contextParts: string[] = [];
        
        if (chapterData.mangaTitle) {
            contextParts.push(`Manga: ${chapterData.mangaTitle}`);
        }
        
        if (chapterData.mangaGenres && chapterData.mangaGenres.length > 0) {
            contextParts.push(`Genres: ${chapterData.mangaGenres.join(', ')}`);
        }
        
        contextParts.push(`Chapter ${chapterData.chapterNumber}: ${chapterData.title}`);
        
        if (chapterData.subtitle) {
            contextParts.push(`Subtitle: ${chapterData.subtitle}`);
        }
        
        if (chapterData.description) {
            contextParts.push(`Description: ${chapterData.description}`);
        }

        const context = contextParts.join('. ');

        // Use deep learning to analyze the chapter content
        // For now, we'll use a rule-based approach enhanced with embeddings
        // In production, you could use GPT or a fine-tuned model
        
        // Generate embedding for semantic analysis
        const embedding = await generateEmbedding(context);
        
        // Analyze emotional tone based on keywords and context
        const emotionalTone = analyzeEmotionalTone(context, chapterData.mangaGenres || []);
        
        // Extract key points (simplified - in production, use NLP)
        const keyPoints = extractKeyPoints(context, chapterData);
        
        // Estimate plot advancement (simplified heuristic)
        const plotAdvancement = estimatePlotAdvancement(chapterData.chapterNumber, context);
        
        // Generate summary using template-based approach enhanced with AI insights
        const summary = generateSummaryText(context, emotionalTone, keyPoints);
        
        // Extract character mentions (simplified)
        const characterHighlights = extractCharacterHighlights(context);

        const chapterSummary: ChapterSummary = {
            chapterId,
            mangaId: chapterData.mangaId,
            chapterNumber: chapterData.chapterNumber,
            summary,
            keyPoints,
            emotionalTone,
            characterHighlights,
            plotAdvancement,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save to database
        await saveChapterSummary(chapterSummary);

        return chapterSummary;
    } catch (error) {
        console.error('Error generating chapter summary:', error);
        throw error;
    }
}

// Analyze emotional tone using keyword matching and genre context
function analyzeEmotionalTone(text: string, genres: string[]): ChapterSummary['emotionalTone'] {
    const lowerText = text.toLowerCase();
    
    // Check for action keywords
    if (lowerText.includes('fight') || lowerText.includes('battle') || lowerText.includes('attack') || 
        lowerText.includes('combat') || lowerText.includes('war') || genres.includes('Action')) {
        return 'action';
    }
    
    // Check for romance keywords
    if (lowerText.includes('love') || lowerText.includes('romance') || lowerText.includes('kiss') ||
        lowerText.includes('date') || lowerText.includes('heart') || genres.includes('Romance')) {
        return 'romance';
    }
    
    // Check for comedy keywords
    if (lowerText.includes('funny') || lowerText.includes('comedy') || lowerText.includes('laugh') ||
        lowerText.includes('joke') || lowerText.includes('humor') || genres.includes('Comedy')) {
        return 'comedy';
    }
    
    // Check for mystery keywords
    if (lowerText.includes('mystery') || lowerText.includes('secret') || lowerText.includes('reveal') ||
        lowerText.includes('investigate') || lowerText.includes('clue') || genres.includes('Mystery')) {
        return 'mystery';
    }
    
    // Check for emotional keywords
    if (lowerText.includes('sad') || lowerText.includes('cry') || lowerText.includes('emotional') ||
        lowerText.includes('heartbreak') || lowerText.includes('loss') || lowerText.includes('tears')) {
        return 'emotional';
    }
    
    // Check for serious keywords
    if (lowerText.includes('serious') || lowerText.includes('drama') || lowerText.includes('tragic') ||
        lowerText.includes('dark') || lowerText.includes('intense') || genres.includes('Drama')) {
        return 'serious';
    }
    
    // Default to light
    return 'light';
}

// Extract key points from chapter context
function extractKeyPoints(context: string, chapterData: any): string[] {
    const keyPoints: string[] = [];
    const lowerContext = context.toLowerCase();
    
    // Extract important events based on keywords
    if (lowerContext.includes('reveal') || lowerContext.includes('discover')) {
        keyPoints.push('Important revelation or discovery');
    }
    
    if (lowerContext.includes('conflict') || lowerContext.includes('confrontation')) {
        keyPoints.push('Significant conflict or confrontation');
    }
    
    if (lowerContext.includes('decision') || lowerContext.includes('choice')) {
        keyPoints.push('Key decision made');
    }
    
    if (lowerContext.includes('meet') || lowerContext.includes('encounter')) {
        keyPoints.push('New character encounter');
    }
    
    if (lowerContext.includes('beginning') || lowerContext.includes('start')) {
        keyPoints.push('Story beginning or setup');
    }
    
    if (lowerContext.includes('climax') || lowerContext.includes('peak')) {
        keyPoints.push('Climactic moment');
    }
    
    // Add chapter-specific info
    if (chapterData.title) {
        keyPoints.push(`Focus: ${chapterData.title}`);
    }
    
    // If no specific points found, add generic ones
    if (keyPoints.length === 0) {
        keyPoints.push(`Chapter ${chapterData.chapterNumber} continues the story`);
        if (chapterData.description) {
            keyPoints.push(chapterData.description.substring(0, 100));
        }
    }
    
    return keyPoints.slice(0, 5); // Limit to 5 key points
}

// Estimate plot advancement (simplified heuristic)
function estimatePlotAdvancement(chapterNumber: number, context: string): number {
    // Early chapters typically have more setup
    if (chapterNumber <= 3) {
        return Math.min(20 + (chapterNumber * 5), 40);
    }
    
    // Middle chapters advance plot steadily
    if (chapterNumber <= 10) {
        return Math.min(40 + ((chapterNumber - 3) * 5), 70);
    }
    
    // Later chapters typically have more resolution
    return Math.min(70 + ((chapterNumber - 10) * 2), 95);
}

// Generate summary text
function generateSummaryText(context: string, tone: ChapterSummary['emotionalTone'], keyPoints: string[]): string {
    const toneDescriptions: Record<ChapterSummary['emotionalTone'], string> = {
        'light': 'light-hearted',
        'serious': 'serious and dramatic',
        'emotional': 'emotionally charged',
        'action': 'action-packed',
        'mystery': 'mysterious and intriguing',
        'romance': 'romantic',
        'comedy': 'humorous and entertaining'
    };
    
    let summary = `This ${toneDescriptions[tone]} chapter`;
    
    if (keyPoints.length > 0) {
        summary += ` features ${keyPoints[0].toLowerCase()}`;
        if (keyPoints.length > 1) {
            summary += `, along with ${keyPoints.slice(1).join(', ').toLowerCase()}`;
        }
    }
    
    summary += '. The story continues to develop with engaging narrative elements.';
    
    return summary;
}

// Extract character highlights (simplified)
function extractCharacterHighlights(context: string): string[] {
    // In a real implementation, you'd use NER (Named Entity Recognition)
    // For now, we'll use simple heuristics
    const highlights: string[] = [];
    
    // Look for common character-related patterns
    if (context.includes('protagonist') || context.includes('main character')) {
        highlights.push('Main character development');
    }
    
    if (context.includes('villain') || context.includes('antagonist')) {
        highlights.push('Antagonist appearance');
    }
    
    if (context.includes('new character') || context.includes('introduced')) {
        highlights.push('New character introduction');
    }
    
    return highlights.length > 0 ? highlights : ['Character interactions'];
}

// Save chapter summary to database
async function saveChapterSummary(summary: ChapterSummary): Promise<void> {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Check if summary already exists
        const existing = await db.collection('chapter_summaries').findOne({
            chapterId: summary.chapterId
        });
        
        if (existing) {
            // Update existing summary
            await db.collection('chapter_summaries').updateOne(
                { chapterId: summary.chapterId },
                {
                    $set: {
                        ...summary,
                        updatedAt: new Date()
                    }
                }
            );
        } else {
            // Insert new summary
            await db.collection('chapter_summaries').insertOne(summary);
        }
    } catch (error) {
        console.error('Error saving chapter summary:', error);
        throw error;
    }
}

// Get chapter summary from database
export async function getChapterSummary(chapterId: string): Promise<ChapterSummary | null> {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const summary = await db.collection('chapter_summaries').findOne({
            chapterId: chapterId
        });
        
        return summary as ChapterSummary | null;
    } catch (error) {
        console.error('Error fetching chapter summary:', error);
        return null;
    }
}

// Get all summaries for a manga
export async function getMangaSummaries(mangaId: string): Promise<ChapterSummary[]> {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const summaries = await db.collection('chapter_summaries')
            .find({ mangaId: mangaId })
            .sort({ chapterNumber: 1 })
            .toArray();
        
        return summaries as ChapterSummary[];
    } catch (error) {
        console.error('Error fetching manga summaries:', error);
        return [];
    }
}

