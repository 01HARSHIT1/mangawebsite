import React, { useEffect, useState } from 'react';

interface AdSlotProps {
    adType?: 'banner' | 'rectangle' | 'leaderboard';
    client?: string; // AdSense client ID
    slot?: string;   // AdSense slot ID
    style?: React.CSSProperties;
    className?: string;
    location?: string; // e.g., 'homepage', 'manga', 'reader'
}

const adStyles: Record<string, React.CSSProperties> = {
    banner: { display: 'block', width: '100%', minHeight: 90, background: '#222', borderRadius: 12 },
    rectangle: { display: 'block', width: 300, height: 250, margin: '0 auto', background: '#222', borderRadius: 12 },
    leaderboard: { display: 'block', width: '100%', minHeight: 90, background: '#222', borderRadius: 12 },
};

function CustomAd({ ad }: { ad: any }) {
    if (!ad) return null;
    if (ad.type === 'image') {
        return (
            <a href={ad.link || '#'} target="_blank" rel="noopener noreferrer">
                <img src={ad.content} alt="Ad" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8 }} />
            </a>
        );
    }
    if (ad.type === 'html') {
        return <div dangerouslySetInnerHTML={{ __html: ad.content }} style={{ width: '100%', minHeight: 60, borderRadius: 8, background: '#fff' }} />;
    }
    if (ad.type === 'script') {
        // For security, do not execute scripts client-side. Show code as preview.
        return <pre style={{ width: '100%', background: '#222', color: '#fff', borderRadius: 8, padding: 8 }}>{ad.content}</pre>;
    }
    return null;
}

export default function AdSlot({ adType = 'banner', client, slot, style, className, location = 'homepage' }: AdSlotProps) {
    const [customAd, setCustomAd] = useState<any>(null);
    useEffect(() => {
        let ignore = false;
        fetch(`/api/ads?location=${encodeURIComponent(location)}`)
            .then(res => res.json())
            .then(data => {
                if (!ignore && Array.isArray(data.ads) && data.ads.length > 0) {
                    setCustomAd(data.ads[0]);
                } else if (!ignore) {
                    setCustomAd(null);
                }
            });
        return () => { ignore = true; };
    }, [location]);

    if (customAd) {
        return (
            <div className={className} style={{ ...adStyles[adType], ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CustomAd ad={customAd} />
            </div>
        );
    }

    if (!client || !slot) {
        // Show a placeholder if not configured
        return (
            <div
                className={className}
                style={{ ...adStyles[adType], ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 18, fontWeight: 600, border: '2px dashed #444' }}
                aria-label="Ad placeholder"
            >
                Advertisement
            </div>
        );
    }

    useEffect(() => {
        if (client && slot && typeof window !== 'undefined') {
            if (!document.querySelector('script[src*="pagead2.googlesyndication.com"]')) {
                const script = document.createElement('script');
                script.async = true;
                script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
                script.crossOrigin = 'anonymous';
                document.body.appendChild(script);
            }
            // @ts-ignore
            window.adsbygoogle = window.adsbygoogle || [];
            // @ts-ignore
            window.adsbygoogle.push({});
        }
    }, [client, slot]);

    return (
        <ins
            className={`adsbygoogle ${className || ''}`}
            style={{ ...adStyles[adType], ...style }}
            data-ad-client={client}
            data-ad-slot={slot}
            data-ad-format={adType === 'rectangle' ? 'rectangle' : 'auto'}
            aria-label="AdSense ad"
        />
    );
} 