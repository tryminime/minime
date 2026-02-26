import { getAPIClient, APIError } from './api';
import { Settings } from '../types/settings';

/**
 * Settings API service for backend synchronization
 */
class SettingsAPIService {
    private client = getAPIClient();
    private isBackendAvailable = false;

    /**
     * Check if backend is available
     */
    async checkBackend(): Promise<boolean> {
        try {
            this.isBackendAvailable = await this.client.checkHealth();
            return this.isBackendAvailable;
        } catch (error) {
            this.isBackendAvailable = false;
            return false;
        }
    }

    /**
     * Fetch all settings from backend
     */
    async fetchSettings(): Promise<Settings | null> {
        try {
            const settings = await this.client.get<Settings>('/api/settings');
            return settings;
        } catch (error) {
            console.error('Failed to fetch settings from backend:', error);
            return null;
        }
    }

    /**
     * Update profile settings
     */
    async updateProfile(profile: Settings['profile']): Promise<void> {
        try {
            await this.client.put('/api/settings/profile', profile);
        } catch (error) {
            throw this.handleError('Failed to update profile', error);
        }
    }

    /**
     * Update tracking settings
     */
    async updateTracking(tracking: Settings['activityTracking']): Promise<void> {
        try {
            await this.client.put('/api/settings/tracking', tracking);
        } catch (error) {
            throw this.handleError('Failed to update tracking settings', error);
        }
    }

    /**
     * Update focus settings
     */
    async updateFocus(focus: Settings['focus']): Promise<void> {
        try {
            await this.client.put('/api/settings/focus', focus);
        } catch (error) {
            throw this.handleError('Failed to update focus settings', error);
        }
    }

    /**
     * Update privacy settings
     */
    async updatePrivacy(privacy: Settings['privacy']): Promise<void> {
        try {
            await this.client.put('/api/settings/privacy', privacy);
        } catch (error) {
            throw this.handleError('Failed to update privacy settings', error);
        }
    }

    /**
     * Update notification settings
     */
    async updateNotifications(notifications: Settings['notifications']): Promise<void> {
        try {
            await this.client.put('/api/settings/notifications', notifications);
        } catch (error) {
            throw this.handleError('Failed to update notification settings', error);
        }
    }

    /**
     * Change password
     */
    async changePassword(oldPassword: string, newPassword: string): Promise<void> {
        try {
            await this.client.post('/api/settings/auth/change-password', {
                old_password: oldPassword,
                new_password: newPassword,
            });
        } catch (error) {
            throw this.handleError('Failed to change password', error);
        }
    }

    /**
     * Enable 2FA
     */
    async enable2FA(): Promise<{ secret: string; qr_code_uri: string; backup_codes: string[] }> {
        try {
            return await this.client.post('/api/settings/auth/2fa/enable');
        } catch (error) {
            throw this.handleError('Failed to enable 2FA', error);
        }
    }

    /**
     * Disable 2FA
     */
    async disable2FA(code: string): Promise<void> {
        try {
            await this.client.post('/api/settings/auth/2fa/disable', { code });
        } catch (error) {
            throw this.handleError('Failed to disable 2FA', error);
        }
    }

    /**
     * Create backup
     */
    async createBackup(): Promise<{ message: string; backup_id: string }> {
        try {
            return await this.client.post('/api/settings/backups/create');
        } catch (error) {
            throw this.handleError('Failed to create backup', error);
        }
    }

    /**
     * Get list of backups
     */
    async getBackups(): Promise<Array<{ id: string; created_at: string; size_mb: number }>> {
        try {
            const response = await this.client.get<{ backups: Array<any> }>('/api/settings/backups');
            return response.backups;
        } catch (error) {
            throw this.handleError('Failed to fetch backups', error);
        }
    }

    /**
     * Export data
     */
    async exportData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
        try {
            const response = await this.client.get(`/api/settings/data/export?format=${format}`, {
                responseType: 'blob',
            });
            return response as any as Blob;
        } catch (error) {
            throw this.handleError('Failed to export data', error);
        }
    }

    /**
     * Sync all settings to backend
     */
    async syncSettings(settings: Settings): Promise<void> {
        try {
            await Promise.all([
                this.updateProfile(settings.profile),
                this.updateTracking(settings.activityTracking),
                this.updateFocus(settings.focus),
                this.updatePrivacy(settings.privacy),
                this.updateNotifications(settings.notifications),
            ]);
        } catch (error) {
            throw this.handleError('Failed to sync settings', error);
        }
    }

    /**
     * Handle errors
     */
    private handleError(message: string, error: any): Error {
        const apiError = error as APIError;
        const errorMessage = apiError?.message || message;
        console.error(message, error);
        return new Error(errorMessage);
    }
}

// Singleton instance
let settingsAPIInstance: SettingsAPIService | null = null;

/**
 * Get settings API service singleton
 */
export function getSettingsAPI(): SettingsAPIService {
    if (!settingsAPIInstance) {
        settingsAPIInstance = new SettingsAPIService();
    }
    return settingsAPIInstance;
}

export default getSettingsAPI;
