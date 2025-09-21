"use client";
import Link from "next/link";
import TrendingMangaAsync from '@/components/TrendingMangaAsync';
import FeaturedCarouselAsync from '@/components/FeaturedCarouselAsync';
import ActivityFeed from '@/components/ActivityFeed';
import SearchAndFilter from "@/components/SearchAndFilterClient";
import { FaUserPlus, FaSignInAlt, FaCrown, FaBookOpen, FaUserCircle, FaTachometerAlt } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

const genresList = [
  "Romance", "Action", "Fantasy", "Drama", "Comedy", "Slice of Life", "Adventure", "Horror", "Sci-Fi", "Mystery", "Supernatural"
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center py-20 px-4 text-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-500/5 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-full mb-4 shadow-lg">
              🎌 Premium Manga Experience
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
            Read Manga Online
          </h1>
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-white/90">
            For Free, Forever
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl leading-relaxed">
            Discover thousands of manga series, enjoy advanced reading features, and join our vibrant community.
            <span className="text-purple-400 font-semibold"> Become a creator</span> and share your own stories!
          </p>
          <div className="flex flex-wrap gap-6 justify-center">
            {!isAuthenticated ? (
              // Show login/signup for non-authenticated users
              <>
                <Link href="/signup" className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-emerald-500/25">
                  <span className="relative z-10">🚀 Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
                <Link href="/login" className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-blue-500/25">
                  <span className="relative z-10">🔑 Log In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
                <Link href="/upload" className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-amber-500/25">
                  <span className="relative z-10">✨ Become a Creator</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
              </>
            ) : (
              // Show user-specific options for authenticated users
              <>
                <Link href="/upload" className="group relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-amber-500/25">
                  <span className="relative z-10">📚 Upload Manga</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
                {user?.isCreator && (
                  <Link href="/creator/dashboard" className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-purple-500/25">
                    <span className="relative z-10">📊 Creator Dashboard</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  </Link>
                )}
                <Link href="/profile" className="group relative px-8 py-4 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white font-bold text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300 hover:shadow-slate-500/25">
                  <span className="relative z-10">👤 My Profile</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-500 to-gray-600 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Carousel */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🌟 Featured Manga
          </h2>
          <p className="text-gray-400 text-lg">Discover the most popular and trending series</p>
        </div>
        <FeaturedCarouselAsync />
      </section>

      {/* Trending Manga */}
      <section className="py-16 px-4 max-w-7xl mx-auto bg-gradient-to-r from-slate-800/50 to-purple-800/50 rounded-3xl backdrop-blur-sm">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            🔥 Trending Now
          </h2>
          <p className="text-gray-400 text-lg">The hottest manga everyone's reading</p>
        </div>
        <TrendingMangaAsync sort="trending" />
      </section>

      {/* Top Rated Manga */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            ⭐ Top Rated
          </h2>
          <p className="text-gray-400 text-lg">Highest rated manga by our community</p>
        </div>
        <TrendingMangaAsync sort="top" />
      </section>

      {/* Personalized Recommendations (if logged in) */}
      <section className="py-16 px-4 max-w-7xl mx-auto bg-gradient-to-r from-blue-800/50 to-indigo-800/50 rounded-3xl backdrop-blur-sm">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            💫 Recommended For You
          </h2>
          <p className="text-gray-400 text-lg">Personalized manga suggestions just for you</p>
        </div>
        {isAuthenticated ? (
          <div className="text-center py-12">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full border border-blue-500/30">
              <span className="text-blue-300 text-lg">✨ Personalized recommendations coming soon!</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
              <span className="text-purple-300 text-lg">🔐 Sign in to see personalized manga recommendations!</span>
            </div>
          </div>
        )}
      </section>

      {/* Community Activity Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🌟 Community Activity
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            See what the manga community is up to - new uploads, ratings, and social interactions
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <ActivityFeed feedType="global" limit={10} />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 py-16 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
              MangaReader
            </h3>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Your ultimate destination for reading manga online. Join thousands of readers and creators in our vibrant community.
            </p>
          </div>

          <div className="flex flex-wrap gap-8 justify-center text-sm mb-8">
            <Link href="/about" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 font-medium">About</Link>
            <Link href="/contact" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 font-medium">Contact</Link>
            <Link href="/terms" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 font-medium">Terms</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 font-medium">Privacy</Link>
            <Link href="/help" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 font-medium">Help</Link>
            <Link href="/pricing" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 font-medium">Pricing</Link>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <p className="text-gray-500">
              &copy; {new Date().getFullYear()} MangaReader. All rights reserved. Made with ❤️ for manga lovers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}











