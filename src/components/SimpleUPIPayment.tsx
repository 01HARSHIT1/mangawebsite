'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaRupeeSign, FaQrcode, FaCopy, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import QRCode from 'qrcode';

interface SimpleUPIPaymentProps {
    amount: number; // Amount in USD
    description: string;
    onSuccess: (paymentId: string) => void;
    onError: (errorMessage: string) => void;
    metadata?: Record<string, any>;
}

// USD to INR conversion rate
const USD_TO_INR_RATE = 83;

// UPI Configuration
const UPI_CONFIG = {
    UPI_ID: 'harsshitrk0120@oksbi',
    BUSINESS_NAME: 'MangaReader',
};

export default function SimpleUPIPayment({ amount, description, onSuccess, onError, metadata }: SimpleUPIPaymentProps) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
    const [showQR, setShowQR] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [processing, setProcessing] = useState(false);
    const { user } = useAuth();

    // Convert USD to INR
    const amountInINR = Math.round(amount * USD_TO_INR_RATE * 100) / 100;

    // Generate UPI payment URL
    const generateUPIUrl = () => {
        const transactionId = `manga_${Date.now()}_${user?._id || 'guest'}`;
        const encodedDescription = encodeURIComponent(description);
        const encodedMerchantName = encodeURIComponent(UPI_CONFIG.BUSINESS_NAME);
        
        return `upi://pay?pa=${UPI_CONFIG.UPI_ID}&pn=${encodedMerchantName}&am=${amountInINR.toFixed(2)}&cu=INR&tn=${encodedDescription}&tr=${transactionId}&mode=02`;
    };

    const handleGenerateQR = async () => {
        if (!user) {
            onError('Please login to make a payment');
            return;
        }

        setProcessing(true);
        
        try {
            const upiUrl = generateUPIUrl();
            const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'M'
            });

            setQrCodeDataUrl(qrCodeDataUrl);
            setShowQR(true);
        } catch (error) {
            console.error('QR generation error:', error);
            onError('Failed to generate QR code');
        } finally {
            setProcessing(false);
        }
    };

    const copyUPIUrl = () => {
        const upiUrl = generateUPIUrl();
        navigator.clipboard.writeText(upiUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const copyUPIDetails = () => {
        const details = `Pay ₹${amountInINR.toFixed(2)} to ${UPI_CONFIG.UPI_ID} with note: ${description}`;
        navigator.clipboard.writeText(details);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="w-full">
            {!showQR ? (
                <button
                    onClick={handleGenerateQR}
                    disabled={processing}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                >
                    {processing ? (
                        <>
                            <FaSpinner className="animate-spin text-xl" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                            <FaQrcode className="text-xl" />
                            <span>Pay ₹{amountInINR.toFixed(2)} (${amount.toFixed(2)}) via UPI</span>
                        </>
                    )}
                </button>
            ) : (
                <div className="w-full bg-gray-800/50 border border-gray-600 rounded-lg p-6">
                    <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-white mb-2">Pay via UPI</h3>
                        <p className="text-gray-300 mb-2">Amount: ₹{amountInINR.toFixed(2)}</p>
                        <p className="text-gray-300 mb-4">{description}</p>
                        
                        {/* UPI ID Display */}
                        <div className="mb-4">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">
                                <FaRupeeSign className="mr-1" />
                                UPI ID: {UPI_CONFIG.UPI_ID}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center mb-4">
                        <img 
                            src={qrCodeDataUrl} 
                            alt="UPI Payment QR Code" 
                            className="w-64 h-64 border border-gray-600 rounded-lg"
                        />
                    </div>

                    <div className="text-center text-sm text-gray-400 mb-4">
                        <p className="mb-2">Scan with Google Pay, PhonePe, Paytm, or any UPI app</p>
                        <p className="text-green-300">After payment, contact us with transaction ID to receive coins</p>
                    </div>

                    <div className="space-y-2">
                        <button
                            onClick={copyUPIDetails}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                            <FaCopy />
                            <span>{copySuccess ? 'Copied!' : 'Copy UPI Details'}</span>
                        </button>
                    </div>

                    <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm">
                        <p className="font-semibold mb-2">📋 How to Complete Payment:</p>
                        <ol className="list-decimal list-inside space-y-1 text-left">
                            <li>Scan the QR code with your UPI app</li>
                            <li>Enter amount: ₹{amountInINR.toFixed(2)}</li>
                            <li>Add note: {description}</li>
                            <li>Complete the payment</li>
                            <li>Copy the transaction details and contact us for coin credit</li>
                        </ol>
                    </div>

                    <button
                        onClick={() => setShowQR(false)}
                        className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
}
