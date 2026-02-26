/**
 * Browser History Sync
 * 
 * Syncs browser history to backend for activity analysis.
 * Respects privacy settings and user preferences.
 */

import { urlAnalyzer } from './url-analyzer.js';
import { domainCategorizer } from './domain-categorizer.js';

export class HistorySync {
    constructor() {
        this.syncing = false;
        this.lastSyncTime = null;
        this.syncedCount = 0;

        // Default settings
        this.settings = {
            enabled: false,
            syncDays: 7, // Last N days to sync
            batchSize: 100, // Items per batch
            excludeDomains: [], // Domains to skip
            minVisitDuration: 5000, // Min 5 seconds
            includeSearchQueries: false
        };

        this.loadSettings();
    }

    /**
     * Load settings from storage
     */
    async loadSettings() {
        try {
            const stored = await chrome.storage.local.get('historySyncSettings');
            if (stored.historySyncSettings) {
                this.settings = { ...this.settings, ...stored.historySyncSettings };
            }

            const lastSync = await chrome.storage.local.get('lastHistorySync');
            if (lastSync.lastHistorySync) {
                this.lastSyncTime = lastSync.lastHistorySync;
            }
        } catch (error) {
            console.error('Failed to load history sync settings:', error);
        }
    }

    /**
     * Save settings to storage
     */
    async saveSettings() {
        try {
            await chrome.storage.local.set({
                historySyncSettings: this.settings
            });
        } catch (error) {
            console.error('Failed to save history sync settings:', error);
        }
    }

    /**
     * Update settings
     * @param {Object} newSettings - Settings to update
     */
    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        await this.saveSettings();
    }

    /**
     * Check if history sync is enabled
     * @returns {boolean}
     */
    isEnabled() {
        return this.settings.enabled;
    }

    /**
     * Check if domain should be excluded
     * @param {string} url - URL to check
     * @returns {boolean}
     */
    shouldExcludeDomain(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname;

            return this.settings.excludeDomains.some(excluded =>
                domain.includes(excluded) || excluded.includes(domain)
            );
        } catch (error) {
            return true; // Exclude invalid URLs
        }
    }

    /**
     * Convert history item to activity format
     * @param {Object} historyItem - Chrome history item
     * @returns {Object} Activity object
     */
    convertToActivity(historyI) {
        const urlMetadata = urlAnalyzer.analyze(historyItem.url);
        const category = domainCategorizer.categorize(historyItem.url);

        return {
            type: 'page_view',
            source: 'browser_history',
            timestamp: new Date(historyItem.lastVisitTime).toISOString(),
            client_generated_id: `history_${historyItem.id}_${historyItem.lastVisitTime}`,
            context: {
                url: historyItem.url,
                title: historyItem.title || '',
                domain: new URL(historyItem.url).hostname,
                visit_count: historyItem.visitCount || 1,
                typed_count: historyItem.typedCount || 0,
                category: category,
                url_metadata: urlMetadata,
                is_historical: true,
                synced_at: new Date().toISOString()
            }
        };
    }

    /**
     * Get history items for sync
     * @returns {Promise<Array>} History items
     */
    async getHistoryItems() {
        if (!chrome.history) {
            throw new Error('History API not available');
        }

        const startTime = Date.now() - (this.settings.syncDays * 24 * 60 * 60 * 1000);

        return new Promise((resolve, reject) => {
            chrome.history.search({
                text: '',
                startTime: startTime,
                maxResults: 10000 // Chrome's max
            }, (results) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(results);
                }
            });
        });
    }

    /**
     * Filter history items based on settings
     * @param {Array} items - Raw history items
     * @returns {Array} Filtered items
     */
    filterHistoryItems(items) {
        return items.filter(item => {
            // Skip excluded domains
            if (this.shouldExcludeDomain(item.url)) {
                return false;
            }

            // Skip items with very low visit count (likely redirects)
            if (item.visitCount < 1) {
                return false;
            }

            // Skip chrome:// and extension URLs
            if (item.url.startsWith('chrome://') || item.url.startsWith('chrome-extension://')) {
                return false;
            }

            // Skip file:// URLs for privacy
            if (item.url.startsWith('file://')) {
                return false;
            }

            return true;
        });
    }

    /**
     * Send activities to backend in batches
     * @param {Array} activities - Activities to send
     */
    async sendToBackend(activities) {
        const apiUrl = await this.getApiUrl();
        const token = await this.getAuthToken();

        if (!apiUrl || !token) {
            throw new Error('Backend not configured');
        }

        // Send in batches
        for (let i = 0; i < activities.length; i += this.settings.batchSize) {
            const batch = activities.slice(i, i + this.settings.batchSize);

            const response = await fetch(`${apiUrl}/v1/activities/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ activities: batch })
            });

            if (!response.ok) {
                throw new Error(`Failed to sync batch: ${response.statusText}`);
            }

            this.syncedCount += batch.length;

            // Update progress
            await this.updateProgress(this.syncedCount, activities.length);

            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Get API URL from settings
     */
    async getApiUrl() {
        const settings = await chrome.storage.local.get('settings');
        return settings.settings?.backendUrl || 'http://localhost:8000';
    }

    /**
     * Get auth token
     */
    async getAuthToken() {
        const auth = await chrome.storage.local.get('authToken');
        return auth.authToken;
    }

    /**
     * Update sync progress
     */
    async updateProgress(current, total) {
        await chrome.storage.local.set({
            historySyncProgress: {
                current,
                total,
                percentage: Math.round((current / total) * 100),
                timestamp: Date.now()
            }
        });
    }

    /**
     * Get current sync progress
     */
    async getProgress() {
        const progress = await chrome.storage.local.get('historySyncProgress');
        return progress.historySyncProgress || { current: 0, total: 0, percentage: 0 };
    }

    /**
     * Perform full history sync
     * @returns {Promise<Object>} Sync results
     */
    async sync() {
        if (this.syncing) {
            throw new Error('Sync already in progress');
        }

        if (!this.isEnabled()) {
            throw new Error('History sync is disabled');
        }

        this.syncing = true;
        this.syncedCount = 0;
        const startTime = Date.now();

        try {
            // Get history items
            console.log('Fetching browser history...');
            const historyItems = await this.getHistoryItems();
            console.log(`Found ${historyItems.length} history items`);

            // Filter items
            const filtered = this.filterHistoryItems(historyItems);
            console.log(`Filtered to ${filtered.length} items`);

            if (filtered.length === 0) {
                return {
                    success: true,
                    synced: 0,
                    filtered: 0,
                    duration: Date.now() - startTime
                };
            }

            // Convert to activities
            const activities = filtered.map(item => this.convertToActivity(item));

            // Send to backend
            console.log('Syncing to backend...');
            await this.sendToBackend(activities);

            // Update last sync time
            this.lastSyncTime = Date.now();
            await chrome.storage.local.set({ lastHistorySync: this.lastSyncTime });

            console.log(`Sync complete: ${this.syncedCount} activities synced`);

            return {
                success: true,
                synced: this.syncedCount,
                filtered: filtered.length,
                total: historyItems.length,
                duration: Date.now() - startTime
            };

        } catch (error) {
            console.error('History sync failed:', error);
            throw error;
        } finally {
            this.syncing = false;
        }
    }

    /**
     * Get last sync information
     * @returns {Object} Last sync info
     */
    getLastSyncInfo() {
        return {
            lastSyncTime: this.lastSyncTime,
            lastSyncDate: this.lastSyncTime ? new Date(this.lastSyncTime).toISOString() : null,
            syncedCount: this.syncedCount,
            isSyncing: this.syncing
        };
    }
}

// Export singleton instance
export const historySync = new HistorySync();

// Export class for testing
export default HistorySync;
