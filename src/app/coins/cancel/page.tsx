"use client";
import { useRouter } from 'next/navigation';
import { FaTimes, FaArrowLeft, FaCoins } from 'react-icons/fa';

export default function CoinCancelPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="max-w-md w-full space-y-8 text-center">
                    {/* Cancel Icon */}
                    <div className="mx-auto w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                        <FaTimes className="text-red-400 text-4xl" />
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl font-bold text-red-400 mb-4">
                        Payment Cancelled
                    </h1>

                    {/* Message */}
                    <div className="bg-slate-800/50 rounded-3xl p-8 backdrop-blur-sm">
                        <p className="text-xl text-gray-300 mb-6">
                            Your payment was cancelled. No charges were made to your account.
                        </p>
                        <p className="text-gray-400 mb-8">
                            Don't worry! You can try purchasing coins again anytime to support your favorite manga creators.
                        </p>

                        {/* Action Buttons */}
                        <div className="space-y-4">
                            <button
                                onClick={() => router.push('/coins')}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                            >
                                <FaCoins className="mr-2" />
                                Try Again
                            </button>

                            <button
                                onClick={() => router.push('/')}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-300 flex items-center justify-center"
                            >
                                <FaArrowLeft className="mr-2" />
                                Back to Home
                            </button>
                        </div>
                    </div>

                    {/* Help Text */}
                    <div className="text-center">
                        <p className="text-sm text-gray-400">
                            Having trouble with payments?{' '}
                            <button
                                onClick={() => router.push('/contact')}
                                className="text-purple-400 hover:text-purple-300 underline"
                            >
                                Contact Support
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
