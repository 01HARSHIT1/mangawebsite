'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

export default function LoginPage() {
    const [showRegister, setShowRegister] = useState(false);
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // If admin, redirect to admin dashboard
            if (user?.role === 'admin') {
                router.push('/admin/dashboard');
            } else {
                router.push('/');
            }
        }
    }, [isAuthenticated, user, router]);

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {showRegister ? (
                    <RegisterForm
                        onSuccess={() => router.push('/')}
                        onSwitchToLogin={() => setShowRegister(false)}
                    />
                ) : (
                    <LoginForm
                        onSuccess={() => router.push('/')}
                        onSwitchToRegister={() => setShowRegister(true)}
                    />
                )}
            </div>
        </div>
    );
}