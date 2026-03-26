// Sync manager for backend communication
import { StorageManager } from './storage.js';

export class SyncManager {
    static BATCH_SIZE = 100;

    static async getApiUrl() {
        try {
            const { apiUrl } = await chrome.storage.local.get('apiUrl');
            return (apiUrl || 'http://localhost:8000').replace(/\/$/, '');
        } catch (_) {
            return 'http://localhost:8000';
        }
    }

    static async sync() {
        try {
            const activities = await StorageManager.getUnsyncedActivities(this.BATCH_SIZE);

            if (activities.length === 0) {
                console.log('No activities to sync');
                return { success: true, synced: 0 };
            }

            const token = await this.getAuthToken();

            if (!token) {
                console.warn('No auth token, skipping sync');
                return { success: false, error: 'Not authenticated' };
            }

            // Map legacy/internal type names → backend enum values
            const TYPE_MAP = {
                'WebBrowsing': 'web_visit',
                'WebVisit': 'web_visit',
                'web_browsing': 'web_visit',
                'browsing': 'web_visit',
                'SocialMedia': 'web_visit',
                'AppFocus': 'app_focus',
                'AppSwitch': 'app_focus',
                'WindowFocus': 'window_focus',
                'Meeting': 'meeting',
                'VideoCall': 'meeting',
                'MeetingPlatform': 'meeting',
                'FileEdit': 'file_edit',
                'Commit': 'commit',
            };

            const payload = {
                source: 'browser',
                source_version: chrome.runtime.getManifest().version,
                activities: activities.map(a => ({
                    client_generated_id: a.id,
                    type: TYPE_MAP[a.activityType] || a.activityType || 'web_visit',
                    occurred_at: a.timestamp,
                    duration_seconds: a.durationSeconds,
                    context: {
                        url: a.url,
                        domain: a.domain,
                        title: a.windowTitle
                    },
                    metadata: {
                        idle: a.isIdle,
                        device_id: a.deviceId
                    }
                }))
            };

            const apiUrl = await this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/v1/activities/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                const ids = activities.map(a => a.id);
                await StorageManager.markSynced(ids);
                console.log(`✅ Synced ${activities.length} activities`);
                await this.updateBadge();
                return { success: true, synced: activities.length };
            } else if (response.status === 401) {
                // Token expired — try to refresh, otherwise force re-login
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    // Retry once with new token
                    return this.sync();
                }
                console.warn('Token expired and refresh failed — clearing token');
                await chrome.storage.local.remove(['authToken', 'refreshToken']);
                return { success: false, error: 'not_authenticated' };
            } else {
                const error = await response.text();
                console.error('Sync failed:', response.status, error);
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            console.error('Sync error:', error);
            return { success: false, error: error.message };
        }
    }

    static async login(email, password) {
        try {
            const apiUrl = await this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                await chrome.storage.local.set({
                    authToken: data.access_token,
                    refreshToken: data.refresh_token || null,
                });
                console.log('✅ Login successful');
                return { success: true, token: data.access_token };
            } else {
                const error = await response.text();
                return { success: false, error };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async refreshToken() {
        try {
            const { refreshToken } = await chrome.storage.local.get('refreshToken');
            if (!refreshToken) return false;

            const apiUrl = await this.getApiUrl();
            const response = await fetch(`${apiUrl}/api/v1/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                await chrome.storage.local.set({
                    authToken: data.access_token,
                    refreshToken: data.refresh_token || refreshToken,
                });
                console.log('✅ Token refreshed');
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    static async logout() {
        await chrome.storage.local.remove('authToken');
    }

    static async getAuthToken() {
        const { authToken } = await chrome.storage.local.get('authToken');
        return authToken;
    }

    static async isAuthenticated() {
        const token = await this.getAuthToken();
        return !!token;
    }

    static async updateBadge() {
        try {
            const count = await StorageManager.getUnsyncedCount();
            const text = count > 0 ? String(count) : '';

            await chrome.action.setBadgeText({ text });
            await chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
        } catch (error) {
            console.error('Badge update error:', error);
        }
    }
}
