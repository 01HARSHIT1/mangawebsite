import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET: Get search suggestions
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    if (query.length < 2) {
        return NextResponse.json({ suggestions: [] });
    }
    try {
        const client = await clientPromise;
        const db = client.db();
        const manga = db.collection('manga');
        // Create text index if it doesn't exist
        try {
            await manga.createIndex({
                title: 'text',
                author: 'text',
                alternativeTitles: 'text',
            });
        } catch (error) {
            // Index might already exist
        }
        // Search for suggestions
        const suggestions = await manga
            .aggregate([
                {
                    $match: {
                        $or: [
                            { title: { $regex: query, $options: 'i' } },
                            { author: { $regex: query, $options: 'i' } },
                            { alternativeTitles: { $regex: query, $options: 'i' } },
                        ],
                    },
                },
                {
                    $project: {
                        title: 1,
                        author: 1,
                        alternativeTitles: 1,
                        score: {
                            $add: [
                                { $cond: [{ $regexMatch: { input: '$title', regex: query, options: 'i' } }, 10, 0] },
                                { $cond: [{ $regexMatch: { input: '$author', regex: query, options: 'i' } }, 5, 0] },
                                { $cond: [{ $regexMatch: { input: '$alternativeTitles', regex: query, options: 'i' } }, 3, 0] },
                            ],
                        },
                    },
                },
                { $sort: { score: -1 } },
                { $limit: 10 },
            ])
            .toArray();
        // Extract unique suggestions
        const uniqueSuggestions = new Set<string>();
        suggestions.forEach(item => {
            if (item.title && item.title.toLowerCase().includes(query.toLowerCase())) {
                uniqueSuggestions.add(item.title);
            }
            if (item.author && item.author.toLowerCase().includes(query.toLowerCase())) {
                uniqueSuggestions.add(item.author);
            }
            if (item.alternativeTitles) {
                item.alternativeTitles.forEach((altTitle: string) => {
                    if (altTitle.toLowerCase().includes(query.toLowerCase())) {
                        uniqueSuggestions.add(altTitle);
                    }
                });
            }
        });
        // Convert to array and limit results
        const suggestionArray = Array.from(uniqueSuggestions).slice(0, 8);
        return NextResponse.json({ suggestions: suggestionArray });
    } catch (error) {
        console.error('Error getting suggestions:', error);
        return NextResponse.json({ suggestions: [] });
    }
} 