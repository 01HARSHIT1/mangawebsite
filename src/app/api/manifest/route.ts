import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Make this route public - no authentication required
export async function GET() {
    try {
        const manifestPath = path.join(process.cwd(), 'public', 'manifest.json');
        
        // Check if file exists
        if (!fs.existsSync(manifestPath)) {
            console.error('Manifest file not found at:', manifestPath);
            return NextResponse.json(
                { error: 'Manifest not found' },
                { 
                    status: 404,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET',
                    }
                }
            );
        }
        
        const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        
        return NextResponse.json(manifest, {
            status: 200,
            headers: {
                'Content-Type': 'application/manifest+json',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
            },
        });
    } catch (error) {
        console.error('Error reading manifest.json:', error);
        return NextResponse.json(
            { error: 'Manifest not found' },
            { 
                status: 404,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET',
                }
            }
        );
    }
}

