'use client';

import { useEffect, useState } from 'react';

/**
 * Returns whether the browser currently has a network connection.
 * Updates in real-time as the connection changes.
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof window !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { isOnline, isOffline: !isOnline };
}
