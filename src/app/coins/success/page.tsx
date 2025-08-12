"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';

export const dynamic = 'force-dynamic';

export default function CoinSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">Loading...</div>}>
            <CoinSuccessClient />
        </Suspense>
    );
}

function CoinSuccessClient() {
    const [coins, setCoins] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const params = useSearchParams();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        fetch("/api/coins", {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => {
                setCoins(data.coins || 0);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });
    }, [user, router]);

    const amount = params.get("amount");

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-green-400 mb-4">Payment Successful!</h1>
                    <p className="text-gray-300 mb-8">
                        Thank you for your purchase. Your coins have been added to your account.
                    </p>

                    {loading ? (
                        <div className="text-gray-400">Loading...</div>
                    ) : (
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <div className="text-center mb-4">
                                <div className="text-2xl font-bold text-yellow-400">{amount} Coins</div>
                                <div className="text-sm text-gray-400">Purchased</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-semibold text-white">New Balance</div>
                                <div className="text-3xl font-bold text-green-400">{coins} Coins</div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 space-y-4">
                        <button
                            onClick={() => router.push("/")}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            Continue Reading
                        </button>
                        <button
                            onClick={() => router.push("/profile")}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            View Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 