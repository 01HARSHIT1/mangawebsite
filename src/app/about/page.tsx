"use client";
import Link from 'next/link';
import { FaHeart, FaUsers, FaBook, FaGlobe } from 'react-icons/fa';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-4xl mx-auto px-4 py-16">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        About MangaReader
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        Your ultimate destination for reading and sharing manga online. Built by manga lovers, for manga lovers.
                    </p>
                </div>

                {/* Mission Section */}
                <div className="bg-gradient-to-r from-slate-800/50 to-purple-800/50 rounded-3xl p-8 mb-12 backdrop-blur-sm">
                    <div className="flex items-center mb-6">
                        <FaHeart className="text-pink-400 text-3xl mr-4" />
                        <h2 className="text-3xl font-bold">Our Mission</h2>
                    </div>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        We believe that great stories should be accessible to everyone. MangaReader provides a platform where
                        creators can share their work with a global audience, and readers can discover amazing manga from
                        talented artists around the world. Our mission is to foster a vibrant community that celebrates
                        creativity, storytelling, and the art of manga.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-slate-800/50 rounded-2xl p-6 text-center backdrop-blur-sm">
                        <FaUsers className="text-blue-400 text-4xl mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-3">Community Driven</h3>
                        <p className="text-gray-300">
                            Built by the community, for the community. Connect with fellow manga enthusiasts worldwide.
                        </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-6 text-center backdrop-blur-sm">
                        <FaBook className="text-green-400 text-4xl mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-3">Creator Friendly</h3>
                        <p className="text-gray-300">
                            Easy-to-use tools for uploading and managing your manga, with analytics to track your success.
                        </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-2xl p-6 text-center backdrop-blur-sm">
                        <FaGlobe className="text-purple-400 text-4xl mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-3">Global Platform</h3>
                        <p className="text-gray-300">
                            Discover manga from creators around the world, with support for multiple languages and genres.
                        </p>
                    </div>
                </div>

                {/* Story Section */}
                <div className="bg-gradient-to-r from-blue-800/50 to-indigo-800/50 rounded-3xl p-8 mb-12 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                    <div className="space-y-4 text-lg text-gray-300">
                        <p>
                            MangaReader was born from a simple idea: what if there was a platform that truly understood
                            both readers and creators? We noticed that existing platforms often focused on one or the other,
                            but rarely both.
                        </p>
                        <p>
                            Our team of developers, designers, and manga enthusiasts came together to create something different.
                            A platform that provides an exceptional reading experience while giving creators the tools and
                            support they need to succeed.
                        </p>
                        <p>
                            Today, MangaReader hosts thousands of manga series from creators worldwide, providing a home for
                            both established artists and newcomers to share their stories with a global audience.
                        </p>
                    </div>
                </div>

                {/* Values Section */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-center mb-8">Our Values</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/30 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-purple-400 mb-3">Quality First</h3>
                            <p className="text-gray-300">
                                We prioritize high-quality content and user experience above all else.
                            </p>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-blue-400 mb-3">Community Support</h3>
                            <p className="text-gray-300">
                                Our community is our strength. We support both readers and creators equally.
                            </p>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-green-400 mb-3">Innovation</h3>
                            <p className="text-gray-300">
                                We continuously improve our platform with new features and technologies.
                            </p>
                        </div>
                        <div className="bg-slate-800/30 rounded-xl p-6">
                            <h3 className="text-xl font-bold text-pink-400 mb-3">Accessibility</h3>
                            <p className="text-gray-300">
                                Great manga should be accessible to everyone, everywhere.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 border border-purple-500/20">
                    <h2 className="text-3xl font-bold mb-4">Join Our Community</h2>
                    <p className="text-lg text-gray-300 mb-6">
                        Whether you're a reader looking for your next favorite series or a creator ready to share your work,
                        MangaReader is your home.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <Link
                            href="/signup"
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
                        >
                            Get Started
                        </Link>
                        <Link
                            href="/contact"
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-xl transition-colors duration-300"
                        >
                            Contact Us
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
