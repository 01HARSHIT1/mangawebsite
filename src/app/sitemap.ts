import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mangareader.com';
  try {
    const { db } = await connectToDatabase();

    const staticPages: MetadataRoute.Sitemap = [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${baseUrl}/series`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ];

    const manga = await db
      .collection('manga')
      .find({ status: { $ne: 'removed' } })
      .project({ _id: 1, updatedAt: 1 })
      .limit(2000)
      .toArray();

    const mangaPages: MetadataRoute.Sitemap = manga.map((m: any) => ({
      url: `${baseUrl}/manga/${m._id}`,
      lastModified: m.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticPages, ...mangaPages];
  } catch {
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${baseUrl}/series`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ];
  }
} 