'use client';

import { useState } from 'react';
import { FaGoogle, FaFacebook, FaGithub, FaSpinner } from 'react-icons/fa';

interface SocialLoginProps {
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export default function SocialLogin({ onSuccess, onError }: SocialLoginProps) {
    const [loading, setLoading] = useState<string | null>(null);

    const handleSocialLogin = async (provider: 'google' | 'facebook' | 'github') => {
        setLoading(provider);

        try {
            // For now, show a coming soon message
            // In production, you would integrate with OAuth providers
            setTimeout(() => {
                setLoading(null);
                if (onError) {
                    onError('Social login coming soon! Please use email registration for now.');
                }
            }, 1000);

            // Future implementation would look like:
            // const response = await signIn(provider, { redirect: false });
            // if (response?.ok) {
            //     onSuccess?.();
            // } else {
            //     onError?.(response?.error || 'Login failed');
            // }
        } catch (error) {
            setLoading(null);
            onError?.('Social login failed. Please try again.');
        }
    };

    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-slate-800 text-gray-400">Or continue with</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {/* Google Login */}
                <button
                    onClick={() => handleSocialLogin('google')}
                    disabled={loading !== null}
                    className="group relative flex items-center justify-center px-4 py-3 border border-gray-600 rounded-xl text-white bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center">
                        {loading === 'google' ? (
                            <FaSpinner className="animate-spin text-xl mr-3" />
                        ) : (
                            <FaGoogle className="text-red-400 text-xl mr-3" />
                        )}
                        <span className="font-medium">
                            {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                {/* Facebook Login */}
                <button
                    onClick={() => handleSocialLogin('facebook')}
                    disabled={loading !== null}
                    className="group relative flex items-center justify-center px-4 py-3 border border-gray-600 rounded-xl text-white bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center">
                        {loading === 'facebook' ? (
                            <FaSpinner className="animate-spin text-xl mr-3" />
                        ) : (
                            <FaFacebook className="text-blue-400 text-xl mr-3" />
                        )}
                        <span className="font-medium">
                            {loading === 'facebook' ? 'Connecting...' : 'Continue with Facebook'}
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

                {/* GitHub Login */}
                <button
                    onClick={() => handleSocialLogin('github')}
                    disabled={loading !== null}
                    className="group relative flex items-center justify-center px-4 py-3 border border-gray-600 rounded-xl text-white bg-slate-700/50 hover:bg-slate-600/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="flex items-center">
                        {loading === 'github' ? (
                            <FaSpinner className="animate-spin text-xl mr-3" />
                        ) : (
                            <FaGithub className="text-gray-300 text-xl mr-3" />
                        )}
                        <span className="font-medium">
                            {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
                        </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
            </div>

            <div className="text-center">
                <p className="text-xs text-gray-400">
                    🚧 Social login coming soon! For now, please use email registration.
                </p>
            </div>
        </div>
    );
}
