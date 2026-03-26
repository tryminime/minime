/**
 * useCloudSync.ts — React Query hooks for Phase 2 Cloud Sync
 *
 * Provides:
 *   useCloudSyncStatus()    — combined status for both providers
 *   useGDriveConnect()      — start Google Drive OAuth flow
 *   useGDriveDisconnect()
 *   useOneDriveConnect()    — start OneDrive OAuth flow
 *   useOneDriveDisconnect()
 *   useBackupNow()          — POST /api/v1/sync/backup
 *   useRestoreFromCloud()   — POST /api/v1/sync/{provider}/download
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';
import { toast } from 'sonner';

const BASE = '/api/v1/sync';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProviderStatus {
    connected: boolean;
    account?: { email: string; name: string };
    last_sync?: string;
    last_snapshot_size?: number;
    snapshot_count?: number;
}

export interface SyncStatus {
    encryption: { algorithm: string; key_fingerprint: string };
    providers: {
        gdrive: ProviderStatus;
        onedrive: ProviderStatus;
    };
}

export interface BackupResult {
    backed_up_at: string;
    results: Record<string, {
        success?: boolean; skipped?: boolean; error?: string;
        records_uploaded?: number; encrypted_size_bytes?: number; filename?: string
    }>;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

export function useCloudSyncStatus() {
    const api = getAPIClient();
    return useQuery<SyncStatus>({
        queryKey: ['cloud-sync', 'status'],
        queryFn: () => api.get<SyncStatus>(`${BASE}/status`),
        refetchInterval: 30_000,
        staleTime: 10_000,
    });
}

export function useGDriveConnect() {
    const api = getAPIClient();
    return useMutation({
        mutationFn: async () => {
            try {
                const res = await api.post<{ auth_url: string }>(`${BASE}/gdrive/connect`, {});
                return res.auth_url;
            } catch {
                // Fallback: construct OAuth URL client-side using the public client_id
                // This works even if the backend hasn't restarted yet.
                const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
                const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/sync/gdrive/callback`);
                const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.file');
                if (!clientId) throw new Error('Backend unavailable and NEXT_PUBLIC_GOOGLE_CLIENT_ID not set');
                return `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
            }
        },
        onSuccess: (auth_url) => {
            window.location.href = auth_url;
        },
        onError: (err: any) => {
            toast.error(`Could not start Google Drive connection: ${err?.message ?? 'Backend unavailable — restart the backend first'}`);
        },
    });
}


export function useGDriveDisconnect() {
    const api = getAPIClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => api.delete(`${BASE}/gdrive/disconnect`),
        onSuccess: () => {
            toast.success('Google Drive disconnected');
            qc.invalidateQueries({ queryKey: ['cloud-sync'] });
        },
        onError: () => toast.error('Failed to disconnect Google Drive'),
    });
}

export function useOneDriveConnect() {
    const api = getAPIClient();
    return useMutation({
        mutationFn: async () => {
            const res = await api.post<{ auth_url: string }>(`${BASE}/onedrive/connect`, {});
            return res;
        },
        onSuccess: ({ auth_url }) => {
            window.location.href = auth_url;
        },
        onError: () => toast.error('Could not start OneDrive connection'),
    });
}

export function useOneDriveDisconnect() {
    const api = getAPIClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => api.delete(`${BASE}/onedrive/disconnect`),
        onSuccess: () => {
            toast.success('OneDrive disconnected');
            qc.invalidateQueries({ queryKey: ['cloud-sync'] });
        },
        onError: () => toast.error('Failed to disconnect OneDrive'),
    });
}

export function useBackupNow() {
    const api = getAPIClient();
    const qc = useQueryClient();
    return useMutation<BackupResult, Error, { data?: unknown[] }>({
        mutationFn: (payload) =>
            api.post<BackupResult>(`${BASE}/backup`, {
                data: payload.data ?? [],
                incremental: true,
            }),
        onSuccess: (res) => {
            const ok = Object.values(res.results).filter((r) => r.success).length;
            const skip = Object.values(res.results).filter((r) => r.skipped).length;
            if (ok > 0) toast.success(`Backed up to ${ok} provider${ok > 1 ? 's' : ''}`);
            else if (skip > 0) toast.info('No providers connected — nothing to back up');
            qc.invalidateQueries({ queryKey: ['cloud-sync'] });
        },
        onError: () => toast.error('Backup failed'),
    });
}

export function useRestoreFromCloud(provider: 'gdrive' | 'onedrive') {
    const api = getAPIClient();
    return useMutation<{ records: unknown[]; filename: string; count: number }, Error, void>({
        mutationFn: () =>
            api.post<{ records: unknown[]; filename: string; count: number }>(
                `${BASE}/${provider}/download`,
                {}
            ),
        onSuccess: (res) => toast.success(`Restored ${res.count} records from ${res.filename}`),
        onError: () => toast.error('Restore failed'),
    });
}
