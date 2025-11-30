"use client";
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import OnboardingTutorial from "@/components/OnboardingTutorial";
import { HelpCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ErrorBoundary from '@/components/ErrorBoundary';
import PerformanceMonitor from '@/components/PerformanceMonitor';
import ModernNavigation from '@/components/ModernNavigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import PushNotifications from './PushNotifications';
import PWAInstaller from './PWAInstaller';
import { useAIFeatures } from '@/hooks/useAIFeatures';

// VoiceAssistant - Load globally for all pages (lazy loaded to prevent blocking)
const VoiceAssistant = dynamic(() => import('./VoiceAssistant'), { 
    ssr: false,
    loading: () => null
});

export default function ClientLayoutShell({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <NotificationProvider>
                <WebSocketProvider>
                    <ClientLayoutContent>{children}</ClientLayoutContent>
                </WebSocketProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
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
    
    // AI Features - Get voice assistant preference (deferred to prevent blocking)
    const [pageInteractive, setPageInteractive] = useState(false);
    const { voiceAssistantEnabled, loading: aiFeaturesLoading } = useAIFeatures();
    
    useEffect(() => {
        // Mark page as interactive after initial render
        const timer = setTimeout(() => setPageInteractive(true), 500);
        return () => clearTimeout(timer);
    }, []);

    // Hide main navigation on creator/admin dashboard pages and chapter reading pages
    const hideMainNav = pathname?.startsWith('/creator/dashboard') || 
                       pathname?.startsWith('/admin') ||
                       pathname?.startsWith('/admin-dashboard') ||
                       pathname?.includes('/chapter/');

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
            {!hideMainNav && <ModernNavigation />}
            <main role="main">{children}</main>
            {!hideMainNav && <Footer />}
            <PushNotifications />
            <PWAInstaller />
            
            {/* Voice Assistant - Global: Visible on all pages */}
            {pageInteractive && !aiFeaturesLoading && (
                <VoiceAssistant
                    enabled={voiceAssistantEnabled}
                    showUI={true}
                />
            )}
        </ErrorBoundary>
    );
} 