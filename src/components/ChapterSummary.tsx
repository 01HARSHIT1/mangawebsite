"use client";
import { useState, useEffect } from 'react';
import { FaFileAlt, FaSpinner, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface ChapterSummaryProps {
    chapterId: string;
    chapterNumber: number;
    enabled?: boolean;
}

interface SummaryData {
    summary: string;
    keyPoints: string[];
    emotionalTone: string;
    characterHighlights: string[];
    plotAdvancement: number;
}

export default function ChapterSummary({ chapterId, chapterNumber, enabled = true }: ChapterSummaryProps) {
    const [summary, setSummary] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled || !chapterId) return;
        
        const fetchSummary = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/chapters/${chapterId}/summary`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch summary');
                }
                
                const data = await response.json();
                setSummary(data.summary);
            } catch (err) {
                console.error('Error fetching chapter summary:', err);
                setError('Failed to load summary');
            } finally {
                setLoading(false);
            }
        };
        
        fetchSummary();
    }, [chapterId, enabled]);

    if (!enabled) return null;

    if (loading) {
        return (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/20 mb-4">
                <div className="flex items-center gap-2 text-purple-400">
                    <FaSpinner className="animate-spin" />
                    <span>Generating chapter summary...</span>
                </div>
            </div>
        );
    }

    if (error || !summary) {
        return null; // Don't show error, just hide the component
    }

    const toneColors: Record<string, string> = {
        'light': 'text-yellow-400',
        'serious': 'text-red-400',
        'emotional': 'text-pink-400',
        'action': 'text-orange-400',
        'mystery': 'text-purple-400',
        'romance': 'text-rose-400',
        'comedy': 'text-green-400'
    };

    return (
        <div className="bg-slate-800/50 rounded-lg border border-purple-500/20 mb-4 overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <FaFileAlt className="text-purple-400" />
                    <div className="text-left">
                        <h3 className="text-white font-semibold">Chapter {chapterNumber} Summary</h3>
                        <p className="text-sm text-gray-400">AI-generated summary</p>
                    </div>
                </div>
                {expanded ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
            </button>
            
            {expanded && (
                <div className="p-4 pt-0 space-y-4">
                    {/* Summary Text */}
                    <div>
                        <p className="text-gray-300 leading-relaxed">{summary.summary}</p>
                    </div>
                    
                    {/* Key Points */}
                    {summary.keyPoints && summary.keyPoints.length > 0 && (
                        <div>
                            <h4 className="text-white font-medium mb-2">Key Points:</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-300">
                                {summary.keyPoints.map((point, idx) => (
                                    <li key={idx} className="text-sm">{point}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    
                    {/* Emotional Tone */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Tone:</span>
                        <span className={`font-medium ${toneColors[summary.emotionalTone] || 'text-gray-300'}`}>
                            {summary.emotionalTone.charAt(0).toUpperCase() + summary.emotionalTone.slice(1)}
                        </span>
                    </div>
                    
                    {/* Plot Advancement */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-gray-400 text-sm">Plot Advancement</span>
                            <span className="text-white text-sm font-medium">{summary.plotAdvancement}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                                className="bg-purple-500 h-2 rounded-full transition-all"
                                style={{ width: `${summary.plotAdvancement}%` }}
                            />
                        </div>
                    </div>
                    
                    {/* Character Highlights */}
                    {summary.characterHighlights && summary.characterHighlights.length > 0 && (
                        <div>
                            <h4 className="text-white font-medium mb-2">Character Highlights:</h4>
                            <ul className="list-disc list-inside space-y-1 text-gray-300">
                                {summary.characterHighlights.map((highlight, idx) => (
                                    <li key={idx} className="text-sm">{highlight}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

