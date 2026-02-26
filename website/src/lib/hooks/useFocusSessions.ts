'use client';

import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '../api';
import { ActivityItem } from './useActivities';

export interface FocusSession {
    id: string;
    app: string;
    title: string;
    duration_seconds: number;
    depth: 'shallow' | 'medium' | 'deep';
    created_at: string;
}

export interface FocusStats {
    total_focus_hours: number;
    avg_session_minutes: number;
    deep_work_sessions: number;
    longest_session_minutes: number;
    sessions: FocusSession[];
    daily_hours: { date: string; hours: number }[];
}

function classifyDepth(durationSeconds: number): 'shallow' | 'medium' | 'deep' {
    if (durationSeconds >= 5400) return 'deep';     // 90+ min
    if (durationSeconds >= 1500) return 'medium';    // 25+ min
    return 'shallow';                                 // 10+ min
}

export function useFocusSessions() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['activities', 'focus-sessions'],
        queryFn: async () => {
            // Fetch both window_focus and app_focus activities
            const [windowFocus, appFocus] = await Promise.all([
                api.get<{ activities: ActivityItem[] }>('/api/v1/activities?type=window_focus&limit=200').catch(() => ({ activities: [] })),
                api.get<{ activities: ActivityItem[] }>('/api/v1/activities?type=app_focus&limit=200').catch(() => ({ activities: [] })),
            ]);

            const allActivities = [...(windowFocus.activities || []), ...(appFocus.activities || [])];

            // Filter to focus sessions (>= 10 min)
            const focusActivities = allActivities.filter(a => (a.duration_seconds || 0) >= 600);

            // Sort by date descending
            focusActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const sessions: FocusSession[] = focusActivities.map(a => ({
                id: a.id,
                app: a.app || 'Unknown',
                title: a.title || 'Focus session',
                duration_seconds: a.duration_seconds || 0,
                depth: classifyDepth(a.duration_seconds || 0),
                created_at: a.created_at,
            }));

            const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
            const deepSessions = sessions.filter(s => s.depth === 'deep' || s.depth === 'medium');
            const longestSession = sessions.reduce((max, s) => Math.max(max, s.duration_seconds), 0);

            // Group by day for chart
            const dailyMap: Record<string, number> = {};
            sessions.forEach(s => {
                const date = s.created_at.split('T')[0];
                dailyMap[date] = (dailyMap[date] || 0) + s.duration_seconds / 3600;
            });
            const daily_hours = Object.entries(dailyMap)
                .map(([date, hours]) => ({ date, hours: Math.round(hours * 10) / 10 }))
                .sort((a, b) => a.date.localeCompare(b.date));

            const result: FocusStats = {
                total_focus_hours: Math.round(totalSeconds / 360) / 10,
                avg_session_minutes: sessions.length ? Math.round(totalSeconds / sessions.length / 60) : 0,
                deep_work_sessions: deepSessions.length,
                longest_session_minutes: Math.round(longestSession / 60),
                sessions: sessions.slice(0, 50),
                daily_hours,
            };

            return result;
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}
