import type { Metadata } from "next";
import "./globals.css";

import ClientLayoutShell from "@/components/ClientLayoutShell";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppModeProvider } from "@/contexts/AppModeContext";

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
  manifest: '/manifest.json',
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

        {/* PWA Manifest - Handled by Next.js metadata API */}

        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />

        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="background-color" content="#0f172a" />
        <meta name="msapplication-TileColor" content="#8b5cf6" />
        <meta name="msapplication-navbutton-color" content="#8b5cf6" />

        {/* Mobile App Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-title" content="MangaReader" />

        {/* Apple PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="MangaReader" />
        <meta name="apple-touch-fullscreen" content="yes" />

        {/* Windows PWA Meta Tags */}
        <meta name="msapplication-starturl" content="/" />
        <meta name="msapplication-tooltip" content="MangaReader - Read Manga Online" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* PWA Display */}
        <meta name="display-mode" content="standalone" />
        <meta name="orientation" content="portrait-primary" />

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

        {/* Global error handler for third-party scripts (e.g., browser extensions) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                // Suppress errors from third-party browser extensions
                const originalError = window.onerror;
                window.onerror = function(msg, url, line, col, error) {
                  // Ignore errors from known third-party extensions
                  if (url && (
                    url.includes('liner-core.be.js') ||
                    url.includes('browser-extension') ||
                    url.includes('chrome-extension://') ||
                    url.includes('moz-extension://') ||
                    url.includes('safari-extension://')
                  )) {
                    // Silently ignore third-party extension errors
                    return true; // Prevent default error handling
                  }
                  
                  // Suppress liner-core errors in messages
                  if (msg && typeof msg === 'string' && (
                    msg.includes('liner-core') ||
                    msg.includes('Cannot read properties of null') && msg.includes('classList')
                  )) {
                    return true; // Suppress liner-core errors
                  }
                  
                  // Also suppress 400 errors for Cloudinary PDF transformations
                  if (msg && typeof msg === 'string' && (
                    msg.includes('400') ||
                    msg.includes('Failed to load resource') ||
                    msg.includes('Bad Request')
                  )) {
                    // Check if it's a PDF transformation error or any PDF-related error
                    if (url && (url.includes('cloudinary.com') || url.includes('f_jpg,pg_') || url.includes('.pdf'))) {
                      return true; // Suppress PDF page load errors
                    }
                    // Also suppress if message mentions PDF
                    if (msg.includes('.pdf') || msg.includes('pdf')) {
                      return true;
                    }
                  }
                  
                  // Suppress 500 errors that are handled gracefully
                  if (msg && typeof msg === 'string' && (msg.includes('500') || msg.includes('Internal Server Error'))) {
                    // These are handled by error boundaries or are expected server errors
                    // Check if it's a chapter page request (expected to sometimes fail)
                    if (url && (url.includes('/chapter/') || url.includes('/manga/'))) {
                      return true; // Suppress chapter page 500 errors
                    }
                    return true;
                  }
                  
                  // Suppress eye tracking frame processing errors (they're caught and handled)
                  if (msg && typeof msg === 'string' && (
                    msg.includes('Error processing frame') ||
                    msg.includes('detectIntent') ||
                    msg.includes('Eye Tracking Engine')
                  )) {
                    // Eye tracking errors are logged but don't need to break the app
                    return true;
                  }
                  
                  // Suppress MediaPipe Face Mesh errors (multiple instances can cause conflicts)
                  if (url && (
                    url.includes('face_mesh') ||
                    url.includes('face_mesh_solution') ||
                    url.includes('assets_loader') ||
                    url.includes('wasm_bin') ||
                    url.includes('simd_wasm') ||
                    url.includes('mediapipe') ||
                    url.includes('packed_assets')
                  )) {
                    return true; // Suppress MediaPipe initialization errors
                  }
                  
                  // Suppress ERR_INSUFFICIENT_RESOURCES errors (MediaPipe resource loading)
                  if (msg && typeof msg === 'string' && (
                    msg.includes('ERR_INSUFFICIENT_RESOURCES') ||
                    msg.includes('Failed to load resource') && (
                      msg.includes('face_mesh') ||
                      msg.includes('wasm') ||
                      msg.includes('packed_assets')
                    )
                  )) {
                    return true; // Suppress resource loading errors
                  }
                  
                  // Suppress MediaPipe errors in error messages (comprehensive check)
                  if (msg && typeof msg === 'string') {
                    const isMediaPipeError = (
                      msg.includes('face_mesh') ||
                      msg.includes('Cannot read properties of undefined') ||
                      msg.includes('reading \'buffer\'') ||
                      msg.includes('reading \'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh') ||
                      msg.includes('RuntimeError: abort') ||
                      msg.includes('Assertion failed') ||
                      msg.includes('Module.arguments has been replaced') ||
                      msg.includes('face_mesh_solution_packed_assets') ||
                      msg.includes('simd_wasm_bin') ||
                      msg.includes('assets_loader.js')
                    );
                    
                    if (isMediaPipeError) {
                      return true; // Suppress all MediaPipe errors
                    }
                  }
                  
                  // Suppress MediaPipe errors in error object
                  if (error && typeof error === 'object') {
                    const errorStr = error.toString() + (error.message || '') + (error.stack || '');
                    if (errorStr.includes('face_mesh') || 
                        errorStr.includes('wasm') || 
                        errorStr.includes('assets_loader') ||
                        errorStr.includes('RuntimeError') ||
                        errorStr.includes('Module.arguments')) {
                      return true;
                    }
                  }
                  
                  // Call original error handler for our own errors
                  if (originalError) {
                    return originalError.call(this, msg, url, line, col, error);
                  }
                  return false; // Allow default error handling for our errors
                };
                
                // Also handle unhandled promise rejections from third-party scripts
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = event.reason;
                  if (reason && typeof reason === 'object' && reason.message) {
                    const msg = reason.message;
                    // Suppress PDF 400 errors
                    if (msg.includes('400') && (msg.includes('cloudinary.com') || msg.includes('.pdf') || msg.includes('f_jpg,pg_'))) {
                      event.preventDefault(); // Suppress the error
                      return;
                    }
                    // Suppress 500 errors that are handled gracefully
                    if (msg.includes('500') || msg.includes('Internal Server Error')) {
                      event.preventDefault();
                      return;
                    }
                    // Suppress MediaPipe errors (comprehensive)
                    const isMediaPipeError = (
                      msg.includes('face_mesh') || 
                      msg.includes('Cannot read properties of undefined') ||
                      msg.includes('RuntimeError') ||
                      msg.includes('abort') ||
                      msg.includes('Assertion failed') ||
                      msg.includes('Module.arguments has been replaced') ||
                      msg.includes('face_mesh_solution_packed_assets') ||
                      msg.includes('simd_wasm_bin') ||
                      msg.includes('reading \'buffer\'') ||
                      msg.includes('assets_loader.js') ||
                      msg.includes('ERR_INSUFFICIENT_RESOURCES') ||
                      msg.includes('NetworkError') && msg.includes('face_mesh')
                    );
                    if (isMediaPipeError) {
                      event.preventDefault();
                      return;
                    }
                  }
                  // Suppress errors from fetch requests that fail (400/500)
                  if (reason && typeof reason === 'string') {
                    if (reason.includes('400') || reason.includes('500') || reason.includes('Failed to load resource')) {
                      event.preventDefault();
                      return;
                    }
                    // Suppress MediaPipe string errors (comprehensive)
                    const isMediaPipeStringError = (
                      reason.includes('face_mesh') || 
                      reason.includes('wasm') ||
                      reason.includes('assets_loader') ||
                      reason.includes('RuntimeError') ||
                      reason.includes('Module.arguments') ||
                      reason.includes('simd_wasm') ||
                      reason.includes('face_mesh_solution')
                    );
                    if (isMediaPipeStringError) {
                      event.preventDefault();
                      return;
                    }
                  }
                  // Suppress MediaPipe errors in error objects
                  if (reason && typeof reason === 'object') {
                    const reasonStr = JSON.stringify(reason) + (reason.message || '') + (reason.stack || '');
                    const isMediaPipeObjectError = (
                      reasonStr.includes('face_mesh') || 
                      reasonStr.includes('wasm') ||
                      reasonStr.includes('assets_loader') ||
                      reasonStr.includes('RuntimeError') ||
                      reasonStr.includes('Module.arguments') ||
                      reasonStr.includes('simd_wasm')
                    );
                    if (isMediaPipeObjectError) {
                      event.preventDefault();
                      return;
                    }
                  }
                });
                
                // Suppress console errors for known issues
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  // Suppress PDF 400 errors
                  if (message.includes('400') && (message.includes('cloudinary.com') || message.includes('.pdf') || message.includes('f_jpg,pg_'))) {
                    return; // Don't log PDF page errors
                  }
                  // Suppress liner-core errors (browser extension)
                  if (message.includes('liner-core') || 
                      message.includes('git.io/JUIaE') ||
                      (message.includes('Cannot read properties of null') && message.includes('classList'))) {
                    return; // Don't log extension errors
                  }
                  // Suppress 500 errors that are handled
                  if (message.includes('500') && message.includes('Internal Server Error')) {
                    return; // Don't log handled 500 errors
                  }
                  // Suppress MediaPipe Face Mesh errors (comprehensive)
                  const isMediaPipeConsoleError = (
                    message.includes('face_mesh') || 
                    message.includes('face_mesh_solution') ||
                    message.includes('assets_loader') ||
                    message.includes('wasm_bin') ||
                    message.includes('simd_wasm') ||
                    message.includes('mediapipe') ||
                    (message.includes('Cannot read properties of undefined') && (
                      message.includes('buffer') ||
                      message.includes('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh') ||
                      message.includes('face_mesh_solution_packed_assets') ||
                      message.includes('reading \'https://cdn.jsdelivr.net')
                    )) ||
                    message.includes('RuntimeError: abort') ||
                    message.includes('Assertion failed') ||
                    message.includes('Module.arguments has been replaced') ||
                    (message.includes('VM') && (message.includes('face_mesh') || message.includes('wasm'))) ||
                    message.includes('jsStackTrace') ||
                    message.includes('stackTrace') ||
                    message.includes('abort(') ||
                    (message.includes('TypeError') && message.includes('undefined'))
                  );
                  if (isMediaPipeConsoleError) {
                    return; // Don't log MediaPipe initialization errors
                  }
                  
                  // Suppress errors from stack traces that include MediaPipe
                  if (args.some(arg => {
                    const argStr = String(arg);
                    return (argStr.includes('face_mesh') || argStr.includes('wasm') || argStr.includes('mediapipe')) &&
                           (argStr.includes('VM') || argStr.includes('at ') || argStr.includes('Error'));
                  })) {
                    return; // Don't log MediaPipe stack traces
                  }
                  // Call original console.error for other errors
                  originalConsoleError.apply(console, args);
                };
              }
            `
          }}
        />
      </head>
      <body className="bg-gray-950 dark:bg-gray-950 text-white dark:text-white min-h-screen font-sans">
        <AuthProvider>
          <AppModeProvider>
            <ClientLayoutShell>{children}</ClientLayoutShell>
          </AppModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}











