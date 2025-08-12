import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ message: 'API routing is working!' });
}

export async function POST(req: Request) {
    const body = await req.json();
    return NextResponse.json({ 
        message: 'POST request received',
        data: body 
    });
} 