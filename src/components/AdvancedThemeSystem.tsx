'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSun, FaMoon, FaPalette, FaEye, FaContrast } from 'react-icons/fa';

interface ThemeContextType {
    theme: 'dark' | 'light' | 'auto';
    colorScheme: 'default' | 'purple' | 'blue' | 'green' | 'orange';
    accessibility: {
        highContrast: boolean;
        reducedMotion: boolean;
        fontSize: 'small' | 'medium' | 'large';
    };
    setTheme: (theme: 'dark' | 'light' | 'auto') => void;
    setColorScheme: (scheme: 'default' | 'purple' | 'blue' | 'green' | 'orange') => void;
    setAccessibility: (settings: Partial<ThemeContextType['accessibility']>) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<'dark' | 'light' | 'auto'>('dark');
    const [colorScheme, setColorScheme] = useState<'default' | 'purple' | 'blue' | 'green' | 'orange'>('default');
    const [accessibility, setAccessibility] = useState({
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium' as const
    });

    useEffect(() => {
        // Load saved preferences
        const savedTheme = localStorage.getItem('theme') as any;
        const savedColorScheme = localStorage.getItem('colorScheme') as any;
        const savedAccessibility = localStorage.getItem('accessibility');

        if (savedTheme) setTheme(savedTheme);
        if (savedColorScheme) setColorScheme(savedColorScheme);
        if (savedAccessibility) {
            setAccessibility(JSON.parse(savedAccessibility));
        }
    }, []);

    useEffect(() => {
        // Apply theme to document
        const root = document.documentElement;

        // Theme classes
        root.classList.remove('theme-dark', 'theme-light', 'theme-auto');
        root.classList.add(`theme-${theme}`);

        // Color scheme classes
        root.classList.remove('scheme-default', 'scheme-purple', 'scheme-blue', 'scheme-green', 'scheme-orange');
        root.classList.add(`scheme-${colorScheme}`);

        // Accessibility classes
        root.classList.toggle('high-contrast', accessibility.highContrast);
        root.classList.toggle('reduced-motion', accessibility.reducedMotion);
        root.classList.remove('font-small', 'font-medium', 'font-large');
        root.classList.add(`font-${accessibility.fontSize}`);

        // Save preferences
        localStorage.setItem('theme', theme);
        localStorage.setItem('colorScheme', colorScheme);
        localStorage.setItem('accessibility', JSON.stringify(accessibility));
    }, [theme, colorScheme, accessibility]);

    const value = {
        theme,
        colorScheme,
        accessibility,
        setTheme,
        setColorScheme,
        setAccessibility: (settings: Partial<ThemeContextType['accessibility']>) => {
            setAccessibility(prev => ({ ...prev, ...settings }));
        }
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Theme Customizer Component
export function ThemeCustomizer({
    isOpen,
    onClose
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { theme, colorScheme, accessibility, setTheme, setColorScheme, setAccessibility } = useTheme();

    if (!isOpen) return null;

    const colorSchemes = [
        { id: 'default', name: 'Default', colors: ['#6366f1', '#8b5cf6', '#ec4899'] },
        { id: 'purple', name: 'Purple', colors: ['#8b5cf6', '#a855f7', '#c084fc'] },
        { id: 'blue', name: 'Blue', colors: ['#3b82f6', '#6366f1', '#8b5cf6'] },
        { id: 'green', name: 'Green', colors: ['#10b981', '#059669', '#047857'] },
        { id: 'orange', name: 'Orange', colors: ['#f59e0b', '#d97706', '#b45309'] }
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto border border-slate-600"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Customize Theme</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-8">
                    {/* Theme Mode */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                            <FaSun className="text-yellow-400" />
                            <span>Theme Mode</span>
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'dark', label: 'Dark', icon: FaMoon },
                                { id: 'light', label: 'Light', icon: FaSun },
                                { id: 'auto', label: 'Auto', icon: FaEye }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setTheme(option.id as any)}
                                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${theme === option.id
                                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                                            : 'border-slate-600 bg-slate-700 text-gray-400 hover:border-slate-500'
                                        }`}
                                >
                                    <option.icon className="text-xl mb-2 mx-auto" />
                                    <div className="text-sm font-medium">{option.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Scheme */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                            <FaPalette className="text-purple-400" />
                            <span>Color Scheme</span>
                        </h3>
                        <div className="space-y-3">
                            {colorSchemes.map((scheme) => (
                                <button
                                    key={scheme.id}
                                    onClick={() => setColorScheme(scheme.id as any)}
                                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 flex items-center space-x-4 ${colorScheme === scheme.id
                                            ? 'border-indigo-500 bg-indigo-500/20'
                                            : 'border-slate-600 bg-slate-700 hover:border-slate-500'
                                        }`}
                                >
                                    <div className="flex space-x-1">
                                        {scheme.colors.map((color, i) => (
                                            <div
                                                key={i}
                                                className="w-6 h-6 rounded-full"
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-white font-medium">{scheme.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accessibility */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                            <FaEye className="text-green-400" />
                            <span>Accessibility</span>
                        </h3>
                        <div className="space-y-4">
                            <label className="flex items-center justify-between">
                                <span className="text-gray-300">High Contrast</span>
                                <button
                                    onClick={() => setAccessibility({ highContrast: !accessibility.highContrast })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${accessibility.highContrast ? 'bg-indigo-600' : 'bg-slate-600'
                                        }`}
                                >
                                    <motion.div
                                        animate={{ x: accessibility.highContrast ? 24 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
                                    />
                                </button>
                            </label>

                            <label className="flex items-center justify-between">
                                <span className="text-gray-300">Reduced Motion</span>
                                <button
                                    onClick={() => setAccessibility({ reducedMotion: !accessibility.reducedMotion })}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${accessibility.reducedMotion ? 'bg-indigo-600' : 'bg-slate-600'
                                        }`}
                                >
                                    <motion.div
                                        animate={{ x: accessibility.reducedMotion ? 24 : 0 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
                                    />
                                </button>
                            </label>

                            <div>
                                <label className="text-gray-300 mb-2 block">Font Size</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['small', 'medium', 'large'].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setAccessibility({ fontSize: size as any })}
                                            className={`p-2 rounded-lg border transition-all duration-200 capitalize ${accessibility.fontSize === size
                                                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                                                    : 'border-slate-600 bg-slate-700 text-gray-400 hover:border-slate-500'
                                                }`}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// Theme Toggle Button
export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'auto' : 'dark';
        setTheme(nextTheme);
    };

    const getIcon = () => {
        switch (theme) {
            case 'light': return FaSun;
            case 'dark': return FaMoon;
            case 'auto': return FaEye;
            default: return FaMoon;
        }
    };

    const Icon = getIcon();

    return (
        <motion.button
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white transition-all duration-200"
            title={`Current: ${theme} theme`}
        >
            <motion.div
                key={theme}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <Icon />
            </motion.div>
        </motion.button>
    );
}





