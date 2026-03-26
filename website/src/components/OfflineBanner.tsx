'use client';

import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * A dismissible banner shown at the top of the page when the user is offline.
 * Automatically hides when connectivity is restored.
 */
export function OfflineBanner() {
    const { isOnline, isOffline } = useNetworkStatus();
    const [visible, setVisible] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        if (isOffline) {
            setVisible(true);
            setShowReconnected(false);
        } else if (visible) {
            // Was offline, now back online → flash a "reconnected" message briefly
            setShowReconnected(true);
            const t = setTimeout(() => {
                setVisible(false);
                setShowReconnected(false);
            }, 3000);
            return () => clearTimeout(t);
        }
    }, [isOnline, isOffline]);

    if (!visible) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all duration-500 ${
                showReconnected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-500 text-white'
            }`}
        >
            {showReconnected ? (
                <>
                    <Wifi className="w-4 h-4" />
                    Back online — syncing…
                </>
            ) : (
                <>
                    <WifiOff className="w-4 h-4" />
                    You&apos;re offline. The app works locally — data will sync when reconnected.
                    <button
                        onClick={() => setVisible(false)}
                        className="ml-3 rounded-full px-2 py-0.5 text-xs bg-black/20 hover:bg-black/30 transition-colors"
                    >
                        Dismiss
                    </button>
                </>
            )}
        </div>
    );
}
