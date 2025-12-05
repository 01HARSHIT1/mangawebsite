"use client";
import { useState, useEffect } from 'react';
import { FaHeart, FaLaugh, FaMoon, FaSun, FaBolt, FaLock, FaSearch, FaSpinner } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';

interface MoodDiscoveryProps {
    enabled?: boolean;
    limit?: number;
}

type MoodType = 'funny' | 'dark' | 'chill' | 'emotional' | 'fast-paced' | 'romantic' | 'mysterious' | 'action-packed';

interface MoodOption {
    id: MoodType;
    name: string;
    icon: any;
    color: string;
    description: string;
}

const MOOD_OPTIONS: MoodOption[] = [
    { id: 'funny', name: 'Funny', icon: FaLaugh, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', description: 'Light-hearted and humorous' },
    { id: 'dark', name: 'Dark', icon: FaMoon, color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', description: 'Dark and intense themes' },
    { id: 'chill', name: 'Chill', icon: FaSun, color: 'text-green-400 bg-green-400/10 border-green-400/20', description: 'Relaxing and easy-going' },
    { id: 'emotional', name: 'Emotional', icon: FaHeart, color: 'text-pink-400 bg-pink-400/10 border-pink-400/20', description: 'Emotionally impactful' },
    { id: 'fast-paced', name: 'Fast-Paced', icon: FaBolt, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', description: 'Action-packed adventures' },
    { id: 'romantic', name: 'Romantic', icon: FaHeart, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20', description: 'Love stories' },
    { id: 'mysterious', name: 'Mysterious', icon: FaLock, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', description: 'Mystery and intrigue' },
    { id: 'action-packed', name: 'Action', icon: FaBolt, color: 'text-red-400 bg-red-400/10 border-red-400/20', description: 'High-energy action' }
];

export default function MoodDiscovery({ enabled = true, limit = 12 }: MoodDiscoveryProps) {
    const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
    const [manga, setManga] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMoodManga = async (mood: MoodType) => {
        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/manga/mood-discovery?mood=${mood}&limit=${limit}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch mood recommendations');
            }
            
            const data = await response.json();
            setManga(data.manga || []);
        } catch (err) {
            console.error('Error fetching mood manga:', err);
            setError('Failed to load recommendations');
        } finally {
            setLoading(false);
        }
    };

    const handleMoodSelect = (mood: MoodType) => {
        setSelectedMood(mood);
        fetchMoodManga(mood);
    };

    if (!enabled) return null;

    return (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-700">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <FaSearch className="text-purple-400" />
                    Mood-Based Discovery
                </h2>
                <p className="text-gray-400">Find manga that matches your current mood using AI</p>
            </div>
            
            {/* Mood Selection */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {MOOD_OPTIONS.map((mood) => {
                    const Icon = mood.icon;
                    const isSelected = selectedMood === mood.id;
                    
                    return (
                        <button
                            key={mood.id}
                            onClick={() => handleMoodSelect(mood.id)}
                            className={`p-4 rounded-lg border-2 transition-all ${
                                isSelected
                                    ? `${mood.color} border-opacity-50 scale-105`
                                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:border-slate-600'
                            }`}
                        >
                            <Icon className="text-2xl mb-2 mx-auto" />
                            <div className="text-sm font-medium">{mood.name}</div>
                            <div className="text-xs opacity-75 mt-1">{mood.description}</div>
                        </button>
                    );
                })}
            </div>
            
            {/* Results */}
            {selectedMood && (
                <div>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <FaSpinner className="animate-spin text-purple-400 text-3xl" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-400">{error}</div>
                    ) : manga.length > 0 ? (
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">
                                {MOOD_OPTIONS.find(m => m.id === selectedMood)?.name} Recommendations
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {manga.map((m) => (
                                    <Link
                                        key={m._id}
                                        href={`/manga/${m._id}`}
                                        className="group"
                                    >
                                        <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-500 transition-all hover:scale-105">
                                            <div className="aspect-[3/4] relative bg-slate-700">
                                                {m.coverImage ? (
                                                    <img
                                                        src={m.coverImage}
                                                        alt={m.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                        No Cover
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-2">
                                                <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                                                    {m.title}
                                                </h4>
                                                {m.rating && (
                                                    <div className="text-yellow-400 text-xs mt-1">
                                                        ⭐ {m.rating.toFixed(1)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            No recommendations found for this mood
                        </div>
                    )}
                </div>
            )}
            
            {!selectedMood && (
                <div className="text-center py-12 text-gray-400">
                    Select a mood above to discover manga
                </div>
            )}
        </div>
    );
}

