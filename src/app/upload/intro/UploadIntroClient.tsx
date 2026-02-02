'use client';

/**
 * Creator landing page. Continue button sizes are independent:
 * - Mobile/tablet: edit base, sm:, and md: classes only.
 * - Laptop/desktop: edit lg: and xl: classes only. Changing one does not affect the other.
 */
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

    // Creator landing image (URL-encoded so it loads on Vercel)
    const imagePath = '/' + encodeURI('ChatGPT Image Feb 2, 2026, 04_20_31 PM.png');

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 pt-14 sm:pt-16 pb-24 sm:pb-28">
            {/* Nav lives in layout (fixed); pt-14/16 reserves space; pb-24/28 prevents second CTA from being cut off on mobile */}
            {/* Scrollable image + buttons: image sets page height, both scroll together */}
            <div className="relative w-full max-w-[1920px] mx-auto overflow-hidden">
                {/* Full-width image: responsive, no break on laptop; natural height so whole image visible and scrolls */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imagePath}
                    alt="RealmVerse Creator Landing Page"
                    className="block w-full h-auto max-w-full min-w-0 object-contain"
                />
                {/* First CTA: between "No fees. No exclusivity. No pressure." and "WHY REALMVERSE?" */}
                {/* Second CTA: bottom space below Creator Promise / Founding Creator */}
                <div className="absolute inset-0 pointer-events-none">
                    <div
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto
                          w-[70%] max-w-[320px] top-[28%]
                          sm:w-[75%] sm:max-w-[400px] sm:top-[28%]
                          md:w-[78%] md:max-w-[500px] md:top-[28%]
                          lg:w-[72%] lg:max-w-[580px] lg:top-[28%]
                          xl:w-[72%] xl:max-w-[620px] xl:top-[28%]"
                    >
                        <button
                            onClick={handleContinue}
                            className="
                              relative w-full inline-flex items-center justify-center
                              px-6 py-3.5 text-sm font-extrabold tracking-wide text-white
                              sm:px-8 sm:py-4 sm:text-base
                              md:px-10 md:py-4 md:text-lg
                              lg:px-12 lg:py-5 lg:text-xl
                              xl:px-14 xl:py-5 xl:text-xl
                              rounded-2xl overflow-hidden
                              bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600
                              border border-white/25
                              shadow-[0_0_35px_rgba(99,102,241,0.65)]
                              hover:shadow-[0_0_60px_rgba(139,92,246,0.9)]
                              transition-all duration-300 ease-out
                              hover:scale-[1.05]
                              active:scale-[0.97]
                            "
                        >
                            <span className="absolute inset-0 bg-white/10 blur-xl opacity-30" aria-hidden />
                            <span className="relative z-10">✨ Continue as Creator (Free)</span>
                        </button>
                    </div>
                    {/* Second CTA: bottom space of image */}
                    <div
                        className="absolute left-1/2 -translate-x-1/2 pointer-events-auto
                          w-[72%] max-w-[340px] top-[92%]
                          sm:w-[78%] sm:max-w-[420px] sm:top-[93%]
                          md:w-[82%] md:max-w-[520px] md:top-[93.5%]
                          lg:w-[80%] lg:max-w-[680px] lg:top-[94%]
                          xl:w-[80%] xl:max-w-[720px] xl:top-[94%]"
                    >
                        <button
                            onClick={handleContinue}
                            className="
                              relative w-full inline-flex items-center justify-center
                              px-6 py-3.5 text-sm font-extrabold tracking-wide text-white leading-tight
                              sm:px-8 sm:py-4 sm:text-base
                              md:px-10 md:py-4 md:text-lg
                              lg:px-12 lg:py-5 lg:text-xl
                              xl:px-14 xl:py-5 xl:text-xl
                              rounded-2xl overflow-hidden
                              bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600
                              border border-white/25
                              shadow-[0_0_35px_rgba(99,102,241,0.65)]
                              hover:shadow-[0_0_60px_rgba(139,92,246,0.9)]
                              transition-all duration-300 ease-out
                              hover:scale-[1.05]
                              active:scale-[0.97]
                            "
                        >
                            <span className="absolute inset-0 bg-white/10 blur-xl opacity-30" aria-hidden />
                            <span className="relative z-10">✨ Continue as Creator (Free Upload)</span>
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

