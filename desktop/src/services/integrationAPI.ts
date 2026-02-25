/**
 * Integration API Service
 * Handles OAuth flows and integration management for GitHub, Google Calendar, and Notion
 */

import { getAPIClient } from './api';

// Types
export interface IntegrationAuth {
    provider: 'github' | 'google' | 'notion';
    connected: boolean;
    username?: string;
    email?: string;
    access_token?: string;
    expires_at?: string;
}

export interface IntegrationStatus {
    connected: boolean;
    username?: string;
    email?: string;
    last_synced?: string;
    error?: string;
}

export interface Repository {
    id: number;
    name: string;
    full_name: string;
    description?: string;
    url: string;
    language?: string;
    stars: number;
    private: boolean;
}

export interface Calendar {
    id: string;
    name: string;
    description?: string;
    primary: boolean;
    color?: string;
}

export interface NotionDatabase {
    id: string;
    title: string;
    description?: string;
    url: string;
}

class IntegrationAPIService {
    private client = getAPIClient();

    /**
     * GitHub OAuth Flow
     */
    async initiateGitHubOAuth(): Promise<{ auth_url: string }> {
        try {
            const response = await this.client.post<{ auth_url: string }>(
                '/api/integrations/github/oauth/initiate'
            );
            return response;
        } catch (error) {
            throw this.handleError('Failed to initiate GitHub OAuth', error);
        }
    }

    async handleGitHubCallback(code: string): Promise<IntegrationAuth> {
        try {
            const response = await this.client.post<IntegrationAuth>(
                '/api/integrations/github/oauth/callback',
                { code }
            );
            return response;
        } catch (error) {
            throw this.handleError('Failed to complete GitHub OAuth', error);
        }
    }

    async disconnectGitHub(): Promise<void> {
        try {
            await this.client.delete('/api/integrations/github/disconnect');
        } catch (error) {
            throw this.handleError('Failed to disconnect GitHub', error);
        }
    }

    async getGitHubStatus(): Promise<IntegrationStatus> {
        try {
            const response = await this.client.get<IntegrationStatus>(
                '/api/integrations/github/status'
            );
            return response;
        } catch (error) {
            throw this.handleError('Failed to get GitHub status', error);
        }
    }

    async getGitHubRepos(): Promise<Repository[]> {
        try {
            const response = await this.client.get<{ repositories: Repository[] }>(
                '/api/integrations/github/repos'
            );
            return response.repositories || [];
        } catch (error) {
            throw this.handleError('Failed to fetch GitHub repositories', error);
        }
    }

    async trackGitHubRepo(repoFullName: string): Promise<void> {
        try {
            await this.client.post('/api/integrations/github/repos/track', {
                repository: repoFullName,
            });
        } catch (error) {
            throw this.handleError('Failed to track repository', error);
        }
    }

    async untrackGitHubRepo(repoFullName: string): Promise<void> {
        try {
            await this.client.delete(`/api/integrations/github/repos/${encodeURIComponent(repoFullName)}`);
        } catch (error) {
            throw this.handleError('Failed to untrack repository', error);
        }
    }

    /**
     * Google Calendar OAuth Flow
     */
    async initiateGoogleOAuth(): Promise<{ auth_url: string }> {
        try {
            const response = await this.client.post<{ auth_url: string }>(
                '/api/integrations/google/oauth/initiate'
            );
            return response;
        } catch (error) {
            throw this.handleError('Failed to initiate Google OAuth', error);
        }
    }

    async handleGoogleCallback(code: string): Promise<IntegrationAuth> {
        try {
            const response = await this.client.post<IntegrationAuth>(
                '/api/integrations/google/oauth/callback',
                { code }
            );
            return response;
        } catch (error) {
            throw this.handleError('Failed to complete Google OAuth', error);
        }
    }

    async disconnectGoogle(): Promise<void> {
        try {
            await this.client.delete('/api/integrations/google/disconnect');
        } catch (error) {
            throw this.handleError('Failed to disconnect Google', error);
        }
    }

    async getGoogleStatus(): Promise<IntegrationStatus> {
        try {
            const response = await this.client.get<IntegrationStatus>(
                '/api/integrations/google/status'
            );
            return response;
        } catch (error) {
            throw this.handleError('Failed to get Google status', error);
        }
    }

    async getGoogleCalendars(): Promise<Calendar[]> {
        try {
            const response = await this.client.get<{ calendars: Calendar[] }>(
                '/api/integrations/google/calendars'
            );
            return response.calendars || [];
        } catch (error) {
            throw this.handleError('Failed to fetch Google calendars', error);
        }
    }

    /**
     * Notion OAuth Flow
     */
    async initiateNotionOAuth(): Promise<{ auth_url: string }> {
        try {
            const response = await this.client.post<{ auth_url: string }>(
                '/api/integrations/notion/oauth/initiate'
            );
            return response;
        } catch (error) {
            throw this.handleError('Failed to initiate Notion OAuth', error);
        }
    }

    async handleNotionCallback(code: string): Promise<IntegrationAuth> {
        try {
            const response = await this.client.post<IntegrationAuth>(
                '/api/integrations/notion/oauth/callback',
                { code }
            );
            return response;
        } catch (error) {
            throw this.handleError('Failed to complete Notion OAuth', error);
        }
    }

    async disconnectNotion(): Promise<void> {
        try {
            await this.client.delete('/api/integrations/notion/disconnect');
        } catch (error) {
            throw this.handleError('Failed to disconnect Notion', error);
        }
    }

    async getNotionStatus(): Promise<IntegrationStatus> {
        try {
            const response = await this.client.get<IntegrationStatus>(
                '/api/integrations/notion/status'
            );
            return response;
        } catch (error) {
            throw this.handleError('Failed to get Notion status', error);
        }
    }

    async getNotionDatabases(): Promise<NotionDatabase[]> {
        try {
            const response = await this.client.get<{ databases: NotionDatabase[] }>(
                '/api/integrations/notion/databases'
            );
            return response.databases || [];
        } catch (error) {
            throw this.handleError('Failed to fetch Notion databases', error);
        }
    }

    /**
     * Generic OAuth Callback Handler
     */
    async handleOAuthCallback(
        provider: 'github' | 'google' | 'notion',
        code: string
    ): Promise<IntegrationAuth> {
        switch (provider) {
            case 'github':
                return await this.handleGitHubCallback(code);
            case 'google':
                return await this.handleGoogleCallback(code);
            case 'notion':
                return await this.handleNotionCallback(code);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    /**
     * Disconnect Integration
     */
    async disconnectIntegration(provider: 'github' | 'google' | 'notion'): Promise<void> {
        switch (provider) {
            case 'github':
                return await this.disconnectGitHub();
            case 'google':
                return await this.disconnectGoogle();
            case 'notion':
                return await this.disconnectNotion();
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    /**
     * Get Integration Status
     */
    async getIntegrationStatus(
        provider: 'github' | 'google' | 'notion'
    ): Promise<IntegrationStatus> {
        switch (provider) {
            case 'github':
                return await this.getGitHubStatus();
            case 'google':
                return await this.getGoogleStatus();
            case 'notion':
                return await this.getNotionStatus();
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    /**
     * Error Handler
     */
    private handleError(message: string, error: any): Error {
        const apiError = error as { message?: string };
        const errorMessage = apiError?.message || message;
        console.error(message, error);
        return new Error(errorMessage);
    }
}

// Singleton instance
let integrationAPIInstance: IntegrationAPIService | null = null;

export function getIntegrationAPI(): IntegrationAPIService {
    if (!integrationAPIInstance) {
        integrationAPIInstance = new IntegrationAPIService();
    }
    return integrationAPIInstance;
}

export default IntegrationAPIService;
