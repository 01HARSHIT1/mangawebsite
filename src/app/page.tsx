"use client";
import Link from "next/link";
import TrendingMangaAsync from '@/components/TrendingMangaAsync';
import FeaturedCarouselAsync from '@/components/FeaturedCarouselAsync';
import SearchAndFilter from "@/components/SearchAndFilterClient";
import { FaUserPlus, FaSignInAlt, FaCrown, FaBookOpen, FaUserCircle, FaTachometerAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

const genresList = [
  "Romance", "Action", "Fantasy", "Drama", "Comedy", "Slice of Life", "Adventure", "Horror", "Sci-Fi", "Mystery", "Supernatural"
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-16 px-4 text-center bg-gradient-to-b from-gray-900 to-gray-950">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-green-400 drop-shadow-lg">Read Manga Online for Free</h1>
        <p className="text-lg md:text-2xl text-gray-300 mb-8 max-w-2xl">Discover thousands of manga series, enjoy advanced reading features, and join our vibrant community. Become a creator and share your own stories!</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {!isAuthenticated ? (
            // Show login/signup for non-authenticated users
            <>
              <Link href="/signup" className="px-8 py-3 rounded bg-green-500 hover:bg-green-600 text-white font-bold text-lg shadow-lg">Get Started</Link>
              <Link href="/login" className="px-8 py-3 rounded bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg shadow-lg">Log In</Link>
              <Link href="/creator-panel" className="px-8 py-3 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg shadow-lg">Become a Creator</Link>
            </>
          ) : (
            // Show user-specific options for authenticated users
            <>
              <Link href="/creator-panel" className="px-8 py-3 rounded bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg shadow-lg">Creator Panel</Link>
              {user?.role === 'admin' && (
                <Link href="/admin-dashboard" className="px-8 py-3 rounded bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-lg">Admin Dashboard</Link>
              )}
              <Link href="/profile" className="px-8 py-3 rounded bg-gray-700 hover:bg-gray-800 text-white font-bold text-lg shadow-lg">My Profile</Link>
            </>
          )}
        </div>
      </section>

      {/* Featured Carousel */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <FeaturedCarouselAsync />
      </section>

      {/* Trending Manga */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-green-300">Trending Now</h2>
        <TrendingMangaAsync sort="trending" />
      </section>

      {/* Top Rated Manga */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-yellow-300">Top Rated</h2>
        <TrendingMangaAsync sort="top" />
      </section>

      {/* Personalized Recommendations (if logged in) */}
      <section className="py-8 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-blue-300">Recommended For You</h2>
        {isAuthenticated ? (
          <div className="text-gray-400">Personalized recommendations coming soon!</div>
        ) : (
          <div className="text-gray-400">Sign in to see personalized manga recommendations!</div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-gray-900 text-gray-400 text-center">
        <div className="mb-2">&copy; {new Date().getFullYear()} MangaReader. All rights reserved.</div>
        <div className="flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/about" className="hover:text-green-300">About</Link>
          <Link href="/contact" className="hover:text-green-300">Contact</Link>
          <Link href="/terms" className="hover:text-green-300">Terms</Link>
          <Link href="/privacy" className="hover:text-green-300">Privacy</Link>
        </div>
      </footer>
    </div>
  );
}











