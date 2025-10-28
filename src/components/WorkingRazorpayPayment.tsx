'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaCreditCard, FaSpinner, FaCheckCircle, FaTimes } from 'react-icons/fa';

interface WorkingRazorpayPaymentProps {
    amount: number; // Amount in USD
    description: string;
    onSuccess: (paymentId: string) => void;
    onError: (error: string) => void;
    metadata?: Record<string, any>;
}

// USD to INR conversion rate
const USD_TO_INR_RATE = 83;

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function WorkingRazorpayPayment({
    amount,
    description,
    onSuccess,
    onError,
    metadata = {}
}: WorkingRazorpayPaymentProps) {
    const [loading, setLoading] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const { user } = useAuth();

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!user) {
            onError('Please login to make a payment');
            return;
        }

        if (paymentSuccess) {
            onSuccess('completed');
            return;
        }

        setLoading(true);

        try {
            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                onError('Failed to load Razorpay script');
                setLoading(false);
                return;
            }

            // Convert USD to INR
            const amountInINR = Math.round(amount * USD_TO_INR_RATE * 100) / 100;

            // Create order
            const orderResponse = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    amount: amountInINR,
                    currency: 'INR',
                    description,
                    metadata: {
                        ...metadata,
                        originalAmountUSD: amount
                    }
                })
            });

            const orderData = await orderResponse.json();

            if (!orderData.success) {
                throw new Error(orderData.error || orderData.details || 'Failed to create order');
            }

            // Initialize Razorpay payment
            const options = {
                key: orderData.key, // Use key from response
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'MangaReader',
                description: description,
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    console.log('✅ Payment successful:', response);

                    // Verify payment
                    try {
                        const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            setPaymentSuccess(true);
                            setLoading(false);
                            onSuccess(response.razorpay_payment_id);
                        } else {
                            onError(verifyData.error || 'Payment verification failed');
                            setLoading(false);
                        }
                    } catch (verifyError) {
                        console.error('Payment verification error:', verifyError);
                        onError('Payment verification failed');
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user.username || 'User',
                    email: user.email,
                    contact: ''
                },
                theme: {
                    color: '#6366f1'
                },
                // Configure payment methods for Indian market
                config: {
                    display: {
                        blocks: {
                            banks: {
                                name: "All payment methods",
                                instruments: [
                                    {
                                        method: "card"
                                    },
                                    {
                                        method: "upi"
                                    },
                                    {
                                        method: "wallet",
                                        wallets: ["paytm"]
                                    },
                                    {
                                        method: "netbanking"
                                    }
                                ]
                            }
                        },
                        sequence: ["block.banks"],
                        preferences: {
                            show_default_blocks: false
                        }
                    }
                },
                // Enable Indian card support in production
                method: {
                    card: {
                        name: "Cards",
                        description: "Pay using Credit or Debit cards"
                    },
                    upi: {
                        name: "UPI",
                        description: "Pay using any UPI app"
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                console.error('❌ Payment failed:', response.error);
                onError(response.error.description || 'Payment failed');
                setLoading(false);
            });

            razorpay.open();
            setLoading(false);

        } catch (error) {
            console.error('❌ Payment error:', error);
            onError(error instanceof Error ? error.message : 'Payment failed');
            setLoading(false);
        }
    };

    if (paymentSuccess) {
        return (
            <div className="w-full bg-green-500/20 border border-green-500/50 rounded-lg p-6 text-center">
                <FaCheckCircle className="text-green-400 text-3xl mx-auto mb-3" />
                <p className="text-green-300 text-lg font-semibold">Payment Successful!</p>
                <p className="text-green-200 text-sm mt-2">Coins have been added to your account</p>
            </div>
        );
    }

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
            {loading ? (
                <>
                    <FaSpinner className="animate-spin text-xl" />
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <FaCreditCard className="text-xl" />
                    <span>Pay ₹{Math.round(amount * USD_TO_INR_RATE * 100) / 100} (${amount.toFixed(2)}) via Razorpay</span>
                </>
            )}
        </button>
    );
}
