import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface VideoAnalysisResult {
    audioStreams: Array<{
        index: number;
        codec: string;
        language?: string;
        channels: number;
        sampleRate?: string;
    }>;
    subtitleStreams: Array<{
        index: number;
        codec: string;
        language?: string;
        title?: string;
    }>;
    videoStreams: Array<{
        index: number;
        codec: string;
        width: number;
        height: number;
    }>;
    duration: number;
    format: string;
}

interface ValidationRequest {
    videoUrl: string;
    declaredAudioTracks: Array<{
        language: string;
        languageCode: string;
    }>;
    declaredSubtitleType: 'hard' | 'soft';
    declaredSubtitles?: Array<{
        language: string;
        languageCode: string;
    }>;
}

/**
 * Analyze video file using FFprobe
 * Detects audio streams, subtitle streams, and video metadata
 */
async function analyzeVideoWithFFprobe(videoPath: string): Promise<VideoAnalysisResult> {
    try {
        // Check if ffprobe is available
        try {
            await execAsync('ffprobe -version');
        } catch (error) {
            throw new Error('FFprobe is not installed or not available in PATH');
        }

        // Get video streams information
        const { stdout: streamsOutput } = await execAsync(
            `ffprobe -v quiet -print_format json -show_streams "${videoPath}"`
        );
        const streamsData = JSON.parse(streamsOutput);

        // Get format information
        const { stdout: formatOutput } = await execAsync(
            `ffprobe -v quiet -print_format json -show_format "${videoPath}"`
        );
        const formatData = JSON.parse(formatOutput);

        const audioStreams: VideoAnalysisResult['audioStreams'] = [];
        const subtitleStreams: VideoAnalysisResult['subtitleStreams'] = [];
        const videoStreams: VideoAnalysisResult['videoStreams'] = [];

        streamsData.streams?.forEach((stream: any) => {
            if (stream.codec_type === 'audio') {
                audioStreams.push({
                    index: stream.index,
                    codec: stream.codec_name || 'unknown',
                    language: stream.tags?.language || stream.tags?.LANGUAGE || undefined,
                    channels: stream.channels || 0,
                    sampleRate: stream.sample_rate || undefined,
                });
            } else if (stream.codec_type === 'subtitle') {
                subtitleStreams.push({
                    index: stream.index,
                    codec: stream.codec_name || 'unknown',
                    language: stream.tags?.language || stream.tags?.LANGUAGE || undefined,
                    title: stream.tags?.title || stream.tags?.TITLE || undefined,
                });
            } else if (stream.codec_type === 'video') {
                videoStreams.push({
                    index: stream.index,
                    codec: stream.codec_name || 'unknown',
                    width: stream.width || 0,
                    height: stream.height || 0,
                });
            }
        });

        return {
            audioStreams,
            subtitleStreams,
            videoStreams,
            duration: parseFloat(formatData.format?.duration || '0'),
            format: formatData.format?.format_name || 'unknown',
        };
    } catch (error: any) {
        console.error('FFprobe analysis error:', error);
        throw new Error(`Video analysis failed: ${error.message}`);
    }
}

/**
 * Download video from URL to temporary file
 */
async function downloadVideoToTemp(videoUrl: string): Promise<string> {
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, `video_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);

    try {
        const response = await fetch(videoUrl);
        if (!response.ok) {
            throw new Error(`Failed to download video: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(tempFilePath, buffer);

        return tempFilePath;
    } catch (error: any) {
        throw new Error(`Failed to download video: ${error.message}`);
    }
}

/**
 * Validate creator's audio/subtitle declaration against detected streams
 */
function validateDeclaration(
    analysis: VideoAnalysisResult,
    declaredAudioTracks: ValidationRequest['declaredAudioTracks'],
    declaredSubtitleType: 'hard' | 'soft',
    declaredSubtitles?: ValidationRequest['declaredSubtitles']
): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    detectedAudioCount: number;
    declaredAudioCount: number;
    detectedSubtitleCount: number;
    declaredSubtitleCount: number;
} {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Validate audio tracks
    const detectedAudioCount = analysis.audioStreams.length;
    const declaredAudioCount = declaredAudioTracks.length;

    if (declaredAudioCount === 0 && detectedAudioCount > 0) {
        warnings.push('Video contains audio streams but no audio tracks were declared');
    } else if (declaredAudioCount > 0 && detectedAudioCount === 0) {
        errors.push('Audio tracks declared but no audio streams detected in video');
    } else if (declaredAudioCount > detectedAudioCount) {
        warnings.push(`More audio tracks declared (${declaredAudioCount}) than detected (${detectedAudioCount}). Some declared tracks may not be available.`);
    }

    // For multiple audio tracks, check if video actually has multiple streams
    if (declaredAudioCount > 1 && detectedAudioCount < 2) {
        warnings.push('Multiple audio tracks declared but video only has one audio stream. Audio switching may not work properly.');
    }

    // Validate subtitles
    const detectedSubtitleCount = analysis.subtitleStreams.length;
    const declaredSubtitleCount = declaredSubtitles?.length || 0;

    if (declaredSubtitleType === 'hard') {
        // Hard subtitles are burned in, so we can't detect them easily
        // Just warn if soft subtitle streams are detected
        if (detectedSubtitleCount > 0) {
            warnings.push('Hard subtitles declared but video contains embedded subtitle streams. Consider using soft subtitles instead.');
        }
    } else if (declaredSubtitleType === 'soft') {
        // For soft subtitles, we expect separate files, not embedded streams
        if (detectedSubtitleCount > 0) {
            warnings.push('Soft subtitles declared but video also contains embedded subtitle streams. Both may be available.');
        }
        if (declaredSubtitleCount === 0) {
            warnings.push('Soft subtitles selected but no subtitle files uploaded');
        }
    }

    // Check language codes if available
    if (detectedAudioCount > 0 && declaredAudioCount > 0) {
        const detectedLanguages = analysis.audioStreams
            .map(s => s.language)
            .filter(Boolean)
            .map(lang => lang?.toLowerCase());
        
        declaredAudioTracks.forEach(declared => {
            const declaredLang = declared.languageCode.toLowerCase();
            if (!detectedLanguages.includes(declaredLang) && detectedLanguages.length > 0) {
                warnings.push(`Declared audio language "${declared.language}" (${declaredLang}) not found in detected streams. Available: ${detectedLanguages.join(', ')}`);
            }
        });
    }

    return {
        isValid: errors.length === 0,
        warnings,
        errors,
        detectedAudioCount,
        declaredAudioCount,
        detectedSubtitleCount,
        declaredSubtitleCount,
    };
}

/**
 * POST /api/anime/validate-video
 * Validates video file and creator's audio/subtitle declaration
 */
export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth(request);
        const body: ValidationRequest = await request.json();

        const { videoUrl, declaredAudioTracks, declaredSubtitleType, declaredSubtitles } = body;

        if (!videoUrl) {
            return NextResponse.json(
                { error: 'videoUrl is required' },
                { status: 400 }
            );
        }

        // Check if FFprobe is available
        let hasFFprobe = false;
        try {
            await execAsync('ffprobe -version');
            hasFFprobe = true;
        } catch (error) {
            console.warn('FFprobe not available, skipping video analysis');
        }

        let analysis: VideoAnalysisResult | null = null;
        let validationResult: any = null;

        if (hasFFprobe) {
            try {
                // Download video to temporary file
                console.log('Downloading video for analysis...');
                const tempFilePath = await downloadVideoToTemp(videoUrl);
                console.log('Video downloaded to:', tempFilePath);

                try {
                    // Analyze video
                    console.log('Analyzing video with FFprobe...');
                    analysis = await analyzeVideoWithFFprobe(tempFilePath);

                    // Validate declaration
                    validationResult = validateDeclaration(
                        analysis,
                        declaredAudioTracks,
                        declaredSubtitleType,
                        declaredSubtitles
                    );

                    console.log('Validation result:', validationResult);
                } finally {
                    // Clean up temporary file
                    try {
                        if (fs.existsSync(tempFilePath)) {
                            fs.unlinkSync(tempFilePath);
                            console.log('Temporary file cleaned up');
                        }
                    } catch (cleanupError) {
                        console.error('Failed to cleanup temp file:', cleanupError);
                    }
                }
            } catch (error: any) {
                console.error('Video analysis error:', error);
                // Return partial result even if analysis fails
                return NextResponse.json({
                    success: false,
                    error: 'Video analysis failed',
                    details: error.message,
                    validation: {
                        isValid: false,
                        warnings: [`Analysis failed: ${error.message}`],
                        errors: ['Could not validate video file'],
                        detectedAudioCount: 0,
                        declaredAudioCount: declaredAudioTracks.length,
                        detectedSubtitleCount: 0,
                        declaredSubtitleCount: declaredSubtitles?.length || 0,
                    },
                });
            }
        } else {
            // FFprobe not available - return basic validation
            validationResult = {
                isValid: true,
                warnings: ['FFprobe not available. Video analysis skipped. Validation based on declaration only.'],
                errors: [],
                detectedAudioCount: 0,
                declaredAudioCount: declaredAudioTracks.length,
                detectedSubtitleCount: 0,
                declaredSubtitleCount: declaredSubtitles?.length || 0,
            };
        }

        return NextResponse.json({
            success: true,
            analysis: analysis || null,
            validation: validationResult,
            hasFFprobe,
        });
    } catch (error: any) {
        console.error('Video validation error:', error);
        return NextResponse.json(
            { error: 'Failed to validate video', details: error.message },
            { status: 500 }
        );
    }
}

