'use client';

import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '../api';

export interface ProductivityMetrics {
    date: string;
    focus_score: number;
    productivity_score: number;
    deep_work_sessions: number;
    meeting_load_hours: number;
    context_switches: number;
    activity_count: number;
}

export interface ProductivityWeekly {
    week_start: string;
    week_end: string;
    avg_focus_score: number;
    avg_productivity_score: number;
    total_deep_work_hours: number;
    total_meeting_hours: number;
    total_activities: number;
    daily_metrics: ProductivityMetrics[];
}

export function useProductivityDaily(date?: string) {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['productivity', 'daily', date],
        queryFn: async () => {
            const url = date
                ? `/api/v1/analytics/productivity/daily?date=${date}`
                : '/api/v1/analytics/productivity/daily';
            return api.get<ProductivityMetrics>(url);
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });
}

export function useProductivityWeekly() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['productivity', 'weekly'],
        queryFn: () => api.get<ProductivityWeekly>('/api/v1/analytics/productivity/weekly'),
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: 2,
    });
}

export function useProductivityTrend(days: number = 7) {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['productivity', 'trend', days],
        queryFn: async () => {
            // Fetch last N days of metrics
            const promises = [];
            const today = new Date();

            for (let i = 0; i < days; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                promises.push(
                    api.get<ProductivityMetrics>(`/api/v1/analytics/productivity/daily?date=${dateStr}`)
                        .catch(() => null) // Handle missing data gracefully
                );
            }

            const results = await Promise.all(promises);
            return results.filter(Boolean).reverse(); // Remove nulls and reverse to chronological
        },
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}
