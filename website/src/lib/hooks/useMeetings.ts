'use client';

import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '../api';
import { ActivityItem } from './useActivities';

export interface MeetingItem {
    id: string;
    title: string;
    platform: string;
    duration_minutes: number;
    created_at: string;
}

export interface MeetingStats {
    total_meetings: number;
    total_hours: number;
    meetings_today: number;
    avg_duration_minutes: number;
    meetings: MeetingItem[];
    daily_count: { date: string; count: number; hours: number }[];
}

export function useMeetings() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['activities', 'meetings'],
        queryFn: async () => {
            const data = await api.get<{ activities: ActivityItem[] }>('/api/v1/activities?type=meeting&limit=200');
            const activities = data.activities || [];

            const today = new Date().toISOString().split('T')[0];

            const meetings: MeetingItem[] = activities.map(a => ({
                id: a.id,
                title: a.title || 'Meeting',
                platform: a.app || a.domain || 'Unknown',
                duration_minutes: Math.round((a.duration_seconds || 0) / 60),
                created_at: a.created_at,
            }));

            const totalSeconds = activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
            const meetingsToday = meetings.filter(m => m.created_at.startsWith(today)).length;

            // Group by day
            const dailyMap: Record<string, { count: number; seconds: number }> = {};
            activities.forEach(a => {
                const date = a.created_at.split('T')[0];
                if (!dailyMap[date]) dailyMap[date] = { count: 0, seconds: 0 };
                dailyMap[date].count += 1;
                dailyMap[date].seconds += (a.duration_seconds || 0);
            });
            const daily_count = Object.entries(dailyMap)
                .map(([date, info]) => ({
                    date,
                    count: info.count,
                    hours: Math.round(info.seconds / 360) / 10,
                }))
                .sort((a, b) => a.date.localeCompare(b.date));

            const result: MeetingStats = {
                total_meetings: meetings.length,
                total_hours: Math.round(totalSeconds / 360) / 10,
                meetings_today: meetingsToday,
                avg_duration_minutes: meetings.length
                    ? Math.round(totalSeconds / meetings.length / 60)
                    : 0,
                meetings: meetings.slice(0, 50),
                daily_count,
            };

            return result;
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}
