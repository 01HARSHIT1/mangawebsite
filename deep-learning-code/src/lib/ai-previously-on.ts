// Deep Learning "Previously On..." Recap Service
// Generates AI-powered recaps when users return to a manga

import { generateEmbedding } from './embeddings';
import { getChapterSummary, getMangaSummaries } from './ai-chapter-summaries';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

export interface PreviouslyOnRecap {
    mangaId: string;
    userId: string;
    lastReadChapter: number;
    recap: string;
    keyEvents: string[];
    characterStatus: string[];
    plotSummary: string;
    nextChapterPreview: string;
    createdAt: Date;
}

// Generate a "Previously On..." recap for a user returning to a manga
export async function generatePreviouslyOnRecap(
    userId: string,
    mangaId: string,
    lastReadChapterNumber: number
): Promise<PreviouslyOnRecap> {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Get manga info
        const manga = await db.collection('manga').findOne({ _id: new ObjectId(mangaId) });
        if (!manga) {
            throw new Error('Manga not found');
        }
        
        // Get all chapter summaries up to the last read chapter
        const allSummaries = await getMangaSummaries(mangaId);
        const readSummaries = allSummaries.filter(s => s.chapterNumber <= lastReadChapterNumber);
        
        // Get user's reading history for this manga
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        const readingHistory = user?.readingHistory || [];
        const mangaHistory = readingHistory.filter((h: any) => h.mangaId === mangaId);
        
        // Generate recap based on summaries and reading patterns
        const recap = generateRecapText(manga, readSummaries, lastReadChapterNumber);
        const keyEvents = extractKeyEvents(readSummaries);
        const characterStatus = extractCharacterStatus(readSummaries, manga);
        const plotSummary = generatePlotSummary(readSummaries, manga);
        const nextChapterPreview = generateNextChapterPreview(manga, lastReadChapterNumber);
        
        const previouslyOn: PreviouslyOnRecap = {
            mangaId,
            userId,
            lastReadChapter: lastReadChapterNumber,
            recap,
            keyEvents,
            characterStatus,
            plotSummary,
            nextChapterPreview,
            createdAt: new Date()
        };
        
        // Save recap to database
        await savePreviouslyOnRecap(previouslyOn);
        
        return previouslyOn;
    } catch (error) {
        console.error('Error generating Previously On recap:', error);
        throw error;
    }
}

// Generate recap text from chapter summaries
function generateRecapText(manga: any, summaries: any[], lastChapter: number): string {
    if (summaries.length === 0) {
        return `Welcome back to ${manga.title || 'this manga'}! You're starting from the beginning.`;
    }
    
    let recap = `Previously on ${manga.title || 'this manga'}...\n\n`;
    
    // Group summaries by emotional tone or plot points
    const recentSummaries = summaries.slice(-5); // Last 5 chapters
    
    if (recentSummaries.length > 0) {
        recap += `In the recent chapters, `;
        
        const events: string[] = [];
        recentSummaries.forEach((summary, idx) => {
            if (summary.keyPoints && summary.keyPoints.length > 0) {
                events.push(`Chapter ${summary.chapterNumber}: ${summary.keyPoints[0]}`);
            }
        });
        
        if (events.length > 0) {
            recap += events.join('. ') + '. ';
        }
        
        // Add overall plot summary
        if (summaries.length > 0) {
            const overallTone = getMostCommonTone(summaries);
            recap += `The story has been ${overallTone}, with significant developments in the plot.`;
        }
    }
    
    recap += `\n\nYou last read Chapter ${lastChapter}. Ready to continue?`;
    
    return recap;
}

// Extract key events from summaries
function extractKeyEvents(summaries: any[]): string[] {
    const events: string[] = [];
    
    summaries.forEach(summary => {
        if (summary.keyPoints && summary.keyPoints.length > 0) {
            summary.keyPoints.forEach((point: string) => {
                if (!events.includes(point)) {
                    events.push(point);
                }
            });
        }
    });
    
    // Return most recent and important events
    return events.slice(-10).reverse();
}

// Extract character status from summaries
function extractCharacterStatus(summaries: any[], manga: any): string[] {
    const status: string[] = [];
    
    summaries.forEach(summary => {
        if (summary.characterHighlights && summary.characterHighlights.length > 0) {
            summary.characterHighlights.forEach((highlight: string) => {
                if (!status.includes(highlight)) {
                    status.push(highlight);
                }
            });
        }
    });
    
    if (status.length === 0) {
        status.push('Characters continue to develop throughout the story');
    }
    
    return status.slice(-5); // Last 5 character highlights
}

// Generate plot summary
function generatePlotSummary(summaries: any[], manga: any): string {
    if (summaries.length === 0) {
        return manga.description || 'The story begins...';
    }
    
    // Calculate overall plot advancement
    const avgAdvancement = summaries.reduce((sum, s) => sum + (s.plotAdvancement || 0), 0) / summaries.length;
    
    let plotSummary = '';
    
    if (avgAdvancement < 30) {
        plotSummary = 'The story is in its early stages, setting up the world and characters.';
    } else if (avgAdvancement < 60) {
        plotSummary = 'The plot is developing with increasing complexity and character interactions.';
    } else if (avgAdvancement < 80) {
        plotSummary = 'The story is reaching critical moments with major plot developments.';
    } else {
        plotSummary = 'The narrative is approaching its climax with significant revelations.';
    }
    
    return plotSummary;
}

// Generate next chapter preview
function generateNextChapterPreview(manga: any, lastChapter: number): string {
    return `Chapter ${lastChapter + 1} awaits! The story continues with new developments and exciting moments.`;
}

// Get most common emotional tone
function getMostCommonTone(summaries: any[]): string {
    const toneCounts: Record<string, number> = {};
    
    summaries.forEach(summary => {
        const tone = summary.emotionalTone || 'light';
        toneCounts[tone] = (toneCounts[tone] || 0) + 1;
    });
    
    let maxCount = 0;
    let mostCommon = 'light';
    
    Object.entries(toneCounts).forEach(([tone, count]) => {
        if (count > maxCount) {
            maxCount = count;
            mostCommon = tone;
        }
    });
    
    return mostCommon;
}

// Save recap to database
async function savePreviouslyOnRecap(recap: PreviouslyOnRecap): Promise<void> {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        // Check if recap already exists
        const existing = await db.collection('previously_on_recaps').findOne({
            mangaId: recap.mangaId,
            userId: recap.userId
        });
        
        if (existing) {
            // Update existing recap
            await db.collection('previously_on_recaps').updateOne(
                { mangaId: recap.mangaId, userId: recap.userId },
                {
                    $set: {
                        ...recap,
                        createdAt: new Date()
                    }
                }
            );
        } else {
            // Insert new recap
            await db.collection('previously_on_recaps').insertOne(recap);
        }
    } catch (error) {
        console.error('Error saving Previously On recap:', error);
        throw error;
    }
}

// Get Previously On recap
export async function getPreviouslyOnRecap(userId: string, mangaId: string): Promise<PreviouslyOnRecap | null> {
    try {
        const client = await clientPromise;
        const db = client.db('mangawebsite');
        
        const recap = await db.collection('previously_on_recaps').findOne({
            mangaId: mangaId,
            userId: userId
        });
        
        return recap as PreviouslyOnRecap | null;
    } catch (error) {
        console.error('Error fetching Previously On recap:', error);
        return null;
    }
}

