import { MetadataRoute } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mangareader.com';
  try {
    const { db } = await connectToDatabase();

    const staticPages: MetadataRoute.Sitemap = [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${baseUrl}/series`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${baseUrl}/guidelines`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
      { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
      { url: `${baseUrl}/help`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    ];

    const manga = await db
      .collection('manga')
      .find({ status: { $ne: 'removed' } })
      .project({ _id: 1, updatedAt: 1 })
      .toArray();

    const mangaPages: MetadataRoute.Sitemap = manga.map((m: any) => ({
      url: `${baseUrl}/manga/${m._id}`,
      lastModified: m.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const chapters = await db
      .collection('chapters')
      .find({ status: { $ne: 'removed' } })
      .sort({ createdAt: -1 })
      .limit(1000)
      .project({ _id: 1, mangaId: 1, updatedAt: 1 })
      .toArray();

    const chapterPages: MetadataRoute.Sitemap = chapters.map((c: any) => ({
      url: `${baseUrl}/manga/${c.mangaId}/chapter/${c._id}`,
      lastModified: c.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    const genres = [
      'action', 'adventure', 'comedy', 'drama', 'fantasy', 'horror', 'mystery', 'romance', 'sci-fi', 'slice-of-life', 'sports', 'thriller'
    ];

    const genrePages: MetadataRoute.Sitemap = genres.map((genre) => ({
      url: `${baseUrl}/series?genre=${encodeURIComponent(genre)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...staticPages, ...mangaPages, ...chapterPages, ...genrePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${baseUrl}/series`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ];
  }
} 