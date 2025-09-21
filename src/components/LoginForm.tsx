'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SocialLogin from './SocialLogin';

interface LoginFormProps {
    onSuccess?: () => void;
    onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const success = await login(email, password);
            if (success) {
                onSuccess?.();
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            setError('Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl p-8 border border-purple-500/20 backdrop-blur-md">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
                    <span className="text-2xl">🔑</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Welcome Back
                </h2>
                <p className="text-gray-400 mt-2">Sign in to your account</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center">
                        <span className="mr-2">⚠️</span>
                        {error}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                            placeholder="Enter your email"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-gray-400">📧</span>
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
                            className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300"
                            placeholder="Enter your password"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            <span className="text-gray-400">🔒</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <span className="relative z-10">
                        {isLoading ? '🔄 Logging in...' : '🚀 Login'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </button>
            </form>

            {/* Social Login */}
            <SocialLogin
                onSuccess={onSuccess}
                onError={(error) => setError(error)}
            />

            {onSwitchToRegister && (
                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={onSwitchToRegister}
                            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-300"
                        >
                            Register here
                        </button>
                    </p>
                </div>
            )}
        </div>
    );
}
