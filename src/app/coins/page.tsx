"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaCoins, FaGift, FaCrown, FaRocket, FaSpinner, FaCheckCircle, FaQrcode } from 'react-icons/fa';
import RazorpayPayment from '@/components/RazorpayPayment';
import QRCodePayment from '@/components/QRCodePayment';

interface CoinPackage {
    id: string;
    coins: number;
    price: number;
    bonus: number;
    popular?: boolean;
    icon: React.ReactNode;
    features: string[];
}

const coinPackages: CoinPackage[] = [
    {
        id: 'starter',
        coins: 100,
        price: 0.99,
        bonus: 0,
        icon: <FaCoins className="text-yellow-400" />,
        features: ['Perfect for trying out', 'Tip your favorite creators', 'Support the community']
    },
    {
        id: 'popular',
        coins: 500,
        price: 4.99,
        bonus: 50,
        popular: true,
        icon: <FaGift className="text-green-400" />,
        features: ['Most popular choice', '50 bonus coins', 'Great value', 'Support multiple creators']
    },
    {
        id: 'premium',
        coins: 1000,
        price: 9.99,
        bonus: 200,
        icon: <FaCrown className="text-purple-400" />,
        features: ['Best value deal', '200 bonus coins', 'Premium supporter', 'Maximum creator support']
    },
    {
        id: 'ultimate',
        coins: 2500,
        price: 19.99,
        bonus: 750,
        icon: <FaRocket className="text-pink-400" />,
        features: ['Ultimate package', '750 bonus coins', 'VIP status', 'Maximum impact']
    }
];

export default function CoinsPage() {
    const [userCoins, setUserCoins] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'qr'>('razorpay');
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Fetch user's current coin balance
        const fetchCoins = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('/api/coins', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                setUserCoins(data.coins || 0);
            } catch (error) {
                console.error('Error fetching coins:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCoins();
    }, [isAuthenticated, router]);

    const handlePaymentSuccess = (paymentId: string) => {
        setSuccess('Payment successful! Coins have been added to your account.');
        setError(null);
        setPurchasing(null);
        fetchCoins(); // Refresh coins balance
    };

    const handlePaymentError = (errorMessage: string) => {
        setError(errorMessage);
        setSuccess(null);
        setPurchasing(null);
    };

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-6xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-6">
                        <FaCoins className="text-3xl text-white" />
                    </div>
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                        Purchase Coins
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-6">
                        Support your favorite manga creators by purchasing coins. Use coins to tip creators and show your appreciation for their amazing work!
                    </p>

                    {/* Current Balance */}
                    <div className="inline-flex items-center bg-slate-800/50 rounded-full px-6 py-3 backdrop-blur-sm">
                        <FaCoins className="text-yellow-400 mr-2" />
                        <span className="text-lg font-semibold">
                            Current Balance: {loading ? '...' : `${userCoins} coins`}
                        </span>
                    </div>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6 flex items-center space-x-3">
                        <FaCheckCircle className="text-green-400 text-xl" />
                        <span className="text-green-300">{success}</span>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center space-x-3">
                        <span className="text-red-400 text-xl">⚠️</span>
                        <span className="text-red-300">{error}</span>
                    </div>
                )}

                {/* Coin Packages */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {coinPackages.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`relative bg-slate-800/50 rounded-3xl p-6 backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${pkg.popular
                                    ? 'border-green-500/50 ring-2 ring-green-500/20'
                                    : 'border-slate-700/50 hover:border-purple-500/50'
                                }`}
                        >
                            {pkg.popular && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-6">
                                <div className="text-4xl mb-3">{pkg.icon}</div>
                                <h3 className="text-2xl font-bold mb-2 capitalize">{pkg.id}</h3>
                                <div className="text-4xl font-black text-yellow-400 mb-1">
                                    {pkg.coins + pkg.bonus}
                                </div>
                                <div className="text-sm text-gray-400 mb-2">
                                    {pkg.coins} + {pkg.bonus} bonus coins
                                </div>
                                <div className="text-3xl font-bold text-white">
                                    ${pkg.price}
                                </div>
                            </div>

                            <ul className="space-y-2 mb-6 text-sm text-gray-300">
                                {pkg.features.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <span className="text-green-400 mr-2">✓</span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            {/* Payment Method Selector */}
                            <div className="mb-4">
                                <div className="flex bg-gray-700 rounded-lg p-1">
                                    <button
                                        onClick={() => setPaymentMethod('razorpay')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                            paymentMethod === 'razorpay'
                                                ? 'bg-purple-600 text-white'
                                                : 'text-gray-300 hover:text-white'
                                        }`}
                                    >
                                        💳 Razorpay
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('qr')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                                            paymentMethod === 'qr'
                                                ? 'bg-green-600 text-white'
                                                : 'text-gray-300 hover:text-white'
                                        }`}
                                    >
                                        <FaQrcode className="inline mr-1" />
                                        QR Code
                                    </button>
                                </div>
                            </div>

                            {/* Payment Component */}
                            {paymentMethod === 'razorpay' ? (
                                <RazorpayPayment
                                    amount={pkg.price}
                                    description={`${pkg.coins + pkg.bonus} Coins Package`}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                    metadata={{
                                        packageId: pkg.id,
                                        coins: pkg.coins + pkg.bonus,
                                        type: 'coins'
                                    }}
                                />
                            ) : (
                                <QRCodePayment
                                    amount={pkg.price}
                                    description={`${pkg.coins + pkg.bonus} Coins Package`}
                                    onSuccess={handlePaymentSuccess}
                                    onError={handlePaymentError}
                                    metadata={{
                                        packageId: pkg.id,
                                        coins: pkg.coins + pkg.bonus,
                                        type: 'coins'
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Features Section */}
                <div className="bg-slate-800/30 rounded-3xl p-8 mb-12">
                    <h2 className="text-3xl font-bold text-center mb-8">Why Purchase Coins?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaGift className="text-blue-400 text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Support Creators</h3>
                            <p className="text-gray-300">
                                Directly support your favorite manga creators and help them continue creating amazing content.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaCrown className="text-purple-400 text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Show Appreciation</h3>
                            <p className="text-gray-300">
                                Let creators know you love their work by tipping them with coins. It means the world to them!
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FaRocket className="text-green-400 text-2xl" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Build Community</h3>
                            <p className="text-gray-300">
                                Help build a thriving manga community where creators are rewarded for their amazing work.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Security Notice */}
                <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 rounded-3xl p-6 text-center border border-blue-500/20">
                    <h3 className="text-xl font-bold mb-3">🔒 Secure Payment</h3>
                    <p className="text-gray-300">
                        All payments are processed securely through Stripe. We never store your payment information.
                        Your transaction is protected by industry-standard encryption.
                    </p>
                </div>
            </div>
        </div>
    );
}
