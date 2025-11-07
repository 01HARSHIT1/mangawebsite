import { Suspense } from 'react';
import DashboardLayout from '@/components/creator/DashboardLayout';

export const dynamic = 'force-dynamic';

export default function MonetizationPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Monetization Settings</h1>
                    <p className="text-gray-400">Configure pricing, subscriptions, and premium content</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                        <div className="text-4xl mb-4">💰</div>
                        <h3 className="text-lg font-bold text-white mb-2">Chapter Pricing</h3>
                        <p className="text-sm text-gray-400 mb-4">Set prices for premium chapters</p>
                        <p className="text-xs text-gray-500">Coming soon...</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                        <div className="text-4xl mb-4">👥</div>
                        <h3 className="text-lg font-bold text-white mb-2">Subscriptions</h3>
                        <p className="text-sm text-gray-400 mb-4">Offer monthly memberships</p>
                        <p className="text-xs text-gray-500">Coming soon...</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                        <div className="text-4xl mb-4">⏰</div>
                        <h3 className="text-lg font-bold text-white mb-2">Timed Release</h3>
                        <p className="text-sm text-gray-400 mb-4">Schedule chapter releases</p>
                        <p className="text-xs text-gray-500">Coming soon...</p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

