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
    // The /analytics/summary/history endpoint is not yet implemented on the backend.
    // Return a stable empty list so DigestSidebar renders the "No digests yet" empty state.
    return useQuery({
        queryKey: ['summary', 'history', 'stub'],
        queryFn: async (): Promise<{ digests: DigestListItem[]; total: number }> => ({
            digests: [],
            total: 0,
        }),
        staleTime: Infinity,
        retry: 0,
    });
}

export async function emailWeeklySummary(date: string): Promise<void> {
    const api = getAPIClient();
    await api.post('/api/v1/analytics/summary/weekly/email', { date });
}
