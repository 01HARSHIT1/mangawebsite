'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Check, Crown, Zap, Star } from 'lucide-react';
import RazorpayPayment from '@/components/RazorpayPayment';

interface SubscriptionPlan {
    _id: string;
    name: string;
    displayName: string;
    price: number;
    priceINR: number;
    currency: string;
    interval: string;
    features: {
        adsAllowed: boolean;
        maxQuality: string;
        offlineDownloads: boolean;
        simultaneousStreams: number;
    };
    description: string;
}

export default function SubscriptionPage() {
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/anime/subscriptions/plans');
            if (response.ok) {
                const data = await response.json();
                setPlans(data.plans || []);
            }
        } catch (error) {
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (planId: string) => {
        if (!isAuthenticated) {
            router.push('/login?redirect=/anime/subscriptions');
            return;
        }

        if (planId === 'free') {
            // Free plan - no payment needed
            await activateFreePlan();
            return;
        }

        setSelectedPlan(planId);
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/anime/subscriptions/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ planId })
            });

            if (response.ok) {
                const data = await response.json();
                setOrderData(data);
                setShowPayment(true);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create order');
            }
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Failed to create order. Please try again.');
        }
    };

    const activateFreePlan = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/anime/subscriptions/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ planId: 'free' })
            });

            if (response.ok) {
                alert('Free plan activated!');
                router.push('/anime');
            }
        } catch (error) {
            console.error('Error activating free plan:', error);
        }
    };

    const handlePaymentSuccess = async (paymentId: string) => {
        // Payment success - subscription will be activated via webhook
        alert('Payment successful! Your subscription is being activated...');
        router.push('/anime');
    };

    const handlePaymentError = (error: string) => {
        alert(`Payment failed: ${error}`);
        setShowPayment(false);
        setOrderData(null);
    };

    const getCurrentPlan = () => {
        return user?.subscription?.planName || 'free';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-red-400 mb-4">Choose Your Plan</h1>
                    <p className="text-xl text-gray-400">Unlock unlimited anime streaming</p>
                    {isAuthenticated && (
                        <p className="mt-4 text-gray-300">
                            Current Plan: <span className="font-semibold text-red-400 capitalize">{getCurrentPlan()}</span>
                        </p>
                    )}
                </div>

                {showPayment && orderData && (
                    <div className="mb-8 bg-gray-900 rounded-lg p-6">
                        <h2 className="text-2xl font-bold mb-4">Complete Your Subscription</h2>
                        <RazorpayPayment
                            amount={orderData.plan.price}
                            description={`Anime ${orderData.plan.name} Subscription`}
                            onSuccess={handlePaymentSuccess}
                            onError={handlePaymentError}
                            metadata={{
                                orderId: orderData.order.id,
                                planId: orderData.plan.id,
                                type: 'anime_subscription',
                            }}
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => {
                        const isCurrentPlan = getCurrentPlan() === plan.name;
                        const isPopular = plan.name === 'premium';
                        
                        return (
                            <div
                                key={plan._id}
                                className={`relative bg-gray-900 rounded-lg p-8 ${
                                    isPopular ? 'ring-2 ring-red-500 scale-105' : ''
                                } ${isCurrentPlan ? 'opacity-75' : ''}`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                        Most Popular
                                    </div>
                                )}
                                
                                <div className="text-center mb-6">
                                    <div className="flex justify-center mb-4">
                                        {plan.name === 'free' && <Zap className="w-12 h-12 text-yellow-400" />}
                                        {plan.name === 'premium' && <Star className="w-12 h-12 text-red-400" />}
                                        {plan.name === 'premium_plus' && <Crown className="w-12 h-12 text-purple-400" />}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">{plan.displayName}</h3>
                                    <div className="mb-4">
                                        <span className="text-4xl font-bold">${plan.price}</span>
                                        <span className="text-gray-400">/month</span>
                                    </div>
                                    <p className="text-gray-400 text-sm">{plan.description}</p>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center space-x-2">
                                        <Check className="w-5 h-5 text-green-400" />
                                        <span>Max Quality: {plan.features.maxQuality}</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <Check className={`w-5 h-5 ${plan.features.adsAllowed ? 'text-yellow-400' : 'text-green-400'}`} />
                                        <span>{plan.features.adsAllowed ? 'With Ads' : 'Ad-Free'}</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <Check className={`w-5 h-5 ${plan.features.offlineDownloads ? 'text-green-400' : 'text-gray-500'}`} />
                                        <span>{plan.features.offlineDownloads ? 'Offline Downloads' : 'No Offline Downloads'}</span>
                                    </li>
                                    <li className="flex items-center space-x-2">
                                        <Check className="w-5 h-5 text-green-400" />
                                        <span>{plan.features.simultaneousStreams} Device{plan.features.simultaneousStreams > 1 ? 's' : ''}</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => handleSubscribe(plan.name)}
                                    disabled={isCurrentPlan}
                                    className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                                        isCurrentPlan
                                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                            : isPopular
                                            ? 'bg-red-600 hover:bg-red-700 text-white'
                                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                                    }`}
                                >
                                    {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

