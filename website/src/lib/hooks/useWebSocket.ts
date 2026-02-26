'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const WS_BASE = (process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000')
    .replace(/^http/, 'ws');  // http → ws, https → wss

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const queryClient = useQueryClient();
    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const attempts = useRef(0);
    const MAX_ATTEMPTS = 3;

    useEffect(() => {
        function connect() {
            if (attempts.current >= MAX_ATTEMPTS) return;

            try {
                const ws = new WebSocket(`${WS_BASE}/ws`);
                wsRef.current = ws;

                ws.onopen = () => {
                    console.log('[WebSocket] Connected');
                    setIsConnected(true);
                    attempts.current = 0;
                };

                ws.onclose = () => {
                    setIsConnected(false);
                    attempts.current += 1;
                    if (attempts.current < MAX_ATTEMPTS) {
                        reconnectTimer.current = setTimeout(connect, 8000);
                    }
                };

                ws.onerror = () => {
                    // Silent — no console.error, no toast
                    setIsConnected(false);
                };

                ws.onmessage = (event) => {
                    try {
                        const msg = JSON.parse(event.data) as { type: string };
                        setLastUpdate(new Date());
                        if (msg.type === 'activity:new') {
                            queryClient.invalidateQueries({ queryKey: ['productivity'] });
                        } else if (msg.type === 'metrics:updated') {
                            queryClient.invalidateQueries({ queryKey: ['productivity'] });
                            queryClient.invalidateQueries({ queryKey: ['collaboration'] });
                        } else if (msg.type === 'graph:updated') {
                            queryClient.invalidateQueries({ queryKey: ['graph'] });
                            queryClient.invalidateQueries({ queryKey: ['collaboration', 'network'] });
                        }
                    } catch {
                        // ignore unparseable messages
                    }
                };
            } catch {
                // WebSocket constructor threw — browser blocked, silently exit
            }
        }

        connect();

        return () => {
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            wsRef.current?.close();
        };
    }, [queryClient]);

    return { isConnected, lastUpdate, socket: wsRef.current };
}
