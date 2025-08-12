"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaGoogle, FaApple, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading...</div>}>
            <LoginClient />
        </Suspense>
    );
}

function LoginClient() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showForgot, setShowForgot] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetMsg, setResetMsg] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();

    // Check if user came from signup
    useEffect(() => {
        if (searchParams.get('from') === 'signup') {
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 5000);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('=== LOGIN FORM SUBMITTED ===');
        setError("");
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        console.log('Login response:', { status: res.status, data });

        if (!res.ok) {
            console.log('Login failed:', data.error);
            setModalMessage(data.error || "Login failed");
            setShowErrorModal(true);
        } else {
            console.log('Login successful, calling login function with:', {
                token: data.token ? data.token.substring(0, 20) + '...' : 'undefined',
                user: data.user
            });
            // Use the login function from auth context
            login(data.token, data.user);
            console.log('Login function called, redirecting to home...');

            // Add a small delay to ensure AuthContext updates properly
            setTimeout(() => {
                router.push("/");
            }, 200);
        }
    };

    const handleGoogleSignIn = () => {
        console.log('Google sign-in clicked');
        // TODO: Implement Google OAuth
        alert('Google sign-in coming soon!');
    };

    const handleAppleSignIn = () => {
        console.log('Apple sign-in clicked');
        // TODO: Implement Apple OAuth
        alert('Apple sign-in coming soon!');
    };

    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetMsg("");
        if (!resetEmail) {
            setResetMsg("Please enter your email.");
            return;
        }
        // Placeholder for password reset API call
        setResetMsg("Password reset link sent to your email!");
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Or{" "}
                        <a href="/signup" className="font-medium text-green-400 hover:text-green-300">
                            create a new account
                        </a>
                    </p>
                </div>

                {/* Success Message */}
                {showSuccessMessage && (
                    <div className="bg-green-900 border border-green-700 text-green-300 px-4 py-3 rounded-md">
                        <p className="text-sm">✅ Account created successfully! Please log in with your credentials.</p>
                    </div>
                )}

                {/* Social Login Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-700 rounded-md shadow-sm bg-white text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <FaGoogle className="h-5 w-5 mr-3" />
                        Sign in with Google
                    </button>

                    <button
                        onClick={handleAppleSignIn}
                        className="w-full flex items-center justify-center px-4 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <FaApple className="h-5 w-5 mr-3" />
                        Sign in with Apple
                    </button>
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-950 text-gray-400">Or continue with email</span>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-600 rounded bg-gray-800"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <button
                                type="button"
                                onClick={() => setShowForgot(true)}
                                className="font-medium text-green-400 hover:text-green-300"
                            >
                                Forgot your password?
                            </button>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Sign in
                        </button>
                    </div>
                </form>

                {/* Forgot Password Modal */}
                {showForgot && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-white">Reset Password</h3>
                                <button
                                    onClick={() => setShowForgot(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <form onSubmit={handleForgot}>
                                <div className="mb-4">
                                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="reset-email"
                                        value={resetEmail}
                                        onChange={(e) => setResetEmail(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                                        placeholder="Enter your email address"
                                        required
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgot(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                                    >
                                        Send Reset Link
                                    </button>
                                </div>
                                {resetMsg && (
                                    <p className="mt-2 text-sm text-green-400">{resetMsg}</p>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                {/* Error Modal */}
                {showErrorModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-white">Error</h3>
                                <button
                                    onClick={() => setShowErrorModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    <FaTimes />
                                </button>
                            </div>
                            <p className="text-red-400 mb-4">{modalMessage}</p>
                            <button
                                onClick={() => setShowErrorModal(false)}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 