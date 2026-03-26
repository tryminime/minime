/**
 * useCloudSyncSchedule.ts — React Query hooks for Phase 3b/3c sync features.
 *
 * Hooks:
 *   useSyncSchedule()      — GET  /api/v1/sync/schedule
 *   useUpdateSchedule()    — PUT  /api/v1/sync/schedule
 *   useTriggerSync()       — POST /api/v1/sync/trigger
 *   useSyncHistory()       — GET  /api/v1/sync/history
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';
import { toast } from 'sonner';

const BASE = '/api/v1/sync';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SyncSchedule {
    frequency: string;
    sync_time: string;
    last_synced_at: string | null;
    next_sync_at: string | null;
}

export interface SyncHistoryEntry {
    id: string;
    started_at: string;
    completed_at: string | null;
    status: string;        // running, completed, failed
    trigger: string;       // manual, scheduled
    results: Record<string, any> | null;
    error: string | null;
    records_synced: number;
}

export interface SyncTriggerResult {
    status: string;
    total_records: number;
    targets: Record<string, any>;
    errors: string[];
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useSyncSchedule() {
    const api = getAPIClient();
    return useQuery<SyncSchedule>({
        queryKey: ['cloud-sync', 'schedule'],
        queryFn: () => api.get<SyncSchedule>(`${BASE}/schedule`),
        staleTime: 30_000,
        retry: false,
    });
}

export function useUpdateSchedule() {
    const api = getAPIClient();
    const qc = useQueryClient();
    return useMutation<{ updated: boolean; frequency: string; sync_time: string }, Error, { frequency: string; sync_time: string }>({
        mutationFn: (body) => api.put(`${BASE}/schedule`, body),
        onSuccess: (res) => {
            toast.success(`Sync schedule updated to ${res.frequency.replace('_', ' ')}`);
            qc.invalidateQueries({ queryKey: ['cloud-sync'] });
        },
        onError: (err) => toast.error(`Failed to update schedule: ${err.message}`),
    });
}

export function useTriggerSync() {
    const api = getAPIClient();
    const qc = useQueryClient();
    return useMutation<SyncTriggerResult, Error, void>({
        mutationFn: () => api.post<SyncTriggerResult>(`${BASE}/trigger`, {}),
        onSuccess: (res) => {
            if (res.errors.length === 0) {
                toast.success(`Synced ${res.total_records} records across all targets`);
            } else {
                toast.warning(`Sync partially completed: ${res.errors.join('; ')}`);
            }
            qc.invalidateQueries({ queryKey: ['cloud-sync'] });
        },
        onError: (err) => toast.error(`Sync failed: ${err.message}`),
    });
}

export function useSyncHistory() {
    const api = getAPIClient();
    return useQuery<{ history: SyncHistoryEntry[]; count: number }>({
        queryKey: ['cloud-sync', 'history'],
        queryFn: () => api.get(`${BASE}/history`),
        staleTime: 5_000,
        retry: false,
        // Auto-poll every 3s while any entry is "running"
        refetchInterval: (query) => {
            const data = query.state.data as { history: SyncHistoryEntry[] } | undefined;
            const hasRunning = data?.history?.some((e: SyncHistoryEntry) => e.status === 'running');
            return hasRunning ? 3_000 : false;
        },
    });
}

export function useRestoreFromCloud() {
    const api = getAPIClient();
    const qc = useQueryClient();
    return useMutation<{ status: string; message: string }, Error, void>({
        mutationFn: () => api.post(`${BASE}/restore`, {}),
        onSuccess: () => {
            toast.success('Cloud restore started in background');
            qc.invalidateQueries({ queryKey: ['cloud-sync'] });
        },
        onError: (err) => toast.error(`Restore failed: ${err.message}`),
    });
}

