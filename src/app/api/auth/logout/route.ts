import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Since we're using JWT tokens stored in localStorage,
        // logout is handled on the client side by removing the token.
        // This endpoint is here for consistency and future enhancements.

        return NextResponse.json({
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Logout failed' },
            { status: 500 }
        );
    }
}

