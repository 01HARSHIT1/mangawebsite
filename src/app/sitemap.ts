import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://realmverse.com';

    // Return minimal sitemap to prevent build-time stack overflow
    // Dynamic manga/chapter pages will be indexed by search engines naturally
    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1
        },
        {
            url: `${baseUrl}/series`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9
        },
        {
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4
        },
        {
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4
        },
        {
            url: `${baseUrl}/help`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.4
        },
    ];
}