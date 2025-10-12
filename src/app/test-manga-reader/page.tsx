"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TestMangaReaderPage() {
    const [testData, setTestData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTestData = async () => {
            try {
                setLoading(true);
                // First create test data
                const createResponse = await fetch('/api/test/create-test-chapter', {
                    method: 'POST'
                });
                
                if (createResponse.ok) {
                    const data = await createResponse.json();
                    setTestData(data);
                } else {
                    // Try to get existing data
                    const getResponse = await fetch('/api/test/create-test-chapter');
                    if (getResponse.ok) {
                        const data = await getResponse.json();
                        setTestData(data);
                    } else {
                        setError('Failed to create or fetch test data');
                    }
                }
            } catch (err) {
                setError('Network error: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTestData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <h1 className="text-2xl font-bold">Loading Test Data...</h1>
                    <p className="text-gray-400">Setting up manga reader demo</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Error Loading Test Data</h1>
                    <p className="text-red-400 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!testData) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">No Test Data Available</h1>
                    <p className="text-gray-400">Please create test data first</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-4">🧪 Manga Reader Test Page</h1>
                    <p className="text-xl text-gray-400">Test the complete manga reading experience</p>
                </div>

                {/* Test Data Info */}
                <div className="bg-gray-800 rounded-xl p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-blue-400">Test Data Created</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-green-400">📖 Manga</h3>
                            <p><strong>Title:</strong> {testData.manga.title}</p>
                            <p><strong>ID:</strong> <code className="bg-gray-700 px-2 py-1 rounded">{testData.manga._id}</code></p>
                            <p><strong>Genre:</strong> {testData.manga.genre}</p>
                            <p><strong>Status:</strong> {testData.manga.status}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2 text-purple-400">📄 Chapter</h3>
                            <p><strong>Number:</strong> {testData.chapter.chapterNumber}</p>
                            <p><strong>ID:</strong> <code className="bg-gray-700 px-2 py-1 rounded">{testData.chapter._id}</code></p>
                            <p><strong>Pages:</strong> {testData.chapter.pages.length}</p>
                            <p><strong>Status:</strong> {testData.chapter.status}</p>
                        </div>
                    </div>
                </div>

                {/* Test Links */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h3 className="text-xl font-bold mb-4 text-yellow-400">🎯 Test Manga Detail Page</h3>
                        <p className="text-gray-300 mb-4">
                            View the manga detail page with chapters list and navigation
                        </p>
                        <Link 
                            href={`/manga/${testData.manga._id}`}
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            View Manga Page →
                        </Link>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6">
                        <h3 className="text-xl font-bold mb-4 text-green-400">📖 Test Chapter Reader</h3>
                        <p className="text-gray-300 mb-4">
                            Experience the full manga reading interface with sample pages
                        </p>
                        <Link 
                            href={`/manga/${testData.manga._id}/chapter/${testData.chapter._id}`}
                            className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Read Chapter →
                        </Link>
                    </div>
                </div>

                {/* Features Demo */}
                <div className="bg-gray-800 rounded-xl p-6 mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-purple-400">🚀 Features to Test</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-semibold text-blue-400 mb-2">📱 Reading Experience</h4>
                            <ul className="text-gray-300 space-y-1 text-sm">
                                <li>• Vertical scrolling (infinite scroll)</li>
                                <li>• Horizontal scrolling mode</li>
                                <li>• Keyboard navigation (arrow keys, spacebar)</li>
                                <li>• Touch/mouse navigation</li>
                                <li>• Auto-hiding controls</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-green-400 mb-2">🎮 Navigation</h4>
                            <ul className="text-gray-300 space-y-1 text-sm">
                                <li>• Previous/Next page buttons</li>
                                <li>• Chapter navigation</li>
                                <li>• Quick chapter list</li>
                                <li>• Reading progress tracking</li>
                                <li>• Responsive design</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sample Pages Preview */}
                <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-2xl font-bold mb-4 text-orange-400">🖼️ Sample Pages Preview</h2>
                    <p className="text-gray-300 mb-4">
                        The test chapter contains {testData.chapter.pages.length} sample pages with placeholder images
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {testData.chapter.pages.map((page: string, index: number) => (
                            <div key={index} className="bg-gray-700 rounded-lg p-2 text-center">
                                <div className="w-full h-24 bg-gray-600 rounded mb-2 flex items-center justify-center">
                                    <span className="text-xs text-gray-400">Page {index + 1}</span>
                                </div>
                                <p className="text-xs text-gray-400">Page {index + 1}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-xl p-6 mt-8">
                    <h2 className="text-2xl font-bold mb-4 text-blue-400">📋 How to Test</h2>
                    <ol className="text-gray-300 space-y-2 list-decimal list-inside">
                        <li>Click "View Manga Page" to see the manga detail with chapters</li>
                        <li>Click "Read Chapter" to experience the full reading interface</li>
                        <li>Use arrow keys or click navigation buttons to navigate pages</li>
                        <li>Try switching between vertical and horizontal reading modes</li>
                        <li>Test the auto-hiding controls by moving your mouse</li>
                        <li>Use the quick navigation menu to jump between chapters</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
