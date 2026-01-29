'use client';

import { useState, useEffect } from 'react';
import { FaDownload, FaMobile, FaTimes, FaApple, FaAndroid, FaDesktop } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [deviceType, setDeviceType] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');

    useEffect(() => {
        // Check if user has dismissed the install prompt before - check at component mount
        const installPromptDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
        if (installPromptDismissed) {
            return; // Don't set up anything if user dismissed it before
        }

        // Check if app is already installed
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
        setIsInstalled(window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches);

        // Detect device type
        const userAgent = navigator.userAgent;
        if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            setDeviceType('tablet');
        } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
            setDeviceType('mobile');
        } else {
            setDeviceType('desktop');
        }

        // Listen for install prompt
        const handleBeforeInstallPrompt = (e: Event) => {
            // Check localStorage again when event fires
            const isDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
            if (isDismissed) {
                return; // Don't proceed if dismissed
            }

            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show install prompt after user has spent some time on the site
            setTimeout(() => {
                // Check localStorage again before showing
                const stillDismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
                if (!isInstalled && !isStandalone && !stillDismissed) {
                    setShowInstallPrompt(true);
                }
            }, 30000); // Show after 30 seconds
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            console.log('🎉 PWA installed successfully');
            setIsInstalled(true);
            setShowInstallPrompt(false);
            setDeferredPrompt(null);
            localStorage.setItem('pwa-install-dismissed', 'true');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [isInstalled, isStandalone]);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
            } else {
                console.log('❌ User dismissed the install prompt');
            }

            setDeferredPrompt(null);
            setShowInstallPrompt(false);
        }
    };

    const getInstallInstructions = () => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);

        if (isIOS) {
            return {
                icon: <FaApple className="text-2xl" />,
                title: "Install on iOS",
                steps: [
                    "1. Tap the Share button in Safari",
                    "2. Scroll down and tap 'Add to Home Screen'",
                    "3. Tap 'Add' to install the app"
                ]
            };
        } else if (isAndroid) {
            return {
                icon: <FaAndroid className="text-2xl" />,
                title: "Install on Android",
                steps: [
                    "1. Tap the menu (⋮) in Chrome",
                    "2. Tap 'Add to Home screen'",
                    "3. Tap 'Add' to install the app"
                ]
            };
        } else {
            return {
                icon: <FaDesktop className="text-2xl" />,
                title: "Install on Desktop",
                steps: [
                    "1. Look for the install icon in your browser's address bar",
                    "2. Click 'Install RealmVerse'",
                    "3. The app will be added to your desktop"
                ]
            };
        }
    };

    // Don't show if already installed, in standalone mode, or if user dismissed it
    const installPromptDismissed = typeof window !== 'undefined' && localStorage.getItem('pwa-install-dismissed') === 'true';
    if (isInstalled || isStandalone || installPromptDismissed) {
        return null;
    }

    return (
        <>
            {/* Install Button in Navigation */}
            {deferredPrompt && (
                <button
                    onClick={handleInstallClick}
                    className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg"
                >
                    <FaDownload />
                    <span>Install App</span>
                </button>
            )}

            {/* Mobile Install Banner - Removed per user request */}
            {/* User requested to remove the install banner from bottom */}

            {/* Install Prompt Modal */}
            <AnimatePresence>
                {showInstallPrompt && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-slate-900 rounded-3xl p-8 max-w-md w-full border border-purple-500/20 shadow-2xl"
                        >
                            <div className="text-center mb-6">
                                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    {getInstallInstructions().icon}
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">
                                    Install RealmVerse
                                </h2>
                                <p className="text-gray-300">
                                    Get the full app experience with offline reading, push notifications, and faster loading.
                                </p>
                            </div>

                            {/* Features */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center space-x-3 text-gray-300">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span>📖 Offline reading capability</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-300">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span>🔔 Push notifications for new chapters</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-300">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span>⚡ Faster loading and better performance</span>
                                </div>
                                <div className="flex items-center space-x-3 text-gray-300">
                                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                    <span>📱 Native app-like experience</span>
                                </div>
                            </div>

                            {/* Install Instructions */}
                            {!deferredPrompt && (
                                <div className="mb-6">
                                    <h3 className="text-white font-semibold mb-3">
                                        {getInstallInstructions().title}
                                    </h3>
                                    <div className="space-y-2">
                                        {getInstallInstructions().steps.map((step, index) => (
                                            <p key={index} className="text-gray-300 text-sm">
                                                {step}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                                {deferredPrompt ? (
                                    <button
                                        onClick={handleInstallClick}
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                                    >
                                        Install Now
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setShowInstallPrompt(false);
                                            // Remember that user dismissed the prompt
                                            localStorage.setItem('pwa-install-dismissed', 'true');
                                        }}
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
                                    >
                                        Got it!
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        setShowInstallPrompt(false);
                                        // Remember that user dismissed the prompt
                                        localStorage.setItem('pwa-install-dismissed', 'true');
                                    }}
                                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
