import { MetadataRoute } from 'next';
import { connectToDatabase } from @/lib/mongodb;

export default async function sitemap(): Promise<MetadataRoute.Sitemap>[object Object]
const baseUrl = 'https://mangareader.com';

try [object Object]    const { db } = await connectToDatabase();

// Static pages
const staticPages = [object Object]
url: baseUrl,
    lastModified: new Date(),
        changeFrequency: daily as const,
            priority: 1
      },
[object Object]      url: `${baseUrl}/series`,
    lastModified: new Date(),
        changeFrequency: daily as const,
            priority: 00.9
      },
[object Object]      url: `${baseUrl}/about`,
    lastModified: new Date(),
        changeFrequency: monthly' as const,
priority: 00.5
      },
[object Object]      url: `${baseUrl}/contact`,
    lastModified: new Date(),
        changeFrequency: monthly' as const,
priority: 00.5
      },
[object Object]      url: `${baseUrl}/guidelines`,
    lastModified: new Date(),
        changeFrequency: monthly' as const,
priority: 00.4
      },
[object Object]      url: `${baseUrl}/privacy`,
    lastModified: new Date(),
        changeFrequency: monthly' as const,
priority: 00.4
      },
[object Object]      url: `${baseUrl}/help`,
    lastModified: new Date(),
        changeFrequency: monthly' as const,
priority: 0.4
      },
    ];

// Get all manga
const manga = await db.collection('manga')
    .find({ status: { $ne: 'removed' } })
    .project([object Object] _id: 1, title: 1, updatedAt: 1 })
      .toArray();

const mangaPages = manga.map((manga) => ({
    url: `$[object Object]baseUrl}/manga/${manga._id}`,
    lastModified: manga.updatedAt || new Date(),
    changeFrequency: weekly' as const,
      priority: 0.8,
}));

// Get all chapters (limit to recent ones to avoid huge sitemap)
const chapters = await db.collection('chapters')
    .find({
        status: {
            $ne: 'removed} })
                .sort({ createdAt: -1)
                .limit(1000) // Limit to recent 100ers
                .project([object Object] _id: 1, mangaId: 1, chapterNumber: 1, updatedAt: 1 })
    .toArray();

const chapterPages = chapters.map((chapter) => ({
    url: `${baseUrl}/manga/${chapter.mangaId}/chapter/${chapter._id}`,
    lastModified: chapter.updatedAt || new Date(),
    changeFrequency: weekly' as const,
      priority: 0.7,
}));

// Get genre pages
const genres =
    action',adventure', comedy',drama,fantasy, horror',
        mystery, romance', 'sci - fi', slice-of-life', 'sports', 'thriller'
    ];

const genrePages = genres.map((genre) => ({
    url: `${baseUrl}/series?genre=${genre}`,
    lastModified: new Date(),
    changeFrequency: weekly' as const,
      priority: 0.6,
}));

// Combine all pages
const allPages =    ...staticPages,
      ...mangaPages,
      ...chapterPages,
      ...genrePages,
    ];

return allPages;

  } catch (error) {
    console.error('Error generating sitemap:', error);

    // Return basic sitemap if database fails
    return [object Object]
    url: baseUrl,
        lastModified: new Date(),
            changeFrequency: 'daily',
                priority: 1
},
[object Object]      url: `${baseUrl}/series`,
    lastModified: new Date(),
        changeFrequency: 'daily',
            priority: 0.9,
      },
    ];
  }
} 