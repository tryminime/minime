'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';
import { useAuth } from '@/lib/hooks/useAuth';

export type IntegrationProvider = 'github' | 'google' | 'notion';

export interface IntegrationStatus {
    connected: boolean;
    username?: string;
    email?: string;
    last_synced?: string;
    error?: string;
}

/** Fetch connection status for a single provider */
export function useIntegrationStatus(provider: IntegrationProvider) {
    const api = getAPIClient();
    const { user } = useAuth();
    const userId = user?.id;

    return useQuery<IntegrationStatus>({
        queryKey: ['integration', provider, userId],
        queryFn: () =>
            api.get<IntegrationStatus>(
                `/api/integrations/${provider}/status${userId ? `?user_id=${userId}` : ''}`
            ),
        staleTime: 60 * 1000,
        retry: 1,
        enabled: true,
    });
}

/** Fetch status for all 3 supported providers at once */
export function useAllIntegrationStatuses() {
    const github = useIntegrationStatus('github');
    const google = useIntegrationStatus('google');
    const notion = useIntegrationStatus('notion');
    return { github, google, notion };
}

/** Initiate OAuth flow — opens the OAuth URL in a new tab */
export function useConnectIntegration() {
    const api = getAPIClient();

    return useMutation({
        mutationFn: async (provider: IntegrationProvider) => {
            const res = await api.post<{ auth_url: string }>(
                `/api/integrations/${provider}/oauth/initiate`,
                {}
            );
            if (res.auth_url) {
                window.open(res.auth_url, '_blank', 'noopener,noreferrer');
            }
            return res;
        },
    });
}

/** Disconnect an integration */
export function useDisconnectIntegration() {
    const api = getAPIClient();
    const qc = useQueryClient();
    const { user } = useAuth();
    const userId = user?.id;

    return useMutation({
        mutationFn: (provider: IntegrationProvider) =>
            api.delete<{ success: boolean }>(
                `/api/integrations/${provider}/disconnect${userId ? `?user_id=${userId}` : ''}`
            ),
        onSuccess: (_data, provider) => {
            qc.invalidateQueries({ queryKey: ['integration', provider] });
        },
    });
}
