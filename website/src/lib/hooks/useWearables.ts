'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '../api';

export interface WearableProvider {
    provider: string;
    name: string;
    connected: boolean;
    device_name: string | null;
    last_synced: string | null;
    is_active: boolean;
}

export interface WearableDataPoint {
    metric_type: string;
    metric_value: number;
    metric_unit: string | null;
    recorded_at: string;
}

export interface WearableDataResponse {
    provider: string;
    metrics: Record<string, any>[];
    period_days: number;
    total_data_points: number;
}

export function useWearableStatus() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['wearables', 'status'],
        queryFn: () => api.get<WearableProvider[]>('/api/v1/wearables/status'),
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}

export function useWearableData(provider?: string, days: number = 7) {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['wearables', 'data', provider, days],
        queryFn: () => {
            const params = new URLSearchParams({ days: String(days) });
            if (provider) params.set('provider', provider);
            return api.get<WearableDataResponse>(`/api/v1/wearables/data?${params.toString()}`);
        },
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useDisconnectWearable() {
    const api = getAPIClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (provider: string) =>
            api.delete(`/api/v1/wearables/${provider}/disconnect`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wearables'] });
        },
    });
}
