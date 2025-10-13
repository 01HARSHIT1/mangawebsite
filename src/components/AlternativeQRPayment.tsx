'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaQrcode, FaExternalLinkAlt, FaCopy } from 'react-icons/fa';
import QRCode from 'qrcode';

interface AlternativeQRPaymentProps {
    amount: number; // Amount in USD
    description: string;
    onSuccess: (paymentId: string) => void;
    onError: (errorMessage: string) => void;
    metadata?: Record<string, any>;
}

// USD to INR conversion rate
const USD_TO_INR_RATE = 83;

export default function AlternativeQRPayment({ amount, description, onSuccess, onError, metadata }: AlternativeQRPaymentProps) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const [paymentUrl, setPaymentUrl] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Convert USD to INR
    const amountInINR = Math.round(amount * USD_TO_INR_RATE * 100) / 100;

    const generateAlternativeQR = async () => {
        if (!user) {
            onError('Please login to make a payment');
            return;
        }

        setLoading(true);

        try {
            // Create a payment URL that opens Razorpay checkout
            const paymentUrl = `${window.location.origin}/coins?amount=${amountInINR}&description=${encodeURIComponent(description)}&autoOpen=true`;
            setPaymentUrl(paymentUrl);

            // Generate QR code for the payment URL
            const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            setQrCodeDataUrl(qrCodeDataUrl);

        } catch (error) {
            console.error('Alternative QR generation error:', error);
            onError('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const copyPaymentUrl = () => {
        navigator.clipboard.writeText(paymentUrl);
        // You could add a toast notification here
    };

    const openPaymentPage = () => {
        window.open(paymentUrl, '_blank');
    };

    return (
        <div className="w-full">
            {!qrCodeDataUrl && (
                <button
                    onClick={generateAlternativeQR}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                    <FaQrcode className="text-xl" />
                    <span>Generate Payment QR - ₹{amountInINR.toFixed(2)} (${amount.toFixed(2)})</span>
                </button>
            )}

            {loading && (
                <div className="w-full bg-blue-500/20 border border-blue-500/50 rounded-lg p-6 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
                    <p className="text-blue-300">Generating Payment QR Code...</p>
                </div>
            )}

            {qrCodeDataUrl && (
                <div className="w-full bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Scan QR Code to Pay</h3>
                        <p className="text-gray-300 mb-4">Amount: ₹{amountInINR.toFixed(2)} ({description})</p>
                        <p className="text-yellow-300 text-sm mb-4">
                            <strong>Note:</strong> This QR code will open Razorpay checkout in a new tab
                        </p>
                    </div>

                    <div className="flex justify-center mb-4">
                        <img 
                            src={qrCodeDataUrl} 
                            alt="Payment QR Code" 
                            className="w-64 h-64 border border-gray-600 rounded-lg"
                        />
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={openPaymentPage}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            <FaExternalLinkAlt />
                            <span>Open Payment Page</span>
                        </button>

                        <button
                            onClick={copyPaymentUrl}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            <FaCopy />
                            <span>Copy Payment Link</span>
                        </button>
                    </div>

                    <div className="text-center text-sm text-gray-400 mt-4">
                        <p>Scan with any QR code scanner or click "Open Payment Page"</p>
                    </div>
                </div>
            )}
        </div>
    );
}
