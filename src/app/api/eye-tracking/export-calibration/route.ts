// API endpoint to export calibration data from localStorage
// This allows the user to share their calibration data

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // This endpoint is for client-side use
        // The client will send their localStorage data here
        return NextResponse.json({
            message: 'Use POST to send calibration data',
            instructions: 'Send your localStorage calibration data via POST request'
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to process request', details: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { calibrationData } = body;

        if (!calibrationData) {
            return NextResponse.json(
                { error: 'Missing calibration data' },
                { status: 400 }
            );
        }

        // Return the calibration data for analysis
        // In production, you might want to save this to a database
        return NextResponse.json({
            success: true,
            message: 'Calibration data received',
            data: calibrationData,
            analysis: {
                scrollUp: {
                    samples: calibrationData.scrollUp?.samples?.length || 0,
                    mean: calibrationData.scrollUp?.mean,
                    stdDev: calibrationData.scrollUp?.stdDev
                },
                scrollDown: {
                    samples: calibrationData.scrollDown?.samples?.length || 0,
                    mean: calibrationData.scrollDown?.mean,
                    stdDev: calibrationData.scrollDown?.stdDev
                },
                noScroll: {
                    samples: calibrationData.noScroll?.samples?.length || 0,
                    mean: calibrationData.noScroll?.mean,
                    stdDev: calibrationData.noScroll?.stdDev
                },
                totalSamples: (calibrationData.scrollUp?.samples?.length || 0) +
                            (calibrationData.scrollDown?.samples?.length || 0) +
                            (calibrationData.noScroll?.samples?.length || 0)
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to process calibration data', details: error.message },
            { status: 500 }
        );
    }
}

