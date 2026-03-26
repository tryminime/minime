'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '../api';

export interface ScreenshotMeta {
    id: string;
    width: number;
    height: number;
    monitor_name: string;
    label: string | null;
    file_size_bytes: number;
    created_at: string;
}

export interface ScreenshotListResponse {
    screenshots: ScreenshotMeta[];
    total: number;
    limit: number;
    offset: number;
}

export function useScreenshots(limit: number = 20, offset: number = 0) {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['screenshots', limit, offset],
        queryFn: () =>
            api.get<ScreenshotListResponse>(
                `/api/v1/screenshots?limit=${limit}&offset=${offset}`
            ),
        staleTime: 60 * 1000,
        refetchInterval: 60 * 1000,
        retry: 2,
    });
}

export function useDeleteScreenshot() {
    const api = getAPIClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (screenshotId: string) =>
            api.delete(`/api/v1/screenshots/${screenshotId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screenshots'] });
        },
    });
}

export function useDeleteAllScreenshots() {
    const api = getAPIClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => api.delete('/api/v1/screenshots'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['screenshots'] });
        },
    });
}
