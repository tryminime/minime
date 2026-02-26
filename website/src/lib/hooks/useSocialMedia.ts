'use client';

import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '../api';
import { ActivityItem } from './useActivities';

export interface SocialPlatform {
    name: string;
    domain: string;
    time_minutes: number;
    visit_count: number;
}

export interface SocialMediaStats {
    total_time_minutes: number;
    total_visits: number;
    platforms: SocialPlatform[];
    daily_minutes: { date: string; minutes: number }[];
}

export function useSocialMedia() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['activities', 'social-media'],
        queryFn: async () => {
            const data = await api.get<{ activities: ActivityItem[] }>('/api/v1/activities?type=social_media&limit=500');
            const activities = data.activities || [];

            // Group by domain/app
            const platformMap: Record<string, { time: number; count: number; domain: string }> = {};
            activities.forEach(a => {
                const key = a.domain || a.app || 'Unknown';
                const name = key.replace(/^www\./, '').replace(/\.com$/, '').replace(/\.org$/, '');
                if (!platformMap[name]) {
                    platformMap[name] = { time: 0, count: 0, domain: key };
                }
                platformMap[name].time += (a.duration_seconds || 0);
                platformMap[name].count += 1;
            });

            const platforms: SocialPlatform[] = Object.entries(platformMap)
                .map(([name, info]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    domain: info.domain,
                    time_minutes: Math.round(info.time / 60),
                    visit_count: info.count,
                }))
                .sort((a, b) => b.time_minutes - a.time_minutes);

            // Group by day
            const dailyMap: Record<string, number> = {};
            activities.forEach(a => {
                const date = a.created_at.split('T')[0];
                dailyMap[date] = (dailyMap[date] || 0) + (a.duration_seconds || 0) / 60;
            });
            const daily_minutes = Object.entries(dailyMap)
                .map(([date, minutes]) => ({ date, minutes: Math.round(minutes) }))
                .sort((a, b) => a.date.localeCompare(b.date));

            const totalSeconds = activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);

            const result: SocialMediaStats = {
                total_time_minutes: Math.round(totalSeconds / 60),
                total_visits: activities.length,
                platforms,
                daily_minutes,
            };

            return result;
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}
