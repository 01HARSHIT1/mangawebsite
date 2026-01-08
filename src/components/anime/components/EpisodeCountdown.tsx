'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface EpisodeCountdownProps {
    scheduledAt: string | Date;
    episodeTitle?: string;
    onRelease?: () => void;
}

export default function EpisodeCountdown({
    scheduledAt,
    episodeTitle,
    onRelease,
}: EpisodeCountdownProps) {
    const [timeRemaining, setTimeRemaining] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);
    const [isReleased, setIsReleased] = useState(false);

    useEffect(() => {
        const calculateTimeRemaining = () => {
            const scheduled = new Date(scheduledAt);
            const now = new Date();
            const diff = scheduled.getTime() - now.getTime();

            if (diff <= 0) {
                setIsReleased(true);
                setTimeRemaining(null);
                if (onRelease) {
                    onRelease();
                }
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds });
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [scheduledAt, onRelease]);

    if (isReleased || !timeRemaining) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-orange-900/50 to-red-900/50 border border-orange-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-orange-400 animate-pulse" />
                <h3 className="text-lg font-semibold text-orange-400">
                    Episode Releases In
                </h3>
            </div>
            
            {episodeTitle && (
                <p className="text-gray-300 text-sm mb-3">{episodeTitle}</p>
            )}

            <div className="grid grid-cols-4 gap-3">
                <div className="text-center bg-black/40 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-400">
                        {timeRemaining.days.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Days</div>
                </div>
                <div className="text-center bg-black/40 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-400">
                        {timeRemaining.hours.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Hours</div>
                </div>
                <div className="text-center bg-black/40 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-400">
                        {timeRemaining.minutes.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Minutes</div>
                </div>
                <div className="text-center bg-black/40 rounded-lg p-3">
                    <div className="text-2xl font-bold text-orange-400">
                        {timeRemaining.seconds.toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Seconds</div>
                </div>
            </div>
        </div>
    );
}
