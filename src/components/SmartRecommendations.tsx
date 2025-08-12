"use client";
import { useState, useEffect, useCallback } from 'react';
import { FaFire, FaStar, FaEye, FaHeart, FaBookmark, FaSpinner, FaArrowRight } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';

interface Manga {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  genres: string[];
  status: string;
  rating: number;
  views: number;
  likes: number;
  chapters: number;
  author: string;
  year: number;
  similarity?: number;
}

interface SmartRecommendationsProps {
  currentUser?: any;
  currentMangaId?: string;
}

export default function SmartRecommendations({ currentUser, currentMangaId }: SmartRecommendationsProps) {
  const [personalized, setPersonalized] = useState<Manga[]>([]);
  const [trending, setTrending] = useState<Manga[]>([]);
  const [similar, setSimilar] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'similar'>('personalized');
  const [error, setError] = useState<string | null>(null);

  const fetchPersonalized = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/manga/recommendations/personalized', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data = await res.json();
        setPersonalized(data.manga || []);
      }
    } catch (err) {
      console.error('Failed to fetch personalized recommendations:', err);
    }
  }, [currentUser]);

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch('/api/manga/recommendations/trending');
      if (res.ok) {
        const data = await res.json();
        setTrending(data.manga || []);
      }
    } catch (err) {
      console.error('Failed to fetch trending manga:', err);
    }
  }, []);

  const fetchSimilar = useCallback(async () => {
    if (!currentMangaId) return;
    try {
      const res = await fetch(`/api/manga/${currentMangaId}/similar`);
      if (res.ok) {
        const data = await res.json();
        setSimilar(data.manga || []);
      }
    } catch (err) {
      console.error('Failed to fetch similar manga:', err);
    }
  }, [currentMangaId]);

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([fetchPersonalized(), fetchTrending(), fetchSimilar()]);
      } catch (err) {
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    loadRecommendations();
  }, [fetchPersonalized, fetchTrending, fetchSimilar]);

  const getCurrentRecommendations = () => {
    switch (activeTab) {
      case 'personalized':
        return personalized;
      case 'trending':
        return trending;
      case 'similar':
        return similar;
      default:
        return [] as Manga[];
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'personalized':
        return 'For You';
      case 'trending':
        return 'Trending Now';
      case 'similar':
        return 'Similar Manga';
      default:
        return '';
    }
  };

  const getTabIcon = () => {
    switch (activeTab) {
      case 'personalized':
        return <FaHeart className="text-pink-400" />;
      case 'trending':
        return <FaFire className="text-orange-400" />;
      case 'similar':
        return <FaStar className="text-yellow-400" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="flex justify-center py-8">
          <FaSpinner className="animate-spin text-3xl text-blue-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="text-center py-8">
          <p className="text-red-400 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentRecommendations = getCurrentRecommendations();

  return (
    <div className="bg-gray-900 rounded-2xl shadow-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {getTabIcon()}
          <h2 className="text-2xl font-bold text-white">{getTabTitle()}</h2>
        </div>
        {/* Tab Navigation */}
        <div className="flex gap-2">
          {currentUser && (
            <button
              onClick={() => setActiveTab('personalized')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                activeTab === 'personalized' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              For You
            </button>
          )}
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              activeTab === 'trending' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Trending
          </button>
          {currentMangaId && (
            <button
              onClick={() => setActiveTab('similar')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                activeTab === 'similar' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Similar
            </button>
          )}
        </div>
      </div>

      {/* Recommendations Grid */}
      {currentRecommendations.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">{activeTab === 'personalized' ? '💝' : activeTab === 'trending' ? '🔥' : '⭐'}</div>
          <p className="text-gray-400">
            {activeTab === 'personalized'
              ? 'No personalized recommendations yet'
              : activeTab === 'trending'
              ? 'No trending manga available'
              : 'No similar manga found'}
          </p>
          <p className="text-sm text-gray-500">
            {activeTab === 'personalized'
              ? 'Start reading to get personalized suggestions!'
              : activeTab === 'trending'
              ? 'Check back later for trending content'
              : 'Try exploring other genres'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentRecommendations.map((manga, index) => (
            <motion.div
              key={manga._id ? manga._id : index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.1 }}
              className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-all duration-200 hover:scale-105"
            >
              <Link href={`/manga/${manga._id}`}>
                <div className="relative">
                  <OptimizedImage src={manga.coverImage} alt={manga.title} width={120} height={180} className="object-cover w-full h-full" fallbackSrc="/file.svg" />
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs capitalize">{manga.status}</div>
                  {/* Rating Badge */}
                  {manga.rating > 0 && (
                    <div className="absolute bottom-2 left-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                      <FaStar />
                      {manga.rating.toFixed(1)}
                    </div>
                  )}
                  {/* Similarity Score for similar manga */}
                  {activeTab === 'similar' && manga.similarity && (
                    <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                      {Math.round(manga.similarity * 100)}% match
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-1">{manga.title}</h3>
                  <p className="text-gray-400 text-sm mb-2">{manga.description}</p>
                  {/* Author and Year */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                    <span className="truncate">{manga.author}</span>
                    <span>{manga.year}</span>
                  </div>
                  {/* Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <FaEye />
                      {manga.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FaHeart />
                      {manga.likes.toLocaleString()}
                    </span>
                    <span>{manga.chapters} ch</span>
                  </div>
                  {/* Genres */}
                  {manga.genres && manga.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {manga.genres.slice(0, 2).map((genre, idx) => (
                        <span key={(genre || 'genre') + '-' + idx} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                          {genre}
                        </span>
                      ))}
                      {manga.genres.length > 2 && <span className="text-gray-500 text-xs">+{manga.genres.length - 2}</span>}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* View More Button */}
      {currentRecommendations.length > 0 && (
        <div className="mt-6 text-center">
          <Link href="/series" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold px-4 py-2">
            View More Manga
            <FaArrowRight />
          </Link>
        </div>
      )}

      {/* Recommendation Info */}
      <div className="mt-6 bg-gray-800 p-4 rounded-lg">
        <h4 className="text-white font-semibold mb-2">How recommendations work</h4>
        <div className="text-sm text-gray-400 space-y-1">
          {activeTab === 'personalized' && (
            <>
              <p>• Based on your reading history and preferences</p>
              <p>• Considers genres you enjoy and authors you follow</p>
              <p>• Updates as you read more manga</p>
            </>
          )}
          {activeTab === 'trending' && (
            <>
              <p>• Most popular manga in the last 30 days</p>
              <p>• Based on views, likes, and new chapter releases</p>
              <p>• Updated daily</p>
            </>
          )}
          {activeTab === 'similar' && (
            <>
              <p>• Manga with similar genres, themes, and style</p>
              <p>• Based on content analysis and user behavior</p>
              <p>• Perfect for discovering new series</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 