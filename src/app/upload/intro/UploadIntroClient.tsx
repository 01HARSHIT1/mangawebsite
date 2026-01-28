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

    const resolvedModeLabel =
        creatorType === 'anime' ? 'Anime' : creatorType === 'manga' ? 'Manga' : 'Manga + Anime';

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
        <div className="min-h-screen bg-gradient-to-br from-[#f6f0ff] via-[#f6f7ff] to-[#fff4ef] text-slate-900">
            {/* watercolor blobs (closer to reference) */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-32 left-[-60px] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-indigo-200/55 to-purple-200/30 blur-3xl" />
                <div className="absolute top-24 right-[-80px] h-[420px] w-[420px] rounded-full bg-gradient-to-br from-pink-200/45 to-orange-200/25 blur-3xl" />
                <div className="absolute bottom-[-140px] left-[20%] h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-200/35 to-indigo-200/20 blur-3xl" />
            </div>

            <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14">
                {/* Main poster area */}
                <div className="mx-auto max-w-4xl">
                    <div className="rounded-[28px] bg-white/60 border border-slate-200/70 shadow-[0_25px_70px_rgba(15,23,42,0.10)] backdrop-blur-sm px-6 sm:px-10 py-10 sm:py-12">
                        <div className="text-center">
                            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                                Upload Your Manga &amp; Anime —<br className="hidden sm:block" />
                                Keep 100% Ownership
                            </h1>

                            <p className="mt-4 text-slate-700 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                                <span className="font-semibold">RealmVerse</span> is India’s indie-first manga &amp; anime platform where
                                creators can publish freely, grow an audience, and stay in full control of their work.
                            </p>

                            <p className="mt-3 text-slate-700 font-semibold">No fees. No exclusivity. No pressure.</p>
                        </div>

                        {/* CTA */}
                        <div className="mt-8 flex flex-col items-center gap-3">
                            <button
                                onClick={handleContinue}
                                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-b from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold shadow-[0_12px_24px_rgba(37,99,235,0.25)] border border-indigo-300/40 transition-all active:scale-[0.99] min-h-[44px]"
                            >
                                Continue as Creator (Free)
                            </button>

                            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-700">
                                <span className="inline-flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 border border-sky-200">
                                        <CheckCircle2 className="h-4 w-4 text-sky-700" />
                                    </span>
                                    Free Upload
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 border border-amber-200">
                                        <ShieldCheck className="h-4 w-4 text-amber-700" />
                                    </span>
                                    Full Ownership
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200">
                                        <Globe2 className="h-4 w-4 text-emerald-700" />
                                    </span>
                                    Global Audience
                                </span>
                            </div>

                            <div className="text-xs sm:text-sm text-slate-700 font-semibold">✅ {trustLine}</div>
                        </div>

                        {/* Optional: creator type selector (collapsed by default to match reference image) */}
                        <div className="mt-6 mx-auto max-w-2xl">
                            <details className="group">
                                <summary className="cursor-pointer select-none text-center text-xs sm:text-sm font-semibold text-slate-700 underline underline-offset-4">
                                    Choose what you create (optional)
                                </summary>
                                <div className="mt-4">
                                    <div className="text-center text-sm font-semibold text-slate-700 mb-3">I create:</div>
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
                                                            : 'bg-white/70 hover:bg-white text-slate-800 border border-slate-200',
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
                            </details>
                        </div>

                        {/* Sections */}
                        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-5 w-5 text-amber-600" />
                                    <h2 className="text-lg sm:text-xl font-extrabold tracking-wide">WHY REALMVERSE?</h2>
                                </div>
                                <p className="text-slate-700 mb-4">We are building a creator-first home for:</p>
                                <ul className="space-y-2 text-slate-800">
                                    {[
                                        'Manga artists',
                                        'Webtoon storytellers',
                                        'Indie anime & animation creators',
                                        'Motion comic creators',
                                        'New and upcoming talent',
                                    ].map((t) => (
                                        <li key={t} className="flex items-start gap-3">
                                            <span className="mt-2 h-2 w-2 rounded-full bg-blue-600" />
                                            <span>{t}</span>
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-5 text-slate-700">
                                    Whether you’re a beginner or experienced — you are welcome here.
                                </p>
                            </div>

                            <div>
                                <h2 className="text-lg sm:text-xl font-extrabold tracking-wide mb-3">
                                    CREATOR PROMISE — WHAT YOU GET
                                </h2>
                                <ul className="space-y-3 text-slate-800">
                                    {[
                                        'Free Upload Forever',
                                        'Upload manga chapters or anime episodes without paying anything',
                                        'You own your work 100%',
                                        'No exclusivity',
                                        'Remove anytime',
                                        'Built for indie creators',
                                    ].map((t, i) => (
                                        <li key={t} className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                                            <span className={i === 0 ? 'font-semibold' : ''}>{t}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-6 rounded-xl bg-white/65 border border-slate-200 p-5">
                                    <div className="font-extrabold tracking-wide text-slate-900 mb-1">FOUNDING CREATOR PROGRAM</div>
                                    <p className="text-slate-700 text-sm">
                                        We are inviting our first creators as Founding Creators of RealmVerse.
                                    </p>
                                    <ul className="mt-3 space-y-2 text-sm text-slate-800">
                                        {[
                                            'Special badge on your profile',
                                            'Featured placement on homepage',
                                            'Early visibility boost',
                                            'Lifetime creator perks as we grow',
                                        ].map((t) => (
                                            <li key={t} className="flex items-start gap-2">
                                                <span className="mt-2 h-2 w-2 rounded-full bg-amber-600" />
                                                <span>{t}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Bottom CTA like reference */}
                        <div className="mt-10 flex flex-col items-center gap-3">
                            <button
                                onClick={handleContinue}
                                className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-b from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-blue-600/25 transition-all active:scale-[0.99] min-h-[44px]"
                            >
                                Continue as Creator (Free Upload)
                            </button>

                            <div className="text-xs text-slate-600">
                                © {new Date().getFullYear()} <span className="font-semibold">RealmVerse</span>.
                            </div>
                        </div>
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

