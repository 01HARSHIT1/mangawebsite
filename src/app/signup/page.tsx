"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaTimes } from 'react-icons/fa';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        nickname: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "viewer"
    });
    const [error, setError] = useState("");
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('=== SIGNUP FORM SUBMITTED ===');

        if (isSubmitting) {
            console.log('Form already submitting, ignoring...');
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            if (formData.password !== formData.confirmPassword) {
                setModalMessage("Passwords do not match");
                setShowErrorModal(true);
                return;
            }

            if (formData.password.length < 6) {
                setModalMessage("Password must be at least 6 characters long");
                setShowErrorModal(true);
                return;
            }

            console.log('Sending signup request with data:', {
                nickname: formData.nickname,
                email: formData.email,
                role: formData.role
            });

            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nickname: formData.nickname,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role
                }),
            });

            const data = await res.json();
            console.log('Signup response:', { status: res.status, data });

            if (!res.ok) {
                console.log('Signup failed:', data.error);
                setModalMessage(data.error || "Signup failed");
                setShowErrorModal(true);
            } else {
                console.log('Signup successful, redirecting to login...');
                // Show success message and redirect to login page
                setSuccessMessage("Account created successfully! Redirecting to login...");
                setShowSuccessModal(true);

                // Wait a moment, then redirect to login page
                setTimeout(() => {
                    router.push("/login?from=signup");
                }, 1500);
            }
        } catch (error) {
            console.error('Signup error:', error);
            setModalMessage("An unexpected error occurred. Please try again.");
            setShowErrorModal(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Or{" "}
                        <a href="/login" className="font-medium text-green-400 hover:text-green-300">
                            sign in to your existing account
                        </a>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="nickname" className="sr-only">
                                Username
                            </label>
                            <input
                                id="nickname"
                                name="nickname"
                                type="text"
                                autoComplete="username"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Username"
                                value={formData.nickname}
                                onChange={handleInputChange}
                            />
                        </div>
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
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleInputChange}
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
                                autoComplete="new-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="role" className="sr-only">
                                Role
                            </label>
                            <select
                                id="role"
                                name="role"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                                value={formData.role}
                                onChange={handleInputChange}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="creator">Creator</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating Account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </div>
                </form>

                {/* Success Modal */}
                {showSuccessModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
                            <div className="text-center">
                                <h3 className="text-lg font-medium text-white mb-4">Success!</h3>
                                <p className="text-green-400 mb-4">{successMessage}</p>
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                            </div>
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