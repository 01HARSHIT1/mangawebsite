import type { Metadata } from "next";
import "./globals.css";

import ClientLayoutShell from "@/components/ClientLayoutShell";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: {
    default: "MangaReader - Read Manga Online for Free",
    template: "%s | MangaReader",
  },
  description: "Read manga online for free on MangaReader. Discover thousands of manga series, latest chapters, and join our community of manga enthusiasts. High-quality scans, fast updates, and mobile-friendly reading experience.",
  keywords: ["manga", "read manga online", "free manga", "manga reader", "anime", "comics", "manga chapters", "manga series", "manga community", "manga scans"],
  authors: [{ name: "MangaReader Team" }],
  creator: "MangaReader",
  publisher: "MangaReader",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://mangareader.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mangareader.com',
    siteName: 'MangaReader',
    title: 'MangaReader - Read Manga Online for Free',
    description: 'Read manga online for free on MangaReader. Discover thousands of manga series, latest chapters, and join our community of manga enthusiasts.',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'MangaReader - Read Manga Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangaReader - Read Manga Online for Free',
    description: 'Read manga online for free on MangaReader. Discover thousands of manga series, latest chapters, and join our community of manga enthusiasts.',
    images: ['/twitter-image.webp'],
    creator: '@mangareader',
  },
  robots: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

// Structured Data for Organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "MangaReader",
  "url": "https://mangareader.com",
  "logo": "https://mangareader.com/logo.png",
  "description": "Read manga online for free on MangaReader. Discover thousands of manga series, latest chapters, and join our community of manga enthusiasts.",
  "sameAs": [
    "https://twitter.com/mangareader",
    "https://facebook.com/mangareader",
    "https://instagram.com/mangareader"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "support@mangareader.com"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* Theme Color */}
        <meta name="theme-color" content="#129377" />
        <meta name="msapplication-TileColor" content="#1f2937" />

        {/* Additional SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Performance Hints */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Development-only script to clear authentication */}
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                        if (typeof window !== 'undefined') {
                            const shouldClearAuth = sessionStorage.getItem('clearAuthOnStart');
                            if (!shouldClearAuth) {
                                console.log('Development: Clearing authentication for fresh start');
                                localStorage.removeItem('token');
                                sessionStorage.setItem('clearAuthOnStart', 'true');
                            }
                        }
                    `
            }}
          />
        )}
      </head>
      <body className="bg-gray-950 dark:bg-gray-950 text-white dark:text-white min-h-screen font-sans">
        <AuthProvider>
          <ClientLayoutShell>{children}</ClientLayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}











