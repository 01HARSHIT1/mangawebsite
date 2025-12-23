'use client';

import { useState, useEffect } from 'react';
import AnimeDashboardLayout from '@/components/anime/creator/AnimeDashboardLayout';

export default function AnalyticsPage() {
    return (
        <AnimeDashboardLayout>
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
                <p className="text-orange-400">View detailed analytics for your anime content.</p>
                <div className="bg-gray-900/50 rounded-2xl p-8 border border-orange-500/20">
                    <p className="text-gray-400">Analytics dashboard coming soon...</p>
                </div>
            </div>
        </AnimeDashboardLayout>
    );
}

