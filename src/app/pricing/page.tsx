"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaCoins, FaGift, FaCrown, FaRocket, FaCheck, FaStar, FaHeart } from 'react-icons/fa';

interface PricingTier {
    id: string;
    name: string;
    coins: number;
    price: number;
    bonus: number;
    popular?: boolean;
    icon: React.ReactNode;
    color: string;
    features: string[];
    description: string;
}

const pricingTiers: PricingTier[] = [
    {
        id: 'starter',
        name: 'Starter Pack',
        coins: 100,
        price: 0.99,
        bonus: 0,
        icon: <FaCoins />,
        color: 'from-yellow-500 to-orange-500',
        description: 'Perfect for new users who want to try out tipping creators',
        features: [
            '100 coins to start with',
            'Tip your favorite creators',
            'Show appreciation for great manga',
            'Support the community',
            'No expiration date'
        ]
    },
    {
        id: 'popular',
        name: 'Popular Choice',
        coins: 500,
        price: 4.99,
        bonus: 50,
        popular: true,
        icon: <FaGift />,
        color: 'from-green-500 to-emerald-500',
        description: 'Most popular option with bonus coins - great value for regular readers',
        features: [
            '500 base coins',
            '50 bonus coins (10% extra)',
            'Support multiple creators',
            'Perfect for regular readers',
            'Great value for money',
            'Priority customer support'
        ]
    },
    {
        id: 'premium',
        name: 'Premium Pack',
        coins: 1000,
        price: 9.99,
        bonus: 200,
        icon: <FaCrown />,
        color: 'from-purple-500 to-pink-500',
        description: 'Best value pack with substantial bonus coins for dedicated manga fans',
        features: [
            '1,000 base coins',
            '200 bonus coins (20% extra)',
            'Premium supporter badge',
            'Early access to new features',
            'VIP customer support',
            'Maximum creator impact'
        ]
    },
    {
        id: 'ultimate',
        name: 'Ultimate Pack',
        coins: 2500,
        price: 19.99,
        bonus: 750,
        icon: <FaRocket />,
        color: 'from-pink-500 to-red-500',
        description: 'Ultimate package for super fans who want maximum impact',
        features: [
            '2,500 base coins',
            '750 bonus coins (30% extra)',
            'Ultimate supporter status',
            'Exclusive community access',
            'Direct creator messaging',
            'Custom profile badges',
            'Priority feature requests'
        ]
    }
];

const faqs = [
    {
        question: "What are coins used for?",
        answer: "Coins are used to tip manga creators, showing appreciation for their work and providing them with financial support to continue creating amazing content."
    },
    {
        question: "Do coins expire?",
        answer: "No, coins never expire! Once you purchase them, they remain in your account indefinitely until you choose to use them."
    },
    {
        question: "Can I get a refund?",
        answer: "Due to the digital nature of coins, refunds are generally not available once the purchase is complete. However, we'll review special cases on an individual basis."
    },
    {
        question: "How do creators receive tips?",
        answer: "When you tip a creator, the coins are instantly added to their account. Creators can then convert their coins to real money through our payout system."
    },
    {
        question: "Is my payment information secure?",
        answer: "Yes! All payments are processed through Stripe, a leading payment processor with bank-level security. We never store your payment information."
    }
];

export default function PricingPage() {
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    const handlePurchase = (tierId: string) => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        router.push('/coins');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full mb-6">
                        <FaCoins className="text-3xl text-white" />
                    </div>
                    <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                        Coin Pricing
                    </h1>
                    <p className="text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
                        Support your favorite manga creators with our coin packages.
                        Choose the perfect package for your reading habits and show appreciation for amazing content.
                    </p>
                    <div className="inline-flex items-center bg-gradient-to-r from-green-600/20 to-emerald-600/20 rounded-full px-6 py-3 border border-green-500/30">
                        <FaStar className="text-yellow-400 mr-2" />
                        <span className="text-lg font-semibold">All packages include bonus coins!</span>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    {pricingTiers.map((tier) => (
                        <div
                            key={tier.id}
                            className={`relative bg-slate-800/50 rounded-3xl p-8 backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${tier.popular
                                    ? 'border-green-500/50 ring-2 ring-green-500/20 scale-105'
                                    : 'border-slate-700/50 hover:border-purple-500/50'
                                }`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center">
                                        <FaStar className="mr-1" />
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="text-center mb-8">
                                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${tier.color} rounded-full mb-4`}>
                                    <span className="text-2xl text-white">{tier.icon}</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{tier.description}</p>

                                <div className="mb-4">
                                    <div className="text-5xl font-black text-yellow-400 mb-2">
                                        {tier.coins + tier.bonus}
                                    </div>
                                    <div className="text-sm text-gray-400 mb-1">
                                        {tier.coins} + {tier.bonus} bonus
                                    </div>
                                    {tier.bonus > 0 && (
                                        <div className="text-green-400 text-sm font-semibold">
                                            {Math.round((tier.bonus / tier.coins) * 100)}% bonus!
                                        </div>
                                    )}
                                </div>

                                <div className="text-4xl font-bold text-white mb-6">
                                    ${tier.price}
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {tier.features.map((feature, index) => (
                                    <li key={index} className="flex items-start text-sm text-gray-300">
                                        <FaCheck className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handlePurchase(tier.id)}
                                className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${tier.popular
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25'
                                        : `bg-gradient-to-r ${tier.color} hover:opacity-90 text-white shadow-lg`
                                    }`}
                            >
                                {isAuthenticated ? 'Purchase Now' : 'Sign In to Purchase'}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Benefits Section */}
                <div className="bg-slate-800/30 rounded-3xl p-12 mb-16">
                    <h2 className="text-4xl font-bold text-center mb-12">Why Purchase Coins?</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaHeart className="text-blue-400 text-3xl" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Support Creators</h3>
                            <p className="text-gray-300 leading-relaxed">
                                Directly support talented manga creators and help them continue producing the content you love.
                                Every coin you spend goes straight to the creators.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaCrown className="text-purple-400 text-3xl" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Show Appreciation</h3>
                            <p className="text-gray-300 leading-relaxed">
                                Let creators know their hard work is valued. Tips with coins are a meaningful way to show
                                appreciation for exceptional manga chapters and series.
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaRocket className="text-green-400 text-3xl" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Build Community</h3>
                            <p className="text-gray-300 leading-relaxed">
                                Help foster a thriving manga community where creators are rewarded for quality content.
                                Your support encourages more amazing manga creation.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-slate-800/50 rounded-3xl p-8 backdrop-blur-sm">
                    <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-slate-700/50 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                                    className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-600/50 transition-colors"
                                >
                                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                                    <span className="text-2xl text-purple-400">
                                        {expandedFaq === index ? '−' : '+'}
                                    </span>
                                </button>
                                {expandedFaq === index && (
                                    <div className="px-6 pb-4">
                                        <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center mt-16">
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-3xl p-8 border border-purple-500/20">
                        <h2 className="text-3xl font-bold mb-4">Ready to Support Creators?</h2>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                            Join thousands of readers who are already supporting their favorite manga creators.
                            Every coin makes a difference!
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <button
                                onClick={() => handlePurchase('popular')}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
                            >
                                Get Started with 550 Coins
                            </button>
                            <button
                                onClick={() => router.push('/about')}
                                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-8 rounded-xl transition-colors duration-300"
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
