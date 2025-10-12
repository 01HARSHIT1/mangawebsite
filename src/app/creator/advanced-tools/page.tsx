'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaPalette, FaUsers, FaBrain, FaRocket, FaChartLine, FaEdit, FaImage, FaVideo, FaCode } from 'react-icons/fa';
import MangaEditor from '@/components/MangaEditor';
import CreatorCollaboration from '@/components/CreatorCollaboration';
import AIRecommendations from '@/components/AIRecommendations';

interface CreatorManga {
    _id: string;
    title: string;
    coverImage: string;
    chapters: number;
    status: string;
    views: number;
    likes: number;
    collaborators: number;
}

export default function AdvancedCreatorTools() {
    const [activeTab, setActiveTab] = useState<'editor' | 'collaboration' | 'ai-insights' | 'templates'>('editor');
    const [userManga, setUserManga] = useState<CreatorManga[]>([]);
    const [selectedManga, setSelectedManga] = useState<CreatorManga | null>(null);
    const [showEditor, setShowEditor] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        loadUserManga();
    }, [isAuthenticated, router]);

    const loadUserManga = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch('/api/creator/manga', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setUserManga(data.manga || []);
                if (data.manga.length > 0) {
                    setSelectedManga(data.manga[0]);
                }
            } else {
                // Mock data for demonstration
                const mockManga: CreatorManga[] = [
                    {
                        _id: '1',
                        title: 'Dragon Chronicles',
                        coverImage: '/placeholder-page-1.svg',
                        chapters: 25,
                        status: 'ongoing',
                        views: 15420,
                        likes: 892,
                        collaborators: 2
                    },
                    {
                        _id: '2',
                        title: 'Space Adventure',
                        coverImage: '/placeholder-page-2.svg',
                        chapters: 12,
                        status: 'ongoing',
                        views: 7350,
                        likes: 445,
                        collaborators: 1
                    }
                ];
                setUserManga(mockManga);
                setSelectedManga(mockManga[0]);
            }
        } catch (error) {
            console.error('Failed to load user manga:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        {
            id: 'editor' as const,
            name: 'Manga Editor',
            icon: FaPalette,
            description: 'In-browser drawing and editing tools'
        },
        {
            id: 'collaboration' as const,
            name: 'Collaboration',
            icon: FaUsers,
            description: 'Team up with other creators'
        },
        {
            id: 'ai-insights' as const,
            name: 'AI Insights',
            icon: FaBrain,
            description: 'AI-powered analytics and suggestions'
        },
        {
            id: 'templates' as const,
            name: 'Templates',
            icon: FaImage,
            description: 'Professional manga templates'
        }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading advanced creator tools...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        🚀 Advanced Creator Tools
                    </h1>
                    <p className="text-gray-300">Professional tools for manga creation and collaboration</p>
                </div>

                {/* Manga Selection */}
                {userManga.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold mb-4">Select Manga to Work On</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {userManga.map((manga) => (
                                <button
                                    key={manga._id}
                                    onClick={() => setSelectedManga(manga)}
                                    className={`p-4 rounded-2xl border transition-all duration-300 text-left ${
                                        selectedManga?._id === manga._id
                                            ? 'border-purple-400 bg-purple-500/20'
                                            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-16 bg-gray-600 rounded overflow-hidden">
                                            <img 
                                                src={manga.coverImage} 
                                                alt={manga.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-white font-medium">{manga.title}</h3>
                                            <p className="text-gray-400 text-sm">
                                                {manga.chapters} chapters • {manga.views.toLocaleString()} views
                                            </p>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                                                    {manga.status}
                                                </span>
                                                {manga.collaborators > 0 && (
                                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                                        {manga.collaborators} collaborators
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex space-x-1 bg-slate-800/50 rounded-2xl p-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 ${
                                    activeTab === tab.id
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                                }`}
                            >
                                <tab.icon />
                                <span className="font-medium">{tab.name}</span>
                            </button>
                        ))}
                    </div>
                    
                    {/* Tab Description */}
                    <p className="text-gray-400 text-center mt-3">
                        {tabs.find(t => t.id === activeTab)?.description}
                    </p>
                </div>

                {/* Tab Content */}
                <div className="bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm">
                    {activeTab === 'editor' && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold mb-4 text-white">🎨 Professional Manga Editor</h2>
                                <p className="text-gray-300 mb-6">
                                    Create and edit manga pages with professional drawing tools, layers, and real-time collaboration.
                                </p>
                                
                                <button
                                    onClick={() => setShowEditor(true)}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    🚀 Launch Editor
                                </button>
                            </div>

                            {/* Editor Features */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-slate-700/30 rounded-2xl p-6">
                                    <FaPalette className="text-purple-400 text-2xl mb-3" />
                                    <h3 className="text-white font-semibold mb-2">Professional Tools</h3>
                                    <p className="text-gray-400 text-sm">
                                        Pen, brush, eraser, text, and shape tools with customizable settings
                                    </p>
                                </div>
                                
                                <div className="bg-slate-700/30 rounded-2xl p-6">
                                    <FaImage className="text-green-400 text-2xl mb-3" />
                                    <h3 className="text-white font-semibold mb-2">Layer System</h3>
                                    <p className="text-gray-400 text-sm">
                                        Multiple layers with blend modes and opacity controls
                                    </p>
                                </div>
                                
                                <div className="bg-slate-700/30 rounded-2xl p-6">
                                    <FaUsers className="text-blue-400 text-2xl mb-3" />
                                    <h3 className="text-white font-semibold mb-2">Real-time Collaboration</h3>
                                    <p className="text-gray-400 text-sm">
                                        Work together with your team in real-time
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'collaboration' && selectedManga && (
                        <CreatorCollaboration
                            mangaId={selectedManga._id}
                            mangaTitle={selectedManga.title}
                            isOwner={true}
                        />
                    )}

                    {activeTab === 'ai-insights' && (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold mb-4 text-white">🤖 AI Creator Insights</h2>
                                <p className="text-gray-300">
                                    Get AI-powered insights about your manga performance and audience preferences.
                                </p>
                            </div>

                            {/* AI Insights Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Performance Insights */}
                                <div className="bg-slate-700/30 rounded-2xl p-6">
                                    <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                                        <FaChartLine className="text-green-400" />
                                        <span>Performance Insights</span>
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Engagement Rate</span>
                                            <span className="text-green-400 font-semibold">+15.3%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Reader Retention</span>
                                            <span className="text-blue-400 font-semibold">87.2%</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Best Upload Time</span>
                                            <span className="text-purple-400 font-semibold">6-8 PM</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Audience Insights */}
                                <div className="bg-slate-700/30 rounded-2xl p-6">
                                    <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                                        <FaBrain className="text-purple-400" />
                                        <span>Audience Insights</span>
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-gray-300 text-sm">Top Reader Demographics</span>
                                            <div className="mt-2 space-y-1">
                                                <div className="flex justify-between">
                                                    <span className="text-white">Age 16-25</span>
                                                    <span className="text-purple-400">45%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-white">Age 26-35</span>
                                                    <span className="text-blue-400">32%</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <span className="text-gray-300 text-sm">Preferred Genres</span>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">Fantasy</span>
                                                <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">Adventure</span>
                                                <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">Action</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Recommendations for Creators */}
                            <div className="bg-slate-700/30 rounded-2xl p-6">
                                <h3 className="text-white font-semibold mb-4 flex items-center space-x-2">
                                    <FaRocket className="text-orange-400" />
                                    <span>AI Suggestions for Your Content</span>
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-800/50 rounded-lg p-4">
                                        <h4 className="text-white font-medium mb-2">Story Suggestions</h4>
                                        <ul className="text-gray-300 text-sm space-y-1">
                                            <li>• Consider adding more character development in Chapter 26</li>
                                            <li>• Your readers love action scenes - add more combat</li>
                                            <li>• Romance subplot showing high engagement</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-slate-800/50 rounded-lg p-4">
                                        <h4 className="text-white font-medium mb-2">Optimization Tips</h4>
                                        <ul className="text-gray-300 text-sm space-y-1">
                                            <li>• Upload chapters on Fridays for 23% more views</li>
                                            <li>• Use cliffhangers to increase retention by 15%</li>
                                            <li>• Add more dialogue for better engagement</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold mb-4 text-white">📋 Professional Templates</h2>
                                <p className="text-gray-300">
                                    Start with professional manga templates to speed up your creation process.
                                </p>
                            </div>

                            {/* Template Categories */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="bg-slate-700/30 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer">
                                    <FaImage className="text-blue-400 text-3xl mb-4" />
                                    <h3 className="text-white font-semibold mb-2">Page Layouts</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Professional page layouts and panel arrangements
                                    </p>
                                    <div className="text-purple-400 text-sm font-medium">15 templates available</div>
                                </div>

                                <div className="bg-slate-700/30 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer">
                                    <FaEdit className="text-green-400 text-3xl mb-4" />
                                    <h3 className="text-white font-semibold mb-2">Speech Bubbles</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Various speech bubble styles and text effects
                                    </p>
                                    <div className="text-purple-400 text-sm font-medium">25 styles available</div>
                                </div>

                                <div className="bg-slate-700/30 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer">
                                    <FaVideo className="text-red-400 text-3xl mb-4" />
                                    <h3 className="text-white font-semibold mb-2">Action Effects</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Dynamic action lines, speed effects, and impact visuals
                                    </p>
                                    <div className="text-purple-400 text-sm font-medium">30 effects available</div>
                                </div>

                                <div className="bg-slate-700/30 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer">
                                    <FaCode className="text-yellow-400 text-3xl mb-4" />
                                    <h3 className="text-white font-semibold mb-2">Backgrounds</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Pre-made backgrounds for different scenes and moods
                                    </p>
                                    <div className="text-purple-400 text-sm font-medium">40 backgrounds available</div>
                                </div>

                                <div className="bg-slate-700/30 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer">
                                    <FaUsers className="text-purple-400 text-3xl mb-4" />
                                    <h3 className="text-white font-semibold mb-2">Character Poses</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        Reference poses and character templates
                                    </p>
                                    <div className="text-purple-400 text-sm font-medium">50+ poses available</div>
                                </div>

                                <div className="bg-slate-700/30 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300 cursor-pointer">
                                    <FaBrain className="text-orange-400 text-3xl mb-4" />
                                    <h3 className="text-white font-semibold mb-2">AI Generated</h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        AI-generated templates based on your style
                                    </p>
                                    <div className="text-purple-400 text-sm font-medium">∞ possibilities</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 flex justify-center space-x-4">
                    <button
                        onClick={() => setShowEditor(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 flex items-center space-x-2"
                    >
                        <FaPalette />
                        <span>Open Editor</span>
                    </button>
                    
                    <button
                        onClick={() => router.push('/upload')}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 flex items-center space-x-2"
                    >
                        <FaRocket />
                        <span>Upload New Manga</span>
                    </button>
                </div>
            </div>

            {/* Manga Editor Modal */}
            {showEditor && selectedManga && (
                <MangaEditor
                    chapterId={selectedManga._id}
                    pageNumber={1}
                    isCollaborative={selectedManga.collaborators > 0}
                    onClose={() => setShowEditor(false)}
                    onSave={(imageData) => {
                        console.log('Saving manga page:', imageData);
                        setShowEditor(false);
                    }}
                />
            )}
        </div>
    );
}
