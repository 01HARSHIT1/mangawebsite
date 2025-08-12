import Head from 'next/head';

interface SEOHeadProps {
    title?: string;
    description?: string;
    keywords?: string[];
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'book' | 'profile';
    author?: string;
    publishedTime?: string;
    modifiedTime?: string;
    section?: string;
    tags?: string[];
    manga?: {
        title: string;
        description: string;
        author: string;
        coverImage: string;
        chapters: number;
        status: string;
        genres: string;
    };
    chapter?: {
        title: string;
        number: number;
        mangaTitle: string;
        pages: number;
    };
}

const SEOHead: React.FC<SEOHeadProps> = ({
    title,
    description,
    keywords = ['Read manga online for free', 'MangaReader', 'Manga', 'Online Manga', 'Free Manga'],
    image = '/og-image.webp',
    url,
    type = 'website',
    author,
    publishedTime,
    modifiedTime,
    section,
    tags = [],
    manga,
    chapter
}) => {
    const siteTitle = title ? `${title} | MangaReader` : 'MangaReader - Read Manga Online for Free';
    const siteDescription = description || 'Read manga online for free on MangaReader. Discover thousands of manga series, latest chapters, and join our community of manga enthusiasts.';
    const siteUrl = url || 'https://mangareader.com';
    const siteImage = image.startsWith('http') ? image : `https://mangareader.com${image}`;

    // Generate structured data based on content type
    const generateStructuredData = () => {
        if (manga) {
            return {
                "@context": "https://schema.org",
                "@type": "Book",
                name: manga.title,
                description: manga.description,
                author: {
                    "@type": "Person",
                    name: manga.author
                },
                image: manga.coverImage,
                numberOfPages: manga.chapters,
                bookFormat: "Manga",
                genre: manga.genres,
                inLanguage: "en",
                publisher: {
                    "@type": "Organization",
                    name: "MangaReader"
                },
                url: siteUrl,
                potentialAction: {
                    "@type": "ReadAction",
                    target: siteUrl
                }
            };
        }

        if (chapter) {
            return {
                "@context": "https://schema.org",
                "@type": "Chapter",
                name: `${chapter.mangaTitle} Chapter ${chapter.number}`,
                description: `${chapter.mangaTitle} Chapter ${chapter.number} - Read online for free`,
                numberOfPages: chapter.pages,
                isPartOf: {
                    "@type": "Book",
                    name: chapter.mangaTitle
                },
                url: siteUrl
            };
        }

        return {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: siteTitle,
            description: siteDescription,
            url: siteUrl,
            publisher: {
                "@type": "Organization",
                name: "MangaReader",
                url: "https://mangareader.com"
            }
        };
    };

    return (
        <Head>
            {/* Basic Meta Tags */}
            <title>{siteTitle}</title>
            <meta name="description" content={siteDescription} />
            <meta name="keywords" content={keywords.join(', ')} />
            <meta name="author" content={author || 'MangaReader Team'} />

            {/* Canonical URL */}
            <link rel="canonical" href={siteUrl} />

            {/* Open Graph */}
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={siteDescription} />
            <meta property="og:type" content={type} />
            <meta property="og:url" content={siteUrl} />
            <meta property="og:image" content={siteImage} />
            <meta property="og:site_name" content="MangaReader" />
            <meta property="og:locale" content="en_US" />

            {publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
            {author && <meta property="article:author" content={author} />}
            {section && <meta property="article:section" content={section} />}
            {tags.map(tag => (
                <meta key={tag} property="article:tag" content={tag} />
            ))}

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={siteTitle} />
            <meta name="twitter:description" content={siteDescription} />
            <meta name="twitter:image" content={siteImage} />
            <meta name="twitter:site" content="@mangareader" />
            <meta name="twitter:creator" content="@mangareader" />

            {/* Additional SEO Meta Tags */}
            <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
            <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

            {/* Mobile Meta Tags */}
            <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(generateStructuredData()),
                }}
            />

            {/* Breadcrumb Structured Data */}
            {manga && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "BreadcrumbList",
                            itemListElement: [
                                {
                                    "@type": "ListItem",
                                    position: 1,
                                    name: "Home",
                                    item: "https://mangareader.com"
                                },
                                {
                                    "@type": "ListItem",
                                    position: 2,
                                    name: "Manga",
                                    item: "https://mangareader.com/series"
                                },
                                {
                                    "@type": "ListItem",
                                    position: 3,
                                    name: manga.title,
                                    item: siteUrl
                                }
                            ]
                        }),
                    }}
                />
            )}

            {/* Preload Critical Resources */}
            <link rel="preload" href="/fonts/geist-sans.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
            <link rel="preload" href="/fonts/geist-mono.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

            {/* DNS Prefetch for External Resources */}
            <link rel="dns-prefetch" href="//fonts.googleapis.com" />
            <link rel="dns-prefetch" href="//fonts.gstatic.com" />
            <link rel="dns-prefetch" href="//www.google-analytics.com" />
        </Head>
    );
};

export default SEOHead; 