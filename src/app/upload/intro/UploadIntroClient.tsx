'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

type UploadMode = 'manga' | 'anime';
type CreatorType = 'manga' | 'anime' | 'both';

function normalizeMode(value: string | null): UploadMode {
    return value === 'anime' ? 'anime' : 'manga';
}

export default function UploadIntroClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [authOpen, setAuthOpen] = useState(false);
    const [authView, setAuthView] = useState<'signup' | 'login'>('signup');

    const mode = useMemo<UploadMode>(() => normalizeMode(searchParams?.get('mode')), [searchParams]);
    const [creatorType, setCreatorType] = useState<CreatorType>(mode);

    const continueHref = useMemo(() => {
        const returnTo = searchParams?.get('returnTo');
        if (returnTo && returnTo.startsWith('/')) return returnTo;
        const resolvedMode = creatorType === 'anime' ? 'anime' : 'manga';
        return resolvedMode === 'anime' ? '/anime/creator/upload' : '/upload';
    }, [creatorType, searchParams]);

    const handleContinue = () => {
        if (!isAuthenticated) {
            setAuthView('signup');
            setAuthOpen(true);
            return;
        }
        router.push(continueHref);
    };

    const trustLine = 'Your work stays yours. RealmVerse never claims ownership.';

    // URL-safe path (no spaces/special chars) so it loads reliably on Vercel
    const imagePath = '/creator-landing.png';

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950">
            {/* Scrollable image + buttons: image sets page height, both scroll together */}
            <div className="relative w-full">
                {/* Full-width image at natural height so the whole image is visible and scrolls */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imagePath}
                    alt="RealmVerse Creator Landing Page"
                    className="block w-full h-auto"
                />
                {/* Buttons overlaid on image at same positions as "Continue as Creator" in the design */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[28%] left-1/2 -translate-x-1/2 pointer-events-auto">
                        <button
                            onClick={handleContinue}
                            className="px-10 py-4 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white font-bold text-base sm:text-lg shadow-[0_8px_20px_rgba(59,130,246,0.4)] border border-white/20 transition-all active:scale-[0.98] min-h-[48px] backdrop-blur-sm whitespace-nowrap"
                            style={{
                                background: 'linear-gradient(to right, #3b82f6, #6366f1, #9333ea)',
                            }}
                        >
                            Continue as Creator (Free)
                        </button>
                    </div>
                    <div className="absolute top-[78%] left-1/2 -translate-x-1/2 pointer-events-auto">
                        <button
                            onClick={handleContinue}
                            className="px-10 py-4 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:via-indigo-600 hover:to-purple-700 text-white font-bold text-base sm:text-lg shadow-[0_8px_20px_rgba(59,130,246,0.4)] border border-white/20 transition-all active:scale-[0.98] min-h-[48px] backdrop-blur-sm whitespace-nowrap"
                            style={{
                                background: 'linear-gradient(to right, #3b82f6, #6366f1, #9333ea)',
                            }}
                        >
                            Continue as Creator (Free Upload)
                        </button>
                    </div>
                </div>
            </div>

            {/* Auth Modal (Signup/Login) */}
            {authOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setAuthOpen(false)} />
                    <div className="relative w-full max-w-xl">
                        <div className="rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                                <div className="font-extrabold text-slate-900">Join RealmVerse</div>
                                <button
                                    type="button"
                                    onClick={() => setAuthOpen(false)}
                                    className="p-2 rounded-lg hover:bg-slate-100"
                                    aria-label="Close"
                                >
                                    <X className="h-5 w-5 text-slate-600" />
                                </button>
                            </div>

                            <div className="px-5 py-4">
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setAuthView('signup')}
                                        className={[
                                            'flex-1 min-h-[44px] rounded-xl font-bold text-sm border transition-all',
                                            authView === 'signup'
                                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent'
                                                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        Sign up
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAuthView('login')}
                                        className={[
                                            'flex-1 min-h-[44px] rounded-xl font-bold text-sm border transition-all',
                                            authView === 'login'
                                                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent'
                                                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50',
                                        ].join(' ')}
                                    >
                                        Log in
                                    </button>
                                </div>

                                <div className="text-sm text-slate-700 mb-4">✅ {trustLine}</div>

                                {authView === 'login' ? (
                                    <LoginForm
                                        onSuccess={() => {
                                            setAuthOpen(false);
                                            router.push(continueHref);
                                        }}
                                        onSwitchToRegister={() => setAuthView('signup')}
                                    />
                                ) : (
                                    <RegisterForm
                                        onSuccess={() => {
                                            setAuthOpen(false);
                                            router.push(continueHref);
                                        }}
                                        onSwitchToLogin={() => setAuthView('login')}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

