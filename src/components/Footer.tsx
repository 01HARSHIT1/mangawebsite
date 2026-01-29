import Link from 'next/link';
import { FaEnvelope, FaPhone, FaShieldAlt, FaTruck, FaQuestionCircle } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-8 sm:py-12 mt-12 sm:mt-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    {/* Company Info */}
                    <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold text-white">RealmVerse</h3>
                        <p className="text-gray-400 text-xs sm:text-sm">
                            Your ultimate destination for digital manga content. Read, discover, and enjoy manga from around the world.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <FaEnvelope className="w-4 h-4" />
                                <span>harsshitrk0120@gmail.com</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                                <FaPhone className="w-4 h-4" />
                                <span>+91 7717743862</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Quick Links</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/manga" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Browse Manga
                                </Link>
                            </li>
                            <li>
                                <Link href="/genres" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Genres
                                </Link>
                            </li>
                            <li>
                                <Link href="/library" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    My Library
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Policies */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Legal & Policies</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/refund" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-2">
                                    <FaShieldAlt className="w-3 h-3" />
                                    <span>Refund Policy</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-2">
                                    <FaTruck className="w-3 h-3" />
                                    <span>Shipping Policy</span>
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center space-x-2">
                                    <FaQuestionCircle className="w-3 h-3" />
                                    <span>Contact Us</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Support</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Report Issue
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Feedback
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
                        <p className="text-gray-400 text-xs sm:text-sm">
                            © 2024 Time2fun. All rights reserved.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                            <Link href="/refund" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Refund Policy
                            </Link>
                            <Link href="/shipping" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Shipping Policy
                            </Link>
                            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Contact
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
