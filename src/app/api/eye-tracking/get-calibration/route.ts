import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// This endpoint reads the saved calibration data
export async function GET() {
    try {
        const filePath = join(process.cwd(), 'data', 'master-calibration.json');
        
        try {
            const data = await readFile(filePath, 'utf8');
            const calibrationData = JSON.parse(data);
            
            return NextResponse.json({
                success: true,
                data: calibrationData,
                message: 'Calibration data found'
            });
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return NextResponse.json({
                    success: false,
                    message: 'Calibration file not found. Please complete calibration first.',
                    filePath
                }, { status: 404 });
            }
            throw error;
        }
    } catch (error: any) {
        console.error('Error reading calibration:', error);
        return NextResponse.json(
            { error: 'Failed to read calibration data', details: error.message },
            { status: 500 }
        );
    }
}

