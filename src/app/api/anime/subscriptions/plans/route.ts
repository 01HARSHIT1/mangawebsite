import { NextResponse } from 'next/server';

// Subscription Plans - Free tier with ads, Premium without ads
export async function GET() {
    try {
        const plans = [
            {
                _id: 'free',
                name: 'free',
                displayName: 'Free',
                price: 0,
                currency: 'USD',
                interval: 'monthly' as const,
                features: {
                    adsAllowed: true,
                    maxQuality: '720p',
                    offlineDownloads: false,
                    simultaneousStreams: 1,
                    regions: ['*'], // All regions
                },
                description: 'Watch with ads, limited quality',
            },
            {
                _id: 'premium',
                name: 'premium',
                displayName: 'Premium',
                price: 9.99,
                currency: 'USD',
                interval: 'monthly' as const,
                features: {
                    adsAllowed: false,
                    maxQuality: '1080p',
                    offlineDownloads: true,
                    simultaneousStreams: 2,
                    regions: ['*'],
                },
                description: 'Ad-free, HD quality, offline downloads',
            },
            {
                _id: 'premium_plus',
                name: 'premium_plus',
                displayName: 'Premium Plus',
                price: 14.99,
                currency: 'USD',
                interval: 'monthly' as const,
                features: {
                    adsAllowed: false,
                    maxQuality: '4K',
                    offlineDownloads: true,
                    simultaneousStreams: 4,
                    regions: ['*'],
                },
                description: 'Ad-free, 4K quality, multiple devices',
            },
        ];

        return NextResponse.json({ plans });
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }
}

