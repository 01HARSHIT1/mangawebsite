'use client';

import { useState } from 'react';
import { FaShare, FaTwitter, FaFacebook, FaWhatsapp, FaCopy, FaDiscord, FaReddit, FaTelegram } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface SocialShareProps {
    title: string;
    description?: string;
    url?: string;
    imageUrl?: string;
    hashtags?: string[];
    size?: 'small' | 'medium' | 'large';
    variant?: 'button' | 'dropdown' | 'modal';
}

export default function SocialShare({ 
    title, 
    description = '', 
    url, 
    imageUrl,
    hashtags = ['manga', 'mangareader'],
    size = 'medium',
    variant = 'dropdown'
}: SocialShareProps) {
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [copied, setCopied] = useState(false);

    // Get current URL if not provided
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareText = `${title}${description ? ` - ${description}` : ''}`;
    const hashtagString = hashtags.map(tag => `#${tag}`).join(' ');

    const shareOptions = [
        {
            name: 'Twitter',
            icon: FaTwitter,
            color: 'hover:bg-blue-500',
            action: () => {
                const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${encodeURIComponent(hashtags.join(','))}`;
                window.open(twitterUrl, '_blank', 'width=600,height=400');
            }
        },
        {
            name: 'Facebook',
            icon: FaFacebook,
            color: 'hover:bg-blue-600',
            action: () => {
                const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
                window.open(facebookUrl, '_blank', 'width=600,height=400');
            }
        },
        {
            name: 'WhatsApp',
            icon: FaWhatsapp,
            color: 'hover:bg-green-500',
            action: () => {
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
                window.open(whatsappUrl, '_blank');
            }
        },
        {
            name: 'Discord',
            icon: FaDiscord,
            color: 'hover:bg-indigo-500',
            action: () => {
                copyToClipboard(`${shareText} ${shareUrl}`);
            }
        },
        {
            name: 'Reddit',
            icon: FaReddit,
            color: 'hover:bg-orange-500',
            action: () => {
                const redditUrl = `https://reddit.com/submit?title=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`;
                window.open(redditUrl, '_blank', 'width=600,height=400');
            }
        },
        {
            name: 'Telegram',
            icon: FaTelegram,
            color: 'hover:bg-blue-400',
            action: () => {
                const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
                window.open(telegramUrl, '_blank');
            }
        }
    ];

    const copyToClipboard = async (text: string = shareUrl) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: description,
                    url: shareUrl
                });
            } catch (error) {
                console.log('Native share cancelled or failed');
                setShowShareMenu(true);
            }
        } else {
            setShowShareMenu(true);
        }
    };

    const getButtonSize = () => {
        switch (size) {
            case 'small': return 'p-2 text-sm';
            case 'large': return 'p-4 text-lg';
            default: return 'p-3 text-base';
        }
    };

    if (variant === 'button') {
        return (
            <button
                onClick={handleNativeShare}
                className={`bg-slate-800/50 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-300 ${getButtonSize()}`}
                title="Share"
            >
                <FaShare />
            </button>
        );
    }

    return (
        <div className="relative">
            {/* Share Button */}
            <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className={`bg-slate-800/50 text-gray-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-300 flex items-center space-x-2 ${getButtonSize()}`}
            >
                <FaShare />
                {size !== 'small' && <span>Share</span>}
            </button>

            {/* Share Menu */}
            <AnimatePresence>
                {showShareMenu && (
                    <>
                        {/* Backdrop */}
                        <div 
                            className="fixed inset-0 z-40"
                            onClick={() => setShowShareMenu(false)}
                        />
                        
                        {/* Share Options */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            className="absolute bottom-full mb-2 right-0 bg-slate-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-purple-500/20 z-50 min-w-64"
                        >
                            <h3 className="text-white font-semibold mb-3 text-center">Share this manga</h3>
                            
                            {/* Social Platforms */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {shareOptions.map((option) => (
                                    <button
                                        key={option.name}
                                        onClick={() => {
                                            option.action();
                                            setShowShareMenu(false);
                                        }}
                                        className={`flex flex-col items-center space-y-1 p-3 rounded-lg bg-slate-800/50 text-gray-300 hover:text-white transition-all duration-300 ${option.color}`}
                                        title={option.name}
                                    >
                                        <option.icon className="text-xl" />
                                        <span className="text-xs">{option.name}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Copy Link */}
                            <div className="border-t border-slate-700 pt-3">
                                <button
                                    onClick={() => {
                                        copyToClipboard();
                                        setShowShareMenu(false);
                                    }}
                                    className="w-full flex items-center justify-center space-x-2 p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-gray-300 hover:text-white transition-all duration-300"
                                >
                                    <FaCopy />
                                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                                </button>
                            </div>

                            {/* Share URL Preview */}
                            <div className="mt-3 p-2 bg-slate-800/30 rounded-lg">
                                <p className="text-gray-400 text-xs truncate">{shareUrl}</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Copy Success Toast */}
            <AnimatePresence>
                {copied && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50"
                    >
                        <div className="flex items-center space-x-2">
                            <FaCopy />
                            <span>Link copied to clipboard!</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
