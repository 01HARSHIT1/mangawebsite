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

    const mode = useMemo<UploadMode>(() => normalizeMode(searchParams?.get('mode') ?? null), [searchParams]);
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
        <div className="min-h-screen w-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 pt-14 sm:pt-16 pb-24 sm:pb-28">
            {/* Nav lives in layout (fixed); pt-14/16 reserves space; pb-24/28 prevents second CTA from being cut off on mobile */}
            {/* Scrollable image + buttons: image sets page height, both scroll together */}
            <div className="relative w-full">
                {/* Full-width image at natural height so the whole image is visible and scrolls */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imagePath}
                    alt="RealmVerse Creator Landing Page"
                    className="block w-full h-auto"
                />
                {/* Buttons overlaid exactly on image "Continue as Creator" graphics — responsive so overlap is correct on mobile, tablet, desktop */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* First CTA: slightly smaller so it does not overlap the boy illustration */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto w-[62%] max-w-[190px] sm:w-[72%] sm:max-w-[240px] md:w-[80%] md:max-w-[340px] lg:w-[85%] lg:max-w-[420px] ml-[-4px] sm:ml-[-10px] md:ml-[-16px] lg:ml-[-24px] top-[20%] sm:top-[21%] md:top-[21.5%] lg:top-[21.7%]"
                    >
                        <button
                            onClick={handleContinue}
                            className="w-full px-2.5 py-1.5 text-[11px] min-h-[36px] sm:px-3.5 sm:py-2 sm:text-xs sm:min-h-[42px] md:px-4 md:py-2.5 md:text-sm md:min-h-[50px] lg:text-base lg:min-h-[56px] rounded-lg sm:rounded-xl text-white font-bold border border-white/20 transition-all active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(to right, #3b82f6, #6366f1, #9333ea)',
                                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                            }}
                        >
                            Continue as Creator (Free)
                        </button>
                    </div>
                    {/* Second CTA: size to properly cover image "Continue" graphic */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto w-[72%] max-w-[230px] sm:w-[80%] sm:max-w-[300px] md:w-[85%] md:max-w-[420px] lg:w-[88%] lg:max-w-[520px] top-[94%] sm:top-[96.5%] md:top-[97%] lg:top-[97%]"
                    >
                        <button
                            onClick={handleContinue}
                            className="w-full px-3 py-2 text-xs min-h-[40px] sm:px-4 sm:py-2.5 sm:text-sm sm:min-h-[48px] md:px-5 md:py-3 md:text-base md:min-h-[52px] rounded-lg sm:rounded-xl text-white font-bold border border-white/20 transition-all active:scale-[0.98] leading-tight shrink-0"
                            style={{
                                background: 'linear-gradient(to right, #3b82f6, #6366f1, #9333ea)',
                                boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
                            }}
                        >
                            Continue as Creator (Free Upload)
                        </button>
                    </div>
                </div>
            </div>

            {/* Auth Modal (Signup/Login) */}
            {authOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setAuthOpen(false)} />
                    <div className="relative w-full max-w-xl my-auto min-h-0">
                        <div className="rounded-xl sm:rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto">
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

