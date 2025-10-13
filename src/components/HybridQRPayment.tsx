'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaQrcode, FaSpinner, FaCheckCircle, FaTimes, FaClock, FaCopy, FaRocket } from 'react-icons/fa';
import QRCode from 'qrcode';
import { generateUPIPaymentUrl, UPI_CONFIG } from '@/lib/upi-config';

interface HybridQRPaymentProps {
    amount: number; // Amount in USD
    description: string;
    onSuccess: (paymentId: string) => void;
    onError: (errorMessage: string) => void;
    metadata?: Record<string, any>;
}

// USD to INR conversion rate
const USD_TO_INR_RATE = 83;

export default function HybridQRPayment({ amount, description, onSuccess, onError, metadata }: HybridQRPaymentProps) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const [upiPaymentUrl, setUpiPaymentUrl] = useState<string>('');
    const [status, setStatus] = useState<'idle' | 'generating' | 'waiting' | 'success' | 'expired' | 'error'>('idle');
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(false);
    const [qrType, setQrType] = useState<'razorpay' | 'personal' | null>(null);
    const { user } = useAuth();

    // Convert USD to INR
    const amountInINR = Math.round(amount * USD_TO_INR_RATE * 100) / 100;

    // Timer for QR code expiration
    useEffect(() => {
        if (status === 'waiting' && timeLeft > 0) {
            const interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setStatus('expired');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [status, timeLeft]);

    // Poll for payment status
    useEffect(() => {
        if (status === 'waiting' && upiPaymentUrl) {
            const interval = setInterval(async () => {
                try {
                    // Extract transaction ID from UPI URL
                    const urlParams = new URLSearchParams(upiPaymentUrl.split('?')[1]);
                    const transactionId = urlParams.get('tr');
                    
                    if (transactionId) {
                        const response = await fetch(`/api/upi/check-payment?transactionId=${transactionId}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            }
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                            setStatus('success');
                            onSuccess(data.payment.transactionId);
                            clearInterval(interval);
                        }
                    }
                } catch (error) {
                    console.error('Error checking payment status:', error);
                }
            }, 3000); // Check every 3 seconds

            return () => clearInterval(interval);
        }
    }, [status, upiPaymentUrl, onSuccess]);

    const generateHybridQR = async () => {
        if (!user) {
            onError('Please login to make a payment');
            return;
        }

        setLoading(true);
        setStatus('generating');

        try {
            // First, try Razorpay QR
            console.log('🔍 Trying Razorpay QR first...');
            
            const razorpayResponse = await fetch('/api/razorpay/create-qr', {
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

            const razorpayData = await razorpayResponse.json();

            if (razorpayData.success) {
                // Razorpay QR worked
                console.log('✅ Razorpay QR created successfully');
                setQrType('razorpay');
                setQrCodeDataUrl(razorpayData.imageUrl);
                setStatus('waiting');
                setTimeLeft(UPI_CONFIG.PAYMENT_TIMEOUT);
                return;
            }

            // Fallback to personal UPI ID
            console.log('⚠️ Razorpay QR failed, using personal UPI ID...');
            
            const transactionId = `manga_${Date.now()}_${user._id}`;
            const upiPaymentUrl = generateUPIPaymentUrl(amountInINR, description, transactionId);
            setUpiPaymentUrl(upiPaymentUrl);
            setQrType('personal');

            // Generate QR code for UPI payment
            const qrCodeDataUrl = await QRCode.toDataURL(upiPaymentUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            setQrCodeDataUrl(qrCodeDataUrl);
            setStatus('waiting');
            setTimeLeft(UPI_CONFIG.PAYMENT_TIMEOUT);

        } catch (error) {
            console.error('Hybrid QR generation error:', error);
            onError('Failed to generate QR code');
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    const copyUPIUrl = () => {
        if (upiPaymentUrl) {
            navigator.clipboard.writeText(upiPaymentUrl);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const resetQR = () => {
        setQrCodeDataUrl('');
        setUpiPaymentUrl('');
        setStatus('idle');
        setTimeLeft(0);
        setQrType(null);
    };

    return (
        <div className="w-full">
            {status === 'idle' && (
                <button
                    onClick={generateHybridQR}
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
                    <p className="text-blue-200 text-sm mt-2">Trying Razorpay first, then personal UPI...</p>
                </div>
            )}

            {status === 'waiting' && qrCodeDataUrl && (
                <div className="w-full bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Scan QR Code to Pay</h3>
                        <p className="text-gray-300 mb-2">Amount: ₹{amountInINR.toFixed(2)}</p>
                        <p className="text-gray-300 mb-4">{description}</p>
                        
                        {/* QR Type Indicator */}
                        <div className="mb-4">
                            {qrType === 'razorpay' ? (
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm">
                                    <FaRocket className="mr-1" />
                                    Razorpay QR
                                </div>
                            ) : (
                                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">
                                    <FaQrcode className="mr-1" />
                                    Direct UPI ({UPI_CONFIG.PERSONAL_UPI_ID})
                                </div>
                            )}
                        </div>
                        
                        {timeLeft > 0 && (
                            <div className="flex items-center justify-center space-x-2 text-yellow-400 mb-4">
                                <FaClock />
                                <span>Expires in: {formatTime(timeLeft)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center mb-4">
                        <img 
                            src={qrCodeDataUrl} 
                            alt="Payment QR Code" 
                            className="w-64 h-64 border border-gray-600 rounded-lg"
                        />
                    </div>

                    <div className="text-center text-sm text-gray-400 mb-4">
                        <p>Scan with Google Pay, PhonePe, Paytm, or any UPI app</p>
                        <p className="mt-1">Payment will be processed automatically</p>
                    </div>

                    {qrType === 'personal' && upiPaymentUrl && (
                        <div className="space-y-2">
                            <button
                                onClick={copyUPIUrl}
                                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                                <FaCopy />
                                <span>Copy UPI Payment Link</span>
                            </button>
                        </div>
                    )}

                    <button
                        onClick={resetQR}
                        className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
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
