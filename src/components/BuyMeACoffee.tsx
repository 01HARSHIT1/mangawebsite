'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCoffee, FaHeart, FaTimes } from 'react-icons/fa';
import RazorpayPayment from './RazorpayPayment';

export default function BuyMeACoffee() {
    const [showModal, setShowModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [showPayment, setShowPayment] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const quickAmounts = [10, 50, 100, 500];

    const handleQuickAmount = (value: number) => {
        setAmount(value.toString());
    };

    const handleContinue = () => {
        const amountNum = parseFloat(amount);
        
        if (!amount || isNaN(amountNum) || amountNum < 1) {
            setError('Please enter an amount of at least ₹1');
            return;
        }

        if (amountNum > 100000) {
            setError('Maximum amount is ₹1,00,000');
            return;
        }

        setError('');
        setShowPayment(true);
    };

    const handlePaymentSuccess = async (paymentId: string) => {
        try {
            // Record the donation
            const response = await fetch('/api/donations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    message: customMessage,
                    paymentId
                })
            });

            if (response.ok) {
                setSuccess('Thank you for your support! ❤️');
                setAmount('');
                setCustomMessage('');
                setShowPayment(false);
                
                // Show success and close modal after 3 seconds
                setTimeout(() => {
                    setShowModal(false);
                    setSuccess('');
                }, 3000);
            }
        } catch (err) {
            console.error('Error recording donation:', err);
            setSuccess('Payment successful! Thank you for your support! ❤️');
            setTimeout(() => {
                setShowModal(false);
                setSuccess('');
            }, 3000);
        }
    };

    const handlePaymentError = (error: string) => {
        setError(error);
        setShowPayment(false);
    };

    return (
        <>
            {/* Buy Me a Coffee Button - Floating */}
            <motion.button
                onClick={() => setShowModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative group"
            >
                <div className="relative bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 flex items-center space-x-3 overflow-hidden">
                    {/* Animated background glow */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-400 opacity-0 group-hover:opacity-30 transition-opacity blur-xl"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    {/* Steam animation */}
                    <div className="relative">
                        <motion.div
                            animate={{ 
                                y: [0, -10, 0],
                                opacity: [0.5, 1, 0.5],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                            className="absolute -top-3 left-1 text-white/30 text-xs"
                        >
                            ☁
                        </motion.div>
                        <motion.div
                            animate={{ 
                                y: [0, -12, 0],
                                opacity: [0.4, 0.8, 0.4],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 2.5, repeat: Infinity, delay: 0.3 }}
                            className="absolute -top-4 left-3 text-white/20 text-xs"
                        >
                            ☁
                        </motion.div>
                        <motion.div
                            animate={{ 
                                rotate: [0, 5, -5, 0],
                                scale: [1, 1.05, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            <FaCoffee className="text-2xl relative z-10" />
                        </motion.div>
                    </div>
                    
                    <span className="relative z-10">Buy Me a Coffee</span>
                    
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="relative z-10"
                    >
                        <FaHeart className="text-red-200" />
                    </motion.div>
                </div>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => {
                            setShowModal(false);
                            setShowPayment(false);
                            setError('');
                            setSuccess('');
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-700/50 relative overflow-hidden"
                        >
                            {/* Decorative background elements */}
                            <div className="absolute inset-0 opacity-10">
                                <motion.div
                                    animate={{ 
                                        scale: [1, 1.2, 1],
                                        rotate: [0, 90, 0]
                                    }}
                                    transition={{ duration: 20, repeat: Infinity }}
                                    className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-3xl"
                                />
                                <motion.div
                                    animate={{ 
                                        scale: [1.2, 1, 1.2],
                                        rotate: [0, -90, 0]
                                    }}
                                    transition={{ duration: 15, repeat: Infinity }}
                                    className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-500 to-red-500 rounded-full blur-3xl"
                                />
                            </div>

                            {/* Close button */}
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setShowPayment(false);
                                    setError('');
                                    setSuccess('');
                                }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
                            >
                                <FaTimes className="text-2xl" />
                            </button>

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <motion.div
                                        animate={{ 
                                            rotate: [0, 5, -5, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                        className="inline-block text-6xl mb-4"
                                    >
                                        ☕
                                    </motion.div>
                                    <h2 className="text-3xl font-bold mb-2">
                                        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                                            Buy Me a Coffee
                                        </span>
                                    </h2>
                                    <p className="text-gray-400 text-lg">
                                        Support our manga platform! Every rupee helps us grow. 💖
                                    </p>
                                </div>

                                {success ? (
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-center py-8"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{ duration: 1, repeat: Infinity }}
                                            className="text-6xl mb-4"
                                        >
                                            🎉
                                        </motion.div>
                                        <p className="text-green-400 text-xl font-semibold">{success}</p>
                                    </motion.div>
                                ) : showPayment ? (
                                    <div className="space-y-6">
                                        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-gray-400">Amount:</span>
                                                <span className="text-2xl font-bold text-amber-400">₹{amount}</span>
                                            </div>
                                            {customMessage && (
                                                <div className="mt-4 pt-4 border-t border-slate-700/50">
                                                    <p className="text-sm text-gray-400 mb-1">Your message:</p>
                                                    <p className="text-white italic">"{customMessage}"</p>
                                                </div>
                                            )}
                                        </div>

                                        <RazorpayPayment
                                            amount={parseFloat(amount) / 83} // Convert INR to USD for the component
                                            description={`Coffee donation - ${customMessage || 'Thank you for your support!'}`}
                                            onSuccess={handlePaymentSuccess}
                                            onError={handlePaymentError}
                                            metadata={{
                                                type: 'donation',
                                                message: customMessage,
                                                amountINR: parseFloat(amount)
                                            }}
                                        />

                                        <button
                                            onClick={() => setShowPayment(false)}
                                            className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
                                        >
                                            Back
                                        </button>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400"
                                            >
                                                {error}
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Quick amounts */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-400 mb-3">
                                                Quick Select:
                                            </label>
                                            <div className="grid grid-cols-4 gap-3">
                                                {quickAmounts.map((value) => (
                                                    <motion.button
                                                        key={value}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => handleQuickAmount(value)}
                                                        className={`py-3 rounded-xl font-bold transition-all ${
                                                            amount === value.toString()
                                                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                                                                : 'bg-slate-800/50 hover:bg-slate-700/50 text-gray-300 border border-slate-700/50'
                                                        }`}
                                                    >
                                                        ₹{value}
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Custom amount */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-400 mb-3">
                                                Or Enter Your Amount (₹1 - ₹1,00,000):
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-amber-400">
                                                    ₹
                                                </span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100000"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="Enter amount"
                                                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-4 text-white text-lg focus:outline-none focus:border-amber-500/50 focus:bg-slate-800/70 transition-all"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Minimum: ₹1 • Maximum: ₹1,00,000
                                            </p>
                                        </div>

                                        {/* Optional message */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-400 mb-3">
                                                Leave a Message (Optional):
                                            </label>
                                            <textarea
                                                value={customMessage}
                                                onChange={(e) => setCustomMessage(e.target.value)}
                                                placeholder="Say something nice... (optional)"
                                                maxLength={200}
                                                rows={3}
                                                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500/50 focus:bg-slate-800/70 transition-all"
                                            />
                                            <p className="text-xs text-gray-500 mt-1 text-right">
                                                {customMessage.length}/200
                                            </p>
                                        </div>

                                        {/* Continue button */}
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={handleContinue}
                                            disabled={!amount}
                                            className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
                                        >
                                            <FaHeart />
                                            <span>Continue to Payment</span>
                                        </motion.button>

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-center"
                                            >
                                                {error}
                                            </motion.div>
                                        )}

                                        {/* Info */}
                                        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 text-center">
                                            <p className="text-gray-400 text-sm">
                                                🔒 Secure payment powered by <span className="text-purple-400 font-semibold">Razorpay</span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

