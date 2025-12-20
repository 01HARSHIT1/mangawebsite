// AI-Powered Content Moderation for Anime Section
// Detects NSFW content, violence, and other inappropriate material

import clientPromise from './mongodb';

interface ModerationResult {
    isSafe: boolean;
    confidence: number;
    flags: ModerationFlag[];
    categories: string[];
    requiresReview: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ModerationFlag {
    category: string;
    confidence: number;
    reason: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
}

export class ContentModerationAI {
    // Moderate video thumbnail/image
    async moderateImage(imageUrl: string, metadata?: {
        title?: string;
        description?: string;
        tags?: string[];
    }): Promise<ModerationResult> {
        try {
            const flags: ModerationFlag[] = [];
            let overallConfidence = 0.9; // Start with high confidence
            let requiresReview = false;
            let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

            // Check metadata for inappropriate keywords
            if (metadata) {
                const textContent = [
                    metadata.title || '',
                    metadata.description || '',
                    ...(metadata.tags || [])
                ].join(' ').toLowerCase();

                // NSFW keyword detection
                const nsfwKeywords = [
                    'explicit', 'adult', 'hentai', 'ecchi', 'nsfw', 'nude', 'nudity',
                    'sexual', 'sex', 'porn', 'pornographic', 'erotic'
                ];
                
                const nsfwMatches = nsfwKeywords.filter(keyword => 
                    textContent.includes(keyword)
                );

                if (nsfwMatches.length > 0) {
                    flags.push({
                        category: 'nsfw',
                        confidence: 0.8,
                        reason: `Detected NSFW keywords: ${nsfwMatches.join(', ')}`,
                        severity: 'high'
                    });
                    requiresReview = true;
                    severity = 'high';
                    overallConfidence = 0.7;
                }

                // Violence keyword detection
                const violenceKeywords = [
                    'gore', 'blood', 'violence', 'torture', 'murder', 'kill',
                    'extreme violence', 'graphic violence'
                ];

                const violenceMatches = violenceKeywords.filter(keyword =>
                    textContent.includes(keyword)
                );

                if (violenceMatches.length > 0) {
                    flags.push({
                        category: 'violence',
                        confidence: 0.75,
                        reason: `Detected violence keywords: ${violenceMatches.join(', ')}`,
                        severity: 'medium'
                    });
                    if (severity === 'low') {
                        severity = 'medium';
                    }
                    requiresReview = true;
                    overallConfidence = Math.min(overallConfidence, 0.75);
                }

                // Hate speech detection
                const hateSpeechKeywords = [
                    'hate', 'racist', 'discrimination', 'offensive', 'slur'
                ];

                const hateMatches = hateSpeechKeywords.filter(keyword =>
                    textContent.includes(keyword)
                );

                if (hateMatches.length > 0) {
                    flags.push({
                        category: 'hate_speech',
                        confidence: 0.7,
                        reason: `Detected potential hate speech keywords: ${hateMatches.join(', ')}`,
                        severity: 'high'
                    });
                    requiresReview = true;
                    if (severity !== 'critical') {
                        severity = 'high';
                    }
                    overallConfidence = Math.min(overallConfidence, 0.7);
                }
            }

            // In production, you would:
            // 1. Use a computer vision API (Google Cloud Vision, AWS Rekognition, etc.)
            // 2. Use a pre-trained model for image classification
            // 3. Check against known inappropriate content databases

            // For now, we'll do basic URL and metadata checks
            const imageUrlLower = imageUrl.toLowerCase();
            if (imageUrlLower.includes('nsfw') || imageUrlLower.includes('adult')) {
                flags.push({
                    category: 'nsfw',
                    confidence: 0.9,
                    reason: 'URL contains NSFW indicators',
                    severity: 'high'
                });
                requiresReview = true;
                severity = 'high';
                overallConfidence = 0.6;
            }

            const isSafe = flags.length === 0 || severity === 'low';
            const categories = flags.map(f => f.category);

            return {
                isSafe,
                confidence: overallConfidence,
                flags,
                categories,
                requiresReview,
                severity
            };
        } catch (error) {
            console.error('Content moderation error:', error);
            // Fail safe - require review on error
            return {
                isSafe: false,
                confidence: 0.5,
                flags: [{
                    category: 'error',
                    confidence: 0.5,
                    reason: 'Moderation check failed - requires manual review',
                    severity: 'medium'
                }],
                categories: ['error'],
                requiresReview: true,
                severity: 'medium'
            };
        }
    }

    // Moderate video content (metadata and description)
    async moderateVideo(metadata: {
        title: string;
        description: string;
        tags?: string[];
        thumbnailUrl?: string;
    }): Promise<ModerationResult> {
        try {
            const flags: ModerationFlag[] = [];
            let overallConfidence = 0.9;
            let requiresReview = false;
            let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

            const textContent = [
                metadata.title,
                metadata.description,
                ...(metadata.tags || [])
            ].join(' ').toLowerCase();

            // Comprehensive keyword checks
            const moderationChecks = [
                {
                    category: 'nsfw',
                    keywords: [
                        'explicit', 'adult', 'hentai', 'ecchi', 'nsfw', 'nude', 'nudity',
                        'sexual', 'sex', 'porn', 'pornographic', 'erotic', 'mature'
                    ],
                    severity: 'high' as const
                },
                {
                    category: 'violence',
                    keywords: [
                        'gore', 'blood', 'violence', 'torture', 'murder', 'kill',
                        'extreme violence', 'graphic violence', 'brutal'
                    ],
                    severity: 'medium' as const
                },
                {
                    category: 'hate_speech',
                    keywords: [
                        'hate', 'racist', 'discrimination', 'offensive', 'slur',
                        'bigotry', 'prejudice'
                    ],
                    severity: 'high' as const
                },
                {
                    category: 'copyright',
                    keywords: [
                        'pirated', 'illegal', 'unauthorized', 'bootleg'
                    ],
                    severity: 'critical' as const
                }
            ];

            moderationChecks.forEach(check => {
                const matches = check.keywords.filter(keyword =>
                    textContent.includes(keyword)
                );

                if (matches.length > 0) {
                    flags.push({
                        category: check.category,
                        confidence: 0.8,
                        reason: `Detected ${check.category} keywords: ${matches.slice(0, 3).join(', ')}`,
                        severity: check.severity
                    });

                    if (check.severity === 'critical') {
                        severity = 'critical';
                        overallConfidence = 0.3;
                    } else if (check.severity === 'high' && severity !== 'critical') {
                        severity = 'high';
                        overallConfidence = Math.min(overallConfidence, 0.6);
                    } else if (check.severity === 'medium' && severity === 'low') {
                        severity = 'medium';
                        overallConfidence = Math.min(overallConfidence, 0.75);
                    }

                    requiresReview = true;
                }
            });

            // Check thumbnail if provided
            if (metadata.thumbnailUrl) {
                const thumbnailResult = await this.moderateImage(metadata.thumbnailUrl, {
                    title: metadata.title,
                    description: metadata.description,
                    tags: metadata.tags
                });

                if (!thumbnailResult.isSafe) {
                    flags.push(...thumbnailResult.flags);
                    if (thumbnailResult.severity === 'critical') {
                        severity = 'critical';
                    } else if (thumbnailResult.severity === 'high' && severity !== 'critical') {
                        severity = 'high';
                    }
                    requiresReview = true;
                    overallConfidence = Math.min(overallConfidence, thumbnailResult.confidence);
                }
            }

            const isSafe = flags.length === 0 || (severity === 'low' && flags.every(f => f.severity === 'low'));
            const categories = flags.map(f => f.category);

            return {
                isSafe,
                confidence: overallConfidence,
                flags,
                categories,
                requiresReview,
                severity
            };
        } catch (error) {
            console.error('Video moderation error:', error);
            return {
                isSafe: false,
                confidence: 0.5,
                flags: [{
                    category: 'error',
                    confidence: 0.5,
                    reason: 'Moderation check failed - requires manual review',
                    severity: 'medium'
                }],
                categories: ['error'],
                requiresReview: true,
                severity: 'medium'
            };
        }
    }

    // Check for copyright similarity (basic implementation)
    async checkCopyrightSimilarity(
        title: string,
        description: string
    ): Promise<{ isSimilar: boolean; confidence: number; reason: string }> {
        // In production, this would:
        // 1. Compare against a database of known copyrighted content
        // 2. Use text similarity algorithms
        // 3. Check against external copyright databases

        // Basic check for exact title matches
        const client = await clientPromise;
        const db = client.db('mangawebsite');

        const existingSeries = await db.collection('anime_series')
            .findOne({
                $or: [
                    { title: { $regex: new RegExp(`^${title}$`, 'i') } },
                    { title: { $regex: new RegExp(title, 'i') } }
                ]
            });

        if (existingSeries) {
            return {
                isSimilar: true,
                confidence: 0.9,
                reason: `Title matches existing series: ${existingSeries.title}`
            };
        }

        return {
            isSimilar: false,
            confidence: 0.7,
            reason: 'No exact matches found'
        };
    }
}

// Export singleton instance
export const contentModerationAI = new ContentModerationAI();

