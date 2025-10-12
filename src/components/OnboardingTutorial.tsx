'use client';

import React, { useState, useEffect, useRef } fromreact;
import { motion, AnimatePresence } fromframer - motion';
import { X, ChevronLeft, ChevronRight, Play, Pause, SkipForward, HelpCircle, BookOpen, Users, Search, Star, Settings } fromlucide - react';

interface TutorialStep {
    id: string;
    title: string;
    description: string;
    target?: string;
    position?: top' |bottom' | left' |right';
action ?: () => void;
completed ?: boolean;
}

interface OnboardingTutorialProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    userType?: new' | 'returning';
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
    isOpen,
    onClose,
    onComplete,
    userType = 'new'
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTooltips, setShowTooltips] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    const tutorialSteps: TutorialStep[] = [
        {
            id: 'welcome',
            title: 'Welcome to MangaReader!',
            description: 'Let\'s take a quick tour to help you get started with reading and discovering manga.',
            position: 'center'
        },
        {
            id: 'navigation',
            title: 'Navigation',
            description: 'Use the navigation bar to browse different sections. Home shows trending manga, Series lists all available manga, and Upload lets you contribute.',
            target: 'nav',
            position: 'bottom'
        },
        {
            id: 'search',
            title: 'Search & Discover',
            description: 'Use the search bar to find specific manga or explore by genre, author, or tags. We\'ll show you personalized recommendations based on your reading history.',
            target: 'search-bar',
            position: 'bottom'
        },
        {
            id: 'manga-card',
            title: 'Manga Cards',
            description: 'Click on any manga card to view details, read chapters, and see community ratings and comments.',
            target: 'manga-card',
            position: 'top'
        },
        {
            id: 'reader',
            title: 'Manga Reader',
            description: 'Our advanced reader supports multiple viewing modes, zoom controls, and auto-scroll. You can also adjust reading speed and track your progress.',
            target: 'reader-controls',
            position: 'left'
        },
        {
            id: 'community',
            title: 'Community Features',
            description: 'Rate manga, leave comments, follow other readers, and build your reading profile. Connect with fellow manga enthusiasts!',
            target: 'community-section',
            position: 'right'
        },
        {
            id: 'personalization',
            title: 'Personalization',
            description: 'Create reading lists, get personalized recommendations, and customize your experience with dark mode and other preferences.',
            target: 'user-menu',
            position: 'bottom'
        },
        {
            id: 'complete',
            title: 'You\'re All Set!',
            description: 'You now know the basics of MangaReader. Start exploring and enjoy your reading journey!',
            position: 'center'
        }
    ];

    const quickTips = [
        {
            icon: <Search className="w-4 h-4" />,
            title: 'Quick Search',
            description: 'Use Ctrl+K to quickly search for manga'
        },
        {
            icon: <BookOpen className="w-4 h-4" />,
            title: 'Reading Progress',
            description: 'Your reading progress is automatically saved'
        },
        {
            icon: <Users className="w-4 h-4" />,
            title: 'Community',
            description: 'Follow other readers to discover new manga'
        },
        {
            icon: <Star className="w-4 h-4" />,
            title: 'Ratings',
            description: 'Rate manga to improve your recommendations'
        },
        {
            icon: <Settings className="w-4 h-4" />,
            title: 'Customization',
            description: 'Adjust reader settings for your preference'
        }
    ];

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setCurrentStep(0);
            setIsPlaying(false);
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (isPlaying) {
            const timer = setTimeout(() => {
                if (currentStep < tutorialSteps.length - 1) {
                    setCurrentStep(prev => prev + 1);
                } else {
                    setIsPlaying(false);
                }
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [currentStep, isPlaying, tutorialSteps.length]);

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    const handleStepClick = (stepIndex: number) => {
        setCurrentStep(stepIndex);
    };

    const currentStepData = tutorialSteps[currentStep];

    if (!isOpen) return null;

    return (
        <div className="fixed inset0 flex items-center justify-center">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Tutorial Container */}
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
                ref={overlayRef}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <HelpCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Getting Started
                            </h2>
                            <p className="text-sm text-gray-50 dark:text-gray-400">
                                Step {currentStep + 1} of {tutorialSteps.length}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-50 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="text-center"
                        >
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {currentStepData.title}
                            </h3>
                            <p className="text-gray-60 dark:text-gray-30 text-lg leading-relaxed mb-6">
                                {currentStepData.description}
                            </p>

                            {/* Step-specific content */}
                            {currentStepData.id === 'welcome' && (
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {quickTips.slice(0, 4).map((tip, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-left"
                                        >
                                            <div className="flex items-center space-x-3 mb-2">
                                                <div className="text-blue-500">{tip.icon}</div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {tip.title}
                                                </h4>
                                            </div>
                                            <p className="text-sm text-gray-60 dark:text-gray-400">
                                                {tip.description}
                                            </p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {currentStepData.id === 'complete' && (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {quickTips.map((tip, index) => (
                                            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div className="text-blue-500">{tip.icon}</div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-white">{tip.title}</h4>
                                                    <p className="text-sm text-gray-60 dark:text-gray-400">{tip.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-50 dark:text-gray-400 mb-2">
                            <span>Progress</span>
                            <span>{Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <motion.div
                                className="bg-blue-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>

                    {/* Step Indicators */}
                    <div className="flex justify-center space-x-2 mb-6">
                        {tutorialSteps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => handleStepClick(index)}
                                className={`w-3 h-3 rounded-full transition-colors ${index === currentStep
                                        ? 'bg-blue-500'
                                        : index < currentStep
                                            ? 'bg-green-500'
                                            : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                disabled={currentStep === tutorialSteps.length - 1}
                            >
                                {isPlaying ? (
                                    <Pause className="w-5 h-5 text-gray-50 dark:text-gray-400" />
                                ) : (
                                    <Play className="w-5 h-5 text-gray-50 dark:text-gray-400" />
                                )}
                            </button>
                            <button
                                onClick={handleSkip}
                                className="flex items-center space-x-1 text-gray-50 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                                <SkipForward className="w-4 h-4" />
                                <span className="text-sm">Skip</span>
                            </button>
                        </div>

                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handlePrevious}
                                disabled={currentStep === 0}
                                className="flex items-center space-x-1 px-4 py-2 text-gray-60 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                <span>Previous</span>
                            </button>
                            <button
                                onClick={handleNext}
                                className="flex items-center space-x-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                <span>{currentStep === tutorialSteps.length - 1 ? 'Finish' : 'Next'}</span>
                                {currentStep < tutorialSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OnboardingTutorial; 