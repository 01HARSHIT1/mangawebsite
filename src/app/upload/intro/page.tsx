'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Globe2, Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';

type UploadMode = 'manga' | 'anime';
type CreatorType = 'manga' | 'anime' | 'both';

function normalizeMode(value: string | null): UploadMode {
    return value === 'anime' ? 'anime' : 'manga';
}

export default function UploadIntroPage() {
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
    }, [creatorType, mode, searchParams]);

    const resolvedModeLabel = creatorType === 'anime' ? 'Anime' : creatorType === 'manga' ? 'Manga' : 'Manga + Anime';

    const handleContinue = () => {
        if (!isAuthenticated) {
            setAuthView('signup');
            setAuthOpen(true);
            return;
        }
        router.push(continueHref);
    };

    const trustLine = 'Your work stays yours. RealmVerse never claims ownership.';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f7f2ff] via-[#f3f7ff] to-[#fff6f2] text-slate-900">
            {/* soft paper texture */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
                <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-purple-200/70 to-blue-200/40 blur-3xl" />
                <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-pink-200/60 to-orange-200/40 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-5xl px-4 py-10 sm:py-14">
                <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.12)] overflow-hidden">
                    <div className="px-6 sm:px-10 pt-10 sm:pt-12 pb-8">
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm">
                                <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600" />
                                RealmVerse Creator Platform
                            </div>
                            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                                Upload Your Manga &amp; Anime —<br className="hidden sm:block" />
                                Keep 100% Ownership
                            </h1>
                            <p className="mt-4 text-slate-700 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                                Publish on <span className="font-semibold">RealmVerse</span> — built for Indian storytellers, artists, and animators.
                                Upload manga chapters or anime episodes, grow your audience, and stay in full control.
                            </p>
                            <p className="mt-2 text-slate-700 font-semibold">
                                No fees. No exclusivity. No pressure.
                            </p>
                        </div>

                        <div className="mt-7 flex flex-col items-center gap-3">
                            {/* Creator Type Selector */}
                            <div className="w-full max-w-xl rounded-2xl bg-white/70 border border-slate-200 p-3">
                                <div className="text-center text-sm font-semibold text-slate-700 mb-3">
                                    I create:
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {([
                                        { id: 'manga', label: 'Manga 📚' },
                                        { id: 'anime', label: 'Anime 🎬' },
                                        { id: 'both', label: 'Both ✨' },
                                    ] as Array<{ id: CreatorType; label: string }>).map((opt) => {
                                        const active = creatorType === opt.id;
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => setCreatorType(opt.id)}
                                                className={[
                                                    'min-h-[44px] rounded-xl px-4 py-3 font-bold transition-all text-sm',
                                                    active
                                                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                                                        : 'bg-white/80 hover:bg-white text-slate-800 border border-slate-200',
                                                ].join(' ')}
                                            >
                                                {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 text-center text-xs text-slate-600">
                                    Selected: <span className="font-semibold">{resolvedModeLabel}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleContinue}
                                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.99] min-h-[44px]"
                            >
                                Continue as Creator (Free)
                            </button>

                            <div className="text-xs sm:text-sm text-slate-700 font-semibold">
                                ✅ {trustLine}
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-slate-700">
                                <span className="inline-flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    Free Upload
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                                    Full Ownership
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Globe2 className="h-4 w-4 text-sky-600" />
                                    Global Audience
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 sm:px-10 pb-10 sm:pb-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                            <div className="rounded-2xl bg-white/70 border border-slate-200 p-6 sm:p-7">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="h-5 w-5 text-amber-600" />
                                    <h2 className="text-lg sm:text-xl font-extrabold tracking-wide">
                                        WHY REALMVERSE?
                                    </h2>
                                </div>
                                <p className="text-slate-700 mb-4">
                                    We are building a creator-first home for:
                                </p>
                                <ul className="space-y-2 text-slate-800">
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                        <span>Manga artists</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                        <span>Webtoon storytellers</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                        <span>Indie anime &amp; animation creators</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                        <span>Motion comic creators</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="mt-1 h-2 w-2 rounded-full bg-blue-600" />
                                        <span>New and upcoming talent</span>
                                    </li>
                                </ul>

                                <p className="mt-5 text-slate-700">
                                    Whether you’re a beginner or experienced — you are welcome here.
                                </p>
                            </div>

                            <div className="rounded-2xl bg-white/70 border border-slate-200 p-6 sm:p-7">
                                <h2 className="text-lg sm:text-xl font-extrabold tracking-wide mb-4">
                                    CREATOR PROMISE — WHAT YOU GET
                                </h2>

                                <ul className="space-y-3 text-slate-800">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                        <span className="font-semibold">Free Upload Forever</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                        <span>Upload manga chapters or anime episodes without paying anything</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                        <span>You own your work 100%</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                        <span>No exclusivity</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                        <span>Remove anytime</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                        <span>Built for indie creators</span>
                                    </li>
                                </ul>

                                <div className="mt-6 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-5">
                                    <div className="font-extrabold tracking-wide text-slate-900 mb-1">
                                        RealmVerse Spotlight Program
                                    </div>
                                    <p className="text-slate-700 text-sm">
                                        Become an early creator on RealmVerse and get extra visibility as we grow.
                                    </p>
                                    <ul className="mt-3 space-y-2 text-sm text-slate-800">
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-amber-600" />
                                            <span>Special badge on your profile</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-amber-600" />
                                            <span>Featured placement on homepage</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-amber-600" />
                                            <span>Early visibility boost</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-1 h-2 w-2 rounded-full bg-amber-600" />
                                            <span>Lifetime creator perks as we grow</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-3">
                            <button
                                onClick={handleContinue}
                                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.99] min-h-[44px]"
                            >
                                Continue as Creator (Free)
                            </button>
                            <div className="text-xs text-slate-600">
                                Not ready? You can always come back later from the navigation.
                                {' '}
                                <Link href="/" className="underline underline-offset-2 hover:text-slate-900">
                                    Go Home
                                </Link>
                            </div>

                            <div className="mt-2 text-xs text-slate-600">
                                © {new Date().getFullYear()} <span className="font-semibold">RealmVerse</span>. All rights reserved.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Auth Modal (Signup/Login) */}
            {authOpen && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setAuthOpen(false)}
                    />
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

                                <div className="text-sm text-slate-700 mb-4">
                                    ✅ {trustLine}
                                </div>

                                {/* The existing forms have their own dark styling; they still work fine inside the modal */}
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

