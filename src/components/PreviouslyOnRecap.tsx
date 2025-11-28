"use client";
import { useState, useEffect, useRef } from 'react';
import { FaHistory, FaSpinner, FaChevronDown, FaChevronUp, FaBookOpen } from 'react-icons/fa';
import Link from 'next/link';

interface PreviouslyOnRecapProps {
    mangaId: string;
    enabled?: boolean;
}

interface RecapData {
    recap: string;
    keyEvents: string[];
    characterStatus: string[];
    plotSummary: string;
    nextChapterPreview: string;
    lastReadChapter: number;
}

export default function PreviouslyOnRecap({ mangaId, enabled = true }: PreviouslyOnRecapProps) {
    const [recap, setRecap] = useState<RecapData | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(true); // Expanded by default
    const [error, setError] = useState<string | null>(null);

    // Use ref to prevent multiple simultaneous fetches
    const fetchingRef = useRef(false);
    
    useEffect(() => {
        if (!enabled || !mangaId || fetchingRef.current) return;
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        fetchingRef.current = true;
        
        const fetchRecap = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError(null); // Don't show error if not logged in
                    return;
                }
                
                const response = await fetch(`/api/manga/${mangaId}/previously-on`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    signal: controller.signal
                });
                
                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    if (data.message && data.message.includes('No reading history')) {
                        setError(null); // Don't show error if no history
                        return;
                    }
                    throw new Error('Failed to fetch recap');
                }
                
                const data = await response.json();
                if (data.recap) {
                    setRecap(data.recap);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') {
                    // Silently handle timeout
                } else {
                    // Silently handle errors
                }
                setError(null); // Don't show error, just hide
            } finally {
                clearTimeout(timeoutId);
                setLoading(false);
                fetchingRef.current = false;
            }
        };
        
        fetchRecap();
        
        return () => {
            controller.abort();
            clearTimeout(timeoutId);
            fetchingRef.current = false;
        };
    }, [mangaId, enabled]);

    if (!enabled) return null;

    if (loading) {
        return (
            <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/30 mb-4">
                <div className="flex items-center gap-2 text-purple-400">
                    <FaSpinner className="animate-spin" />
                    <span>Generating recap...</span>
                </div>
            </div>
        );
    }

    if (error || !recap) {
        return null; // Don't show error, just hide
    }

    return (
        <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg border border-purple-500/30 mb-4 overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-purple-800/30 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <FaHistory className="text-purple-400 text-xl" />
                    <div className="text-left">
                        <h3 className="text-white font-semibold">Previously On...</h3>
                        <p className="text-sm text-gray-300">Last read: Chapter {recap.lastReadChapter}</p>
                    </div>
                </div>
                {expanded ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
            </button>
            
            {expanded && (
                <div className="p-4 pt-0 space-y-4">
                    {/* Main Recap */}
                    <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
                        <p className="text-gray-200 leading-relaxed whitespace-pre-line">{recap.recap}</p>
                    </div>
                    
                    {/* Key Events */}
                    {recap.keyEvents && recap.keyEvents.length > 0 && (
                        <div>
                            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                                <FaBookOpen className="text-purple-400" />
                                Key Events:
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-300">
                                {recap.keyEvents.map((event, idx) => (
                                    <li key={idx} className="text-sm">{event}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {/* Plot Summary */}
                    {recap.plotSummary && (
                        <div className="bg-black/20 rounded-lg p-3 border border-purple-500/10">
                            <p className="text-gray-300 text-sm italic">{recap.plotSummary}</p>
                        </div>
                    )}
                    
                    {/* Next Chapter Preview */}
                    {recap.nextChapterPreview && (
                        <div className="bg-purple-900/30 rounded-lg p-3 border border-purple-500/20">
                            <p className="text-purple-200 text-sm font-medium">{recap.nextChapterPreview}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

