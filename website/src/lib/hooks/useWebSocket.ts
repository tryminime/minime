'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useWebSocket() {
    // Refactored to use interval polling instead of WebSocket for stability (matches desktop app behavior).
    // The signature is kept the same so consumers don't need changes.
    const [isConnected, setIsConnected] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        // Poll every 30 seconds
        const intervalId = setInterval(() => {
            const token = typeof window !== 'undefined'
                ? localStorage.getItem('minime_auth_token')
                : null;

            if (!token) return;

            // Invalidate key data periodically to simulate real-time updates
            setLastUpdate(new Date());
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            queryClient.invalidateQueries({ queryKey: ['productivity'] });
            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
            queryClient.invalidateQueries({ queryKey: ['graph'] });
        }, 30000);

        return () => clearInterval(intervalId);
    }, [queryClient]);

    return { isConnected, lastUpdate, socket: null };
}
