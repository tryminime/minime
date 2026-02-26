'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '../api';

export interface ActivityItem {
    id: string;
    type: string;
    source: string | null;
    app: string | null;
    title: string | null;
    domain: string | null;
    duration_seconds: number | null;
    created_at: string;
}

export interface ActivityListResponse {
    activities: ActivityItem[];
    total: number;
    limit: number;
    offset: number;
}

export function useActivities(type?: string, limit: number = 100, offset: number = 0) {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['activities', type, limit, offset],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('limit', String(limit));
            params.set('offset', String(offset));
            if (type && type !== 'all') {
                params.set('type', type);
            }
            return api.get<ActivityListResponse>(`/api/v1/activities?${params.toString()}`);
        },
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });
}

export function useDeleteActivity() {
    const api = getAPIClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (activityId: string) => api.delete(`/api/v1/activities/${activityId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
    });
}
