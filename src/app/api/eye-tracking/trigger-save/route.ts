import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// This endpoint can be called to save existing calibration data from localStorage
export async function POST(request: NextRequest) {
    try {
        const { calibrationData } = await request.json();
        
        if (!calibrationData || !calibrationData.calibrated) {
            return NextResponse.json(
                { error: 'No valid calibration data provided' },
                { status: 400 }
            );
        }
        
        // Create data directory if it doesn't exist
        const dataDir = join(process.cwd(), 'data');
        try {
            await mkdir(dataDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
        
        // Save to file
        const filePath = join(dataDir, 'master-calibration.json');
        await writeFile(filePath, JSON.stringify(calibrationData, null, 2), 'utf8');
        
        console.log('✅ Master calibration data saved to:', filePath);
        
        return NextResponse.json({
            success: true,
            message: 'Calibration data saved successfully',
            path: filePath
        });
    } catch (error: any) {
        console.error('Error saving calibration:', error);
        return NextResponse.json(
            { error: 'Failed to save calibration data', details: error.message },
            { status: 500 }
        );
    }
}

