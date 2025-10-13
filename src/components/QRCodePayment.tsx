'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaSpinner, FaQrcode, FaCheckCircle, FaTimes, FaClock } from 'react-icons/fa';

interface QRCodePaymentProps {
    amount: number; // Amount in USD
    description: string;
    onSuccess: (paymentId: string) => void;
    onError: (errorMessage: string) => void;
    metadata?: Record<string, any>;
}

// USD to INR conversion rate
const USD_TO_INR_RATE = 83;

export default function QRCodePayment({ amount, description, onSuccess, onError, metadata }: QRCodePaymentProps) {
    const [loading, setLoading] = useState(false);
    const [qrCode, setQrCode] = useState<any>(null);
    const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'success' | 'expired' | 'error'>('idle');
    const [timeLeft, setTimeLeft] = useState(0);
    const { user } = useAuth();

    // Convert USD to INR
    const amountInINR = Math.round(amount * USD_TO_INR_RATE * 100) / 100;

    // Timer for QR code expiration
    useEffect(() => {
        if (qrCode && qrCode.expiresAt) {
            const interval = setInterval(() => {
                const now = Math.floor(Date.now() / 1000);
                const timeLeft = qrCode.expiresAt - now;
                setTimeLeft(timeLeft);

                if (timeLeft <= 0) {
                    setStatus('expired');
                    clearInterval(interval);
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [qrCode]);

    // Poll for payment status
    useEffect(() => {
        if (qrCode && status === 'waiting') {
            const interval = setInterval(async () => {
                try {
                    const response = await fetch(`/api/razorpay/qr-status?qrCodeId=${qrCode.qrCodeId}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                        }
                    });

                    const data = await response.json();

                    if (data.success) {
                        if (data.status === 'paid') {
                            setStatus('success');
                            onSuccess(qrCode.qrCodeId);
                            clearInterval(interval);
                        } else if (data.status === 'expired') {
                            setStatus('expired');
                            clearInterval(interval);
                        }
                    }
                } catch (error) {
                    console.error('Error checking QR status:', error);
                }
            }, 3000); // Check every 3 seconds

            return () => clearInterval(interval);
        }
    }, [qrCode, status, onSuccess]);

    const generateQRCode = async () => {
        if (!user) {
            onError('Please login to make a payment');
            return;
        }

        setLoading(true);
        setStatus('generating');

        try {
            console.log('🔍 Creating QR code for amount:', amountInINR);

            const response = await fetch('/api/razorpay/create-qr', {
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
                        originalAmountUSD: amount,
                        conversionRate: USD_TO_INR_RATE
                    }
                })
            });

            const data = await response.json();
            console.log('🔍 QR code response:', data);

            if (data.success) {
                setQrCode(data);
                setStatus('waiting');
                setTimeLeft(data.expiresAt - Math.floor(Date.now() / 1000));
            } else {
                throw new Error(data.details || data.error || 'Failed to create QR code');
            }

        } catch (error) {
            console.error('QR code generation error:', error);
            onError(error instanceof Error ? error.message : 'Failed to generate QR code');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const resetQR = () => {
        setQrCode(null);
        setStatus('idle');
        setTimeLeft(0);
    };

    return (
        <div className="w-full">
            {status === 'idle' && (
                <button
                    onClick={generateQRCode}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                    <FaQrcode className="text-xl" />
                    <span>Generate QR Code - ₹{amountInINR.toFixed(2)} (${amount.toFixed(2)})</span>
                </button>
            )}

            {status === 'generating' && (
                <div className="w-full bg-blue-500/20 border border-blue-500/50 rounded-lg p-6 text-center">
                    <FaSpinner className="animate-spin text-blue-400 text-2xl mx-auto mb-3" />
                    <p className="text-blue-300">Generating QR Code...</p>
                </div>
            )}

            {status === 'waiting' && qrCode && (
                <div className="w-full bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Scan QR Code to Pay</h3>
                        <p className="text-gray-300 mb-4">Amount: ₹{amountInINR.toFixed(2)} ({description})</p>
                        
                        {timeLeft > 0 && (
                            <div className="flex items-center justify-center space-x-2 text-yellow-400 mb-4">
                                <FaClock />
                                <span>Expires in: {formatTime(timeLeft)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center mb-4">
                        <img 
                            src={qrCode.imageUrl} 
                            alt="Payment QR Code" 
                            className="w-64 h-64 border border-gray-600 rounded-lg"
                        />
                    </div>

                    <div className="text-center text-sm text-gray-400">
                        <p>Scan with any UPI app (Google Pay, PhonePe, Paytm, etc.)</p>
                        <p className="mt-1">Waiting for payment...</p>
                    </div>

                    <button
                        onClick={resetQR}
                        className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                        Cancel & Generate New QR
                    </button>
                </div>
            )}

            {status === 'success' && (
                <div className="w-full bg-green-500/20 border border-green-500/50 rounded-lg p-6 text-center">
                    <FaCheckCircle className="text-green-400 text-3xl mx-auto mb-3" />
                    <p className="text-green-300 text-lg font-semibold">Payment Successful!</p>
                    <p className="text-green-200 text-sm mt-2">Coins have been added to your account</p>
                </div>
            )}

            {status === 'expired' && (
                <div className="w-full bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
                    <FaTimes className="text-red-400 text-3xl mx-auto mb-3" />
                    <p className="text-red-300 text-lg font-semibold">QR Code Expired</p>
                    <p className="text-red-200 text-sm mt-2">Please generate a new QR code</p>
                    <button
                        onClick={resetQR}
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                        Generate New QR Code
                    </button>
                </div>
            )}

            {status === 'error' && (
                <div className="w-full bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
                    <FaTimes className="text-red-400 text-3xl mx-auto mb-3" />
                    <p className="text-red-300 text-lg font-semibold">Error Generating QR Code</p>
                    <button
                        onClick={resetQR}
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
