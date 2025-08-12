import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://mangareader.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/series', '/manga/*', '/about', '/contact', '/guidelines', '/privacy', '/help', '/faq'],
        disallow: ['/admin*', '/api/*', '/login', '/signup', '/profile', '/settings', '/upload', '/creator-panel', '/_next/*', '/static/*', '/*.json', '/*.xml'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
} 