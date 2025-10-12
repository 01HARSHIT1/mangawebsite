"use client";
import { useState } from 'react';
import Link from 'next/link';
import { FaChevronDown, FaChevronUp, FaSearch, FaQuestionCircle, FaBook, FaUpload, FaUser } from 'react-icons/fa';

interface FAQ {
    id: number;
    category: string;
    question: string;
    answer: string;
}

const faqs: FAQ[] = [
    {
        id: 1,
        category: "Getting Started",
        question: "How do I create an account?",
        answer: "Click the 'Sign Up' button in the top navigation, fill in your email, username, and password. You'll receive a confirmation email to verify your account."
    },
    {
        id: 2,
        category: "Getting Started",
        question: "Is MangaReader free to use?",
        answer: "Yes! MangaReader is completely free for readers. You can read all manga, create reading lists, and participate in the community without any cost."
    },
    {
        id: 3,
        category: "Reading",
        question: "How do I read manga on MangaReader?",
        answer: "Browse our manga collection, click on any series you're interested in, then select a chapter to start reading. Our reader supports both vertical scrolling and page-by-page navigation."
    },
    {
        id: 4,
        category: "Reading",
        question: "Can I read manga offline?",
        answer: "Currently, MangaReader requires an internet connection to read manga. We're working on offline reading features for the future."
    },
    {
        id: 5,
        category: "Reading",
        question: "How do I bookmark my favorite manga?",
        answer: "When viewing a manga's details page, click the 'Bookmark' button. You can access all your bookmarked manga from your profile page."
    },
    {
        id: 6,
        category: "Creating",
        question: "How do I upload my own manga?",
        answer: "First, create an account and upgrade to a creator account. Then use the 'Upload' page to add your manga series and chapters. We support PDF uploads that are automatically converted to web-optimized images."
    },
    {
        id: 7,
        category: "Creating",
        question: "What file formats do you support?",
        answer: "We currently support PDF files for manga chapters. Our system automatically converts PDFs to high-quality PNG images for optimal web viewing."
    },
    {
        id: 8,
        category: "Creating",
        question: "How do I become a creator?",
        answer: "After creating a regular account, you can upgrade to a creator account through your profile settings or when you first try to upload content."
    },
    {
        id: 9,
        category: "Account",
        question: "How do I reset my password?",
        answer: "On the login page, click 'Forgot Password' and enter your email address. You'll receive instructions to reset your password."
    },
    {
        id: 10,
        category: "Account",
        question: "Can I change my username?",
        answer: "Currently, usernames cannot be changed after account creation. Please choose carefully when signing up."
    },
    {
        id: 11,
        category: "Technical",
        question: "Why is a manga not loading?",
        answer: "Try refreshing the page first. If the issue persists, it might be a temporary server issue. You can also try clearing your browser cache or using a different browser."
    },
    {
        id: 12,
        category: "Technical",
        question: "The website is running slowly. What can I do?",
        answer: "Slow loading can be caused by your internet connection, browser cache, or high server load. Try clearing your cache, using a different browser, or checking back later."
    }
];

export default function HelpPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    const categories = ['All', 'Getting Started', 'Reading', 'Creating', 'Account', 'Technical'];

    const filteredFAQs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const toggleFAQ = (id: number) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-6xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Help & Support
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Find answers to common questions and get help with using MangaReader
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid md:grid-cols-4 gap-6 mb-12">
                    <Link href="/contact" className="bg-slate-800/50 rounded-xl p-6 text-center hover:bg-slate-700/50 transition-colors group">
                        <FaQuestionCircle className="text-blue-400 text-3xl mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold mb-2">Contact Support</h3>
                        <p className="text-sm text-gray-300">Get personalized help</p>
                    </Link>
                    <Link href="/about" className="bg-slate-800/50 rounded-xl p-6 text-center hover:bg-slate-700/50 transition-colors group">
                        <FaBook className="text-green-400 text-3xl mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold mb-2">About Us</h3>
                        <p className="text-sm text-gray-300">Learn about MangaReader</p>
                    </Link>
                    <Link href="/upload" className="bg-slate-800/50 rounded-xl p-6 text-center hover:bg-slate-700/50 transition-colors group">
                        <FaUpload className="text-purple-400 text-3xl mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold mb-2">Upload Guide</h3>
                        <p className="text-sm text-gray-300">Start creating content</p>
                    </Link>
                    <Link href="/profile" className="bg-slate-800/50 rounded-xl p-6 text-center hover:bg-slate-700/50 transition-colors group">
                        <FaUser className="text-pink-400 text-3xl mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <h3 className="font-bold mb-2">My Account</h3>
                        <p className="text-sm text-gray-300">Manage your profile</p>
                    </Link>
                </div>

                {/* Search and Filter */}
                <div className="bg-slate-800/50 rounded-3xl p-8 mb-8 backdrop-blur-sm">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search for help topics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-purple-400"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>

                    {/* FAQ Section */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-purple-400 mb-6">Frequently Asked Questions</h2>
                        {filteredFAQs.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400">No FAQs found matching your search criteria.</p>
                            </div>
                        ) : (
                            filteredFAQs.map(faq => (
                                <div key={faq.id} className="bg-slate-700/50 rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => toggleFAQ(faq.id)}
                                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-600/50 transition-colors"
                                    >
                                        <div>
                                            <span className="text-sm text-purple-400 font-medium">{faq.category}</span>
                                            <h3 className="font-semibold text-lg">{faq.question}</h3>
                                        </div>
                                        {expandedFAQ === faq.id ? (
                                            <FaChevronUp className="text-purple-400" />
                                        ) : (
                                            <FaChevronDown className="text-purple-400" />
                                        )}
                                    </button>
                                    {expandedFAQ === faq.id && (
                                        <div className="px-6 pb-4">
                                            <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Contact Section */}
                <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 text-center border border-purple-500/20">
                    <h2 className="text-3xl font-bold mb-4">Still Need Help?</h2>
                    <p className="text-lg text-gray-300 mb-6">
                        Can't find what you're looking for? Our support team is here to help!
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            href="/contact"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                            Contact Support
                        </Link>
                        <Link
                            href="/"
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-colors duration-300"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
