/**
 * useExport.ts — React hooks for Phase 4b encrypted export/import.
 *
 * Hooks:
 *   useExportDownload()  — POST /api/v1/export/download
 *   useExportUpload()    — POST /api/v1/export/upload
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';
import { toast } from 'sonner';

const BASE = '/api/v1/export';

export function useExportDownload() {
    return useMutation<void, Error, string>({
        mutationFn: async (password: string) => {
            const api = getAPIClient();
            const token = localStorage.getItem('minime_auth_token');
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${BASE}/download`;

            const formData = new FormData();
            formData.append('password', password);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: 'Export failed' }));
                throw new Error(err.detail || 'Export failed');
            }

            // Download the file
            const blob = await response.blob();
            const disposition = response.headers.get('Content-Disposition');
            const filenameMatch = disposition?.match(/filename="(.+)"/);
            const filename = filenameMatch?.[1] || 'minime_export.mmexport';

            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        },
        onSuccess: () => {
            toast.success('Export downloaded successfully');
        },
        onError: (err) => toast.error(`Export failed: ${err.message}`),
    });
}

export interface ImportResult {
    success: boolean;
    total_imported: number;
    tables: Record<string, number>;
    neo4j_imported: number;
    qdrant_imported: number;
    exported_at: string;
    schema_version: string;
}

export function useExportUpload() {
    return useMutation<ImportResult, Error, { password: string; file: File }>({
        mutationFn: async ({ password, file }) => {
            const token = localStorage.getItem('minime_auth_token');
            const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${BASE}/upload`;

            const formData = new FormData();
            formData.append('password', password);
            formData.append('file', file);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ detail: 'Import failed' }));
                throw new Error(err.detail || 'Import failed');
            }

            return response.json();
        },
        onSuccess: (res) => {
            toast.success(`Imported ${res.total_imported} records successfully`);
        },
        onError: (err) => toast.error(`Import failed: ${err.message}`),
    });
}
