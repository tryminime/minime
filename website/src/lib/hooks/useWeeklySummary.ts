'use client';

import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '../api';

export interface WeeklySummary {
    week_start: string;
    week_end: string;
    html_content: string;
    summary_stats: {
        total_activities: number;
        focus_score: number;
        productivity_score: number;
        collaboration_index: number;
        top_skills: string[];
        key_achievements: string[];
    };
}

export interface DigestListItem {
    id: string;
    week_start: string;
    week_end: string;
    created_at: string;
}

export function useWeeklySummary(date?: string) {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['summary', 'weekly', date],
        queryFn: () => {
            const url = date
                ? `/api/v1/analytics/summary/weekly?date=${date}`
                : '/api/v1/analytics/summary/weekly';
            return api.get<WeeklySummary>(url);
        },
        staleTime: 60 * 60 * 1000, // 1 hour (digests don't change often)
        retry: 2,
    });
}

export function useDigestHistory(_page: number = 1, _pageSize: number = 10) {
    // Generate past 8 weeks of dates so sidebar is populated.
    // Each entry points to a week that the existing /summary/weekly?date= endpoint can serve.
    return useQuery({
        queryKey: ['summary', 'history', 'generated'],
        queryFn: async (): Promise<{ digests: DigestListItem[]; total: number }> => {
            const digests: DigestListItem[] = [];
            const now = new Date();
            // Find last Monday
            const dayOfWeek = now.getDay();
            const lastMonday = new Date(now);
            lastMonday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            lastMonday.setHours(0, 0, 0, 0);

            for (let i = 0; i < 8; i++) {
                const weekStart = new Date(lastMonday);
                weekStart.setDate(lastMonday.getDate() - i * 7);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                digests.push({
                    id: `week-${i}`,
                    week_start: weekStart.toISOString().split('T')[0],
                    week_end: weekEnd.toISOString().split('T')[0],
                    created_at: weekEnd.toISOString(),
                });
            }

            return { digests, total: digests.length };
        },
        staleTime: Infinity,
        retry: 0,
    });
}

export async function emailWeeklySummary(date: string): Promise<void> {
    // TODO: Backend route POST /api/v1/analytics/summary/weekly/email does not exist yet
    console.warn('emailWeeklySummary: backend route not implemented');
}
