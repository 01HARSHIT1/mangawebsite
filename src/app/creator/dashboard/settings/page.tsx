import { Suspense } from 'react';
import DashboardLayout from '@/components/creator/DashboardLayout';

export const dynamic = 'force-dynamic';

export default function DashboardSettingsPage() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Dashboard Settings</h1>
                    <p className="text-gray-400">Configure your creator preferences</p>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700/50 text-center">
                    <div className="text-6xl mb-4">⚙️</div>
                    <h3 className="text-xl font-bold text-white mb-2">Creator Settings</h3>
                    <p className="text-gray-400 mb-6">Manage your creator profile, payout methods, and preferences</p>
                    <p className="text-sm text-gray-500">Feature coming soon...</p>
                </div>
            </div>
        </DashboardLayout>
    );
}

