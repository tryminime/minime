/**
 * useLocalBackend — checks if the MiniMe local backend is running.
 *
 * Returns:
 *   isDetecting   — true while the first check is in progress
 *   isRunning     — true if localhost:8000/health returned 200
 *   apiUrl        — use this as the base URL for all API calls
 *   retry         — call this to re-check (e.g. after user starts MiniMe)
 */

import { useState, useEffect, useCallback } from 'react';

const LOCAL_API = 'http://localhost:8000';
const HEALTH_TIMEOUT_MS = 3000;

export interface LocalBackendState {
    isDetecting: boolean;
    isRunning: boolean;
    apiUrl: string;
    retry: () => void;
}

export function useLocalBackend(): LocalBackendState {
    const [isDetecting, setIsDetecting] = useState(true);
    const [isRunning, setIsRunning] = useState(false);
    const [tick, setTick] = useState(0);

    const retry = useCallback(() => setTick(t => t + 1), []);

    useEffect(() => {
        let cancelled = false;
        setIsDetecting(true);

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

        fetch(`${LOCAL_API}/health`, { signal: controller.signal, mode: 'cors' })
            .then(r => {
                if (!cancelled) setIsRunning(r.ok);
            })
            .catch(() => {
                if (!cancelled) setIsRunning(false);
            })
            .finally(() => {
                clearTimeout(timer);
                if (!cancelled) setIsDetecting(false);
            });

        return () => {
            cancelled = true;
            controller.abort();
        };
    }, [tick]);

    return {
        isDetecting,
        isRunning,
        apiUrl: LOCAL_API,
        retry,
    };
}
