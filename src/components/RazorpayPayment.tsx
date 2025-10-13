'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface RazorpayPaymentProps {
    amount: number; // Amount in USD
    description: string;
    onSuccess: (paymentId: string) => void;
    onError: (error: string) => void;
    metadata?: Record<string, any>;
}

// USD to INR conversion rate (update this periodically or fetch from API)
const USD_TO_INR_RATE = 83; // Approximate rate: 1 USD = 83 INR

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function RazorpayPayment({
    amount,
    description,
    onSuccess,
    onError,
    metadata = {}
}: RazorpayPaymentProps) {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
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

        setLoading(true);

        try {
            // Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error('Failed to load Razorpay script');
            }

            // Convert USD to INR
            const amountInINR = Math.round(amount * USD_TO_INR_RATE * 100) / 100; // Round to 2 decimal places

            // Create order
            console.log('🔍 Sending payment request:', {
                amountUSD: amount,
                amountINR: amountInINR,
                conversionRate: USD_TO_INR_RATE,
                type: typeof amountInINR,
                currency: 'INR',
                description,
                metadata
            });

            const orderResponse = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    amount: amountInINR, // Send INR amount
                    currency: 'INR',
                    description,
                    metadata: {
                        ...metadata,
                        originalAmountUSD: amount,
                        conversionRate: USD_TO_INR_RATE
                    }
                })
            });

            const orderData = await orderResponse.json();
            console.log('🔍 Order creation response:', orderData);

            if (!orderData.success) {
                console.error('❌ Order creation failed:', orderData);
                
                // Build detailed error message
                let errorMessage = orderData.error || 'Failed to create order';
                if (orderData.details) {
                    errorMessage += ': ' + orderData.details;
                }
                if (orderData.hint) {
                    errorMessage += ' (' + orderData.hint + ')';
                }
                
                console.error('Full error:', errorMessage);
                throw new Error(errorMessage);
            }

            // Configure Razorpay options
            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'MangaReader',
                description: description,
                order_id: orderData.orderId,
                handler: async (response: any) => {
                    try {
                        // Verify payment
                        const verifyResponse = await fetch('/api/razorpay/verify-payment', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            },
                            body: JSON.stringify({
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            onSuccess(response.razorpay_payment_id);
                        } else {
                            onError(verifyData.error || 'Payment verification failed');
                        }
                    } catch (error) {
                        onError('Payment verification failed');
                    }
                },
                prefill: {
                    name: user.username || '',
                    email: user.email || '',
                },
                theme: {
                    color: '#8b5cf6'
                },
                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    }
                }
            };

            // Open Razorpay checkout
            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (error) {
            console.error('Payment error:', error);
            onError(error instanceof Error ? error.message : 'Payment failed');
            setLoading(false);
        }
    };

    // Calculate display amount in INR
    const displayAmountINR = Math.round(amount * USD_TO_INR_RATE * 100) / 100;

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
        >
            {loading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                </>
            ) : (
                <>
                    <span>Pay ₹{displayAmountINR.toFixed(2)} (${amount.toFixed(2)})</span>
                    <span>•</span>
                    <span>Razorpay</span>
                </>
            )}
        </button>
    );
}
