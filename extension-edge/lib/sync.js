// Sync manager for backend communication
import { StorageManager } from './storage.js';

export class SyncManager {
    static API_URL = 'http://localhost:8000';
    static BATCH_SIZE = 100;

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

            const response = await fetch(`${this.API_URL}/api/v1/activities/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(activities),
            });

            if (response.ok) {
                const result = await response.json();
                const ids = activities.map(a => a.id);
                await StorageManager.markSynced(ids);

                console.log(`✅ Synced ${activities.length} activities`);

                // Update badge
                await this.updateBadge();

                return { success: true, synced: activities.length };
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
            const response = await fetch(`${this.API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const { access_token } = await response.json();
                await chrome.storage.local.set({ authToken: access_token });
                console.log('✅ Login successful');
                return { success: true, token: access_token };
            } else {
                const error = await response.text();
                return { success: false, error };
            }
        } catch (error) {
            return { success: false, error: error.message };
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
