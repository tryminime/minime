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
            if (days <= 7) {
                // The weekly endpoint already returns daily_metrics for the current week
                const weekly = await api.get<ProductivityWeekly>(
                    '/api/v1/analytics/productivity/weekly'
                );
                // Return daily_metrics sorted chronologically
                return (weekly.daily_metrics || []);
            }

            // For longer ranges, use the daily-range endpoint
            const result = await api.get<{ metrics: ProductivityMetrics[] }>(
                `/api/v1/analytics/productivity/daily-range?days=${days}`
            );
            return result.metrics || [];
        },
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}
