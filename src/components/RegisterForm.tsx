'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SocialLogin from './SocialLogin';

interface RegisterFormProps {
    onSuccess?: () => void;
    onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { register } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setIsLoading(false);
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setIsLoading(false);
            return;
        }

        try {
            const success = await register(email, username, password);
            if (success) {
                onSuccess?.();
            } else {
                setError('Registration failed. Email or username may already be taken.');
            }
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-purple-500/20 backdrop-blur-md">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-4">
                    <span className="text-2xl">🚀</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    Join MangaReader
                </h2>
                <p className="text-gray-400 mt-2">Create your account and start reading</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center">
                        <span className="mr-2">⚠️</span>
                        {error}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-300">
                        Email Address
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                            placeholder="Enter your email"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-gray-400">📧</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-300">
                        Username
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                            placeholder="Choose a username"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-gray-400">👤</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-300">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                            placeholder="Create a password (min 6 characters)"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-gray-400">🔒</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-300">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                            placeholder="Confirm your password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-gray-400">🔐</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <span className="relative z-10">
                        {isLoading ? '🔄 Creating Account...' : '✨ Create Account'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
            </form>

            {/* Social Login */}
            <SocialLogin
                onSuccess={onSuccess}
                onError={(error) => setError(error)}
            />

            {onSwitchToLogin && (
                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-300"
                        >
                            Login here
                        </button>
                    </p>
                </div>
            )}
        </div>
    );
}
