'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AdminUser {
    id: string;
    email: string;
    full_name: string | null;
    tier: string;
    subscription_status: string;
    is_superadmin: boolean;
    email_verified: boolean;
    activity_count: number;
    last_activity: string | null;
    created_at: string | null;
}

export interface PlatformOverview {
    total_users: number;
    active_users_7d: number;
    total_activities: number;
    total_sessions: number;
    tier_distribution: Record<string, number>;
    status_distribution: Record<string, number>;
    signup_trend: { date: string; count: number }[];
}

export interface SubscriptionData {
    tier_distribution: Record<string, number>;
    status_distribution: Record<string, number>;
    mrr_estimate: number;
    churned_users: number;
    pricing_tiers: Record<string, number>;
}

export interface RegionData {
    ip_distribution: { ip: string; user_count: number }[];
    browser_distribution: Record<string, number>;
    total_sessions_with_ip: number;
}

export interface TokenData {
    total_content_items: number;
    total_activities: number;
    content_by_user: { email: string; content_count: number }[];
    activity_by_user: { email: string; activity_count: number }[];
    estimated_tokens: number;
}

export interface SystemHealth {
    services: Record<string, { status: string; latency_ms?: number; error?: string; users?: number; activities?: number }>;
    timestamp: string;
}

export interface UserListResponse {
    users: AdminUser[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// ─── Hooks ──────────────────────────────────────────────────────────────────────

export function useAdminOverview() {
    const api = getAPIClient();
    return useQuery<PlatformOverview>({
        queryKey: ['admin', 'overview'],
        queryFn: () => api.get('/api/v1/admin/stats/overview'),
        staleTime: 30_000,
    });
}

export function useAdminUsers(params: {
    search?: string;
    tier?: string;
    status?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_dir?: string;
}) {
    const api = getAPIClient();
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.tier) searchParams.set('tier', params.tier);
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.page_size) searchParams.set('page_size', String(params.page_size));
    if (params.sort_by) searchParams.set('sort_by', params.sort_by);
    if (params.sort_dir) searchParams.set('sort_dir', params.sort_dir);

    return useQuery<UserListResponse>({
        queryKey: ['admin', 'users', params],
        queryFn: () => api.get(`/api/v1/admin/users?${searchParams.toString()}`),
        staleTime: 15_000,
    });
}

export function useAdminSubscriptions() {
    const api = getAPIClient();
    return useQuery<SubscriptionData>({
        queryKey: ['admin', 'subscriptions'],
        queryFn: () => api.get('/api/v1/admin/subscriptions'),
        staleTime: 60_000,
    });
}

export function useAdminRegions() {
    const api = getAPIClient();
    return useQuery<RegionData>({
        queryKey: ['admin', 'regions'],
        queryFn: () => api.get('/api/v1/admin/regions'),
        staleTime: 60_000,
    });
}

export function useAdminTokens() {
    const api = getAPIClient();
    return useQuery<TokenData>({
        queryKey: ['admin', 'tokens'],
        queryFn: () => api.get('/api/v1/admin/tokens'),
        staleTime: 60_000,
    });
}

export function useAdminHealth() {
    const api = getAPIClient();
    return useQuery<SystemHealth>({
        queryKey: ['admin', 'health'],
        queryFn: () => api.get('/api/v1/admin/system/health'),
        staleTime: 10_000,
        refetchInterval: 30_000,
    });
}

export function useUpdateUser() {
    const api = getAPIClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: { userId: string; tier?: string; subscription_status?: string; is_superadmin?: boolean }) => {
            const searchParams = new URLSearchParams();
            if (params.tier) searchParams.set('tier', params.tier);
            if (params.subscription_status) searchParams.set('subscription_status', params.subscription_status);
            if (params.is_superadmin !== undefined) searchParams.set('is_superadmin', String(params.is_superadmin));
            return api.patch(`/api/v1/admin/users/${params.userId}?${searchParams.toString()}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
        },
    });
}

export function useDeleteUser() {
    const api = getAPIClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => api.delete(`/api/v1/admin/users/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
        },
    });
}
