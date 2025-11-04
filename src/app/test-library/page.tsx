'use client';

import { useState } from 'react';

export default function TestLibraryPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const checkReadingHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setResult({ error: 'No token found. Please login first.' });
                return;
            }

            const response = await fetch('/api/debug/check-reading-history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setResult(data);
        } catch (error: any) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    const testRecordReading = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken') || localStorage.getItem('token');
            if (!token) {
                setResult({ error: 'No token found. Please login first.' });
                return;
            }

            // Test recording a reading entry
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'recordReading',
                    mangaId: 'test-manga-id',
                    chapterId: 'test-chapter-id',
                    chapterNumber: 1,
                    currentPage: 0
                })
            });

            const data = await response.json();
            setResult({ message: 'Test reading recorded', response: data });
        } catch (error: any) {
            setResult({ error: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Library System Test</h1>

                <div className="space-y-4 mb-8">
                    <button
                        onClick={checkReadingHistory}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
                    >
                        {loading ? 'Loading...' : 'Check My Reading History'}
                    </button>

                    <button
                        onClick={testRecordReading}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 ml-4"
                    >
                        {loading ? 'Loading...' : 'Test Record Reading'}
                    </button>
                </div>

                {result && (
                    <div className="bg-slate-800 rounded-lg p-6">
                        <h2 className="text-xl font-bold mb-4">Result:</h2>
                        <pre className="bg-black p-4 rounded overflow-auto text-sm">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="mt-8 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                    <h3 className="font-bold mb-2">📝 Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Click "Check My Reading History" to see what's saved</li>
                        <li>If empty, go read a chapter first</li>
                        <li>Come back and check again</li>
                        <li>The result will show exactly what's in your database</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}

