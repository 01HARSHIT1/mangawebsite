"use client";
import { useState, useEffect, useRef } from 'react';
import OnboardingTutorial from "@/components/OnboardingTutorial";
import { HelpCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ErrorBoundary from '@/components/ErrorBoundary';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import PushNotifications from './PushNotifications';

export default function ClientLayoutShell({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <NotificationProvider>
                <ClientLayoutContent>{children}</ClientLayoutContent>
            </NotificationProvider>
        </AuthProvider>
    );
}

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
    const [dark, setDark] = useState(true);
    const [coins, setCoins] = useState<number>(0);
    const [showBuy, setShowBuy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState(100);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [dark]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                // Handle click outside logic if needed
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleOnboardingComplete = () => {
        setShowOnboarding(false);
        localStorage.setItem("onboardingComplete", "true");
    };

    return (
        <ErrorBoundary>
            <PerformanceMonitor />
            <Navigation />
            <main role="main">{children}</main>
            <PushNotifications />
            {/* ...footer code from previous layout.tsx... */}
        </ErrorBoundary>
    );
} 