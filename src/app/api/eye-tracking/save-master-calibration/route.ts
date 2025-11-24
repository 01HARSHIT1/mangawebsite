import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
    try {
        const calibrationData = await request.json();
        
        // Validate the data
        if (!calibrationData.scrollUp || !calibrationData.scrollDown || !calibrationData.noScroll) {
            return NextResponse.json(
                { error: 'Invalid calibration data' },
                { status: 400 }
            );
        }
        
        // Create data directory if it doesn't exist
        const dataDir = join(process.cwd(), 'data');
        try {
            await mkdir(dataDir, { recursive: true });
        } catch (error) {
            // Directory might already exist, that's fine
        }
        
        // Save to a JSON file
        const filePath = join(dataDir, 'master-calibration.json');
        await writeFile(filePath, JSON.stringify(calibrationData, null, 2), 'utf8');
        
        console.log('✅ Master calibration data saved to:', filePath);
        
        return NextResponse.json({
            success: true,
            message: 'Master calibration data saved successfully',
            path: filePath
        });
    } catch (error: any) {
        console.error('Error saving master calibration:', error);
        return NextResponse.json(
            { error: 'Failed to save calibration data', details: error.message },
            { status: 500 }
        );
    }
}

