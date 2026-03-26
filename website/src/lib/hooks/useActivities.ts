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
    data: {
        started_at?: string;
        ended_at?: string;
        file_path?: string;
        file_name?: string;
        file_type?: string;
        files?: { path: string; name: string; type: string; content_preview?: string }[];
        working_directory?: string;
        content_summary?: string;
        is_focused?: boolean;
        device_id?: string;
        pid?: number;
    } | null;
    context?: {
        url?: string;
        domain?: string;
        title?: string;
        app_name?: string;
        reading?: {
            scroll_depth_pct?: number;
            time_on_page_sec?: number;
            word_count?: number;
            estimated_read_time_sec?: number;
            estimated_read_pct?: number;
            selection_count?: number;
            user_interacted?: boolean;
        };
        [key: string]: any;
    } | null;
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
        staleTime: 30 * 1000,
        refetchInterval: 30 * 1000,
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

export function useBulkDeleteActivities() {
    const api = getAPIClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (activityIds: string[]) =>
            api.post('/api/v1/activities/bulk-delete', { activity_ids: activityIds }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['activities'] });
        },
    });
}
