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
    if (durationSeconds >= 1800) return 'deep';     // 30+ min
    if (durationSeconds >= 600) return 'medium';    // 10+ min
    return 'shallow';                               // 2+ min
}

export function useFocusSessions() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['activities', 'focus-sessions'],
        queryFn: async () => {
            // Fetch all activity types including legacy page_view
            const [windowFocus, appFocus, webVisit, pageView] = await Promise.all([
                api.get<{ activities: ActivityItem[] }>('/api/v1/activities/?type=window_focus&limit=200').catch(() => ({ activities: [] })),
                api.get<{ activities: ActivityItem[] }>('/api/v1/activities/?type=app_focus&limit=200').catch(() => ({ activities: [] })),
                api.get<{ activities: ActivityItem[] }>('/api/v1/activities/?type=web_visit&limit=200').catch(() => ({ activities: [] })),
                api.get<{ activities: ActivityItem[] }>('/api/v1/activities/?type=page_view&limit=200').catch(() => ({ activities: [] })),
            ]);

            const allActivities = [
                ...(windowFocus.activities || []),
                ...(appFocus.activities || []),
                ...(webVisit.activities || []),
                ...(pageView.activities || []),
            ];

            // Filter to focus sessions (>= 2 min)
            const focusActivities = allActivities.filter(a => (a.duration_seconds || 0) >= 120);

            // Deduplicate: active-session sync creates multiple entries for the same app.
            // Group by app+title within 5-minute windows and keep the longest duration.
            const deduped: ActivityItem[] = [];
            const seen = new Map<string, ActivityItem>();
            focusActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            for (const a of focusActivities) {
                const key = `${a.app || a.domain || ''}::${a.title || ''}`;
                const existing = seen.get(key);
                if (existing) {
                    const timeDiff = Math.abs(new Date(a.created_at).getTime() - new Date(existing.created_at).getTime());
                    if (timeDiff < 5 * 60 * 1000) {
                        // Same session window — keep the one with longer duration
                        if ((a.duration_seconds || 0) > (existing.duration_seconds || 0)) {
                            const idx = deduped.indexOf(existing);
                            if (idx >= 0) deduped[idx] = a;
                            seen.set(key, a);
                        }
                        continue;
                    }
                }
                seen.set(key, a);
                deduped.push(a);
            }

            const sessions: FocusSession[] = deduped.map(a => ({
                id: a.id,
                app: a.app || a.domain || 'Unknown',
                title: a.title || 'Focus session',
                duration_seconds: a.duration_seconds || 0,
                depth: classifyDepth(a.duration_seconds || 0),
                created_at: a.created_at,
            }));

            const totalSeconds = sessions.reduce((sum, s) => sum + s.duration_seconds, 0);
            const deepSessions = sessions.filter(s => s.depth === 'deep' || s.depth === 'medium');
            const longestSession = sessions.reduce((max, s) => Math.max(max, s.duration_seconds), 0);

            // Group by day for chart
            const last7Days: string[] = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                last7Days.push(dateStr);
            }

            const dailyMap: Record<string, number> = {};
            last7Days.forEach(d => dailyMap[d] = 0);

            sessions.forEach(s => {
                const d = new Date(s.created_at);
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                if (dateStr in dailyMap) {
                    dailyMap[dateStr] += s.duration_seconds / 3600;
                }
            });

            const daily_hours = last7Days.map(date => ({ 
                date, 
                hours: Math.round(dailyMap[date] * 10) / 10 
            }));

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
        staleTime: 60 * 1000,
        refetchInterval: 60 * 1000,
        retry: 2,
    });
}
