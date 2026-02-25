/**
 * Activity Queue Integration Example
 * 
 * This file demonstrates how to integrate the ActivityQueue
 * into the browser extension's background service worker.
 */

import { ActivityQueue } from './lib/activity-queue.js';

// ========================================
// INITIALIZATION
// ========================================

// Create global queue instance
let activityQueue;

// Initialize on extension startup
chrome.runtime.onStartup.addListener(async () => {
    await initializeQueue();
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
    await initializeQueue();
});

async function initializeQueue() {
    console.log('Initializing activity queue...');

    activityQueue = new ActivityQueue({
        batchSize: 100,
        maxRetries: 20,
        flushInterval: 60000,  // 1 minute
        apiBaseUrl: 'http://localhost:8000',
        source: 'browser',
        sourceVersion: chrome.runtime.getManifest().version,
        debug: true  // Enable debug logging
    });

    await activityQueue.start();

    // Update badge with queue status
    updateBadge();
}

// ========================================
// ACTIVITY CAPTURE
// ========================================

/**
 * Capture tab activation as page_view activity
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);

        // Skip chrome:// and other internal URLs
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            return;
        }

        const activity = {
            client_generated_id: `browser:${tab.id}:${Date.now()}:${generateHash()}`,
            occurred_at: new Date().toISOString(),
            type: 'page_view',
            context: {
                url: tab.url,
                domain: new URL(tab.url).hostname,
                title: tab.title || 'Untitled',
                tab_id: tab.id,
                window_id: tab.windowId
            },
            duration_seconds: null, // Will update on tab close/deactivate
            metadata: {
                browser: 'chrome',
                version: chrome.runtime.getManifest().version
            }
        };

        await activityQueue.enqueue(activity);
        await updateBadge();

    } catch (error) {
        console.error('Failed to capture tab activation:', error);
    }
});

/**
 * Update activity duration when tab is updated
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    // Only process when page finishes loading
    if (changeInfo.status !== 'complete') return;

    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        return;
    }

    // This could update the duration of the last activity for this tab
    // For simplicity, we're just capturing a new event
    const activity = {
        client_generated_id: `browser:${tab.id}:${Date.now()}:${generateHash()}`,
        occurred_at: new Date().toISOString(),
        type: 'page_view',
        context: {
            url: tab.url,
            domain: new URL(tab.url).hostname,
            title: tab.title || 'Untitled'
        }
    };

    await activityQueue.enqueue(activity);
});

/**
 * Capture window focus events
 */
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        return; // Browser lost focus
    }

    try {
        const window = await chrome.windows.get(windowId, { populate: true });
        const activeTab = window.tabs?.find(tab => tab.active);

        if (activeTab && activeTab.url && !activeTab.url.startsWith('chrome://')) {
            const activity = {
                client_generated_id: `browser:window:${windowId}:${Date.now()}:${generateHash()}`,
                occurred_at: new Date().toISOString(),
                type: 'window_focus',
                context: {
                    window_id: windowId,
                    tab_id: activeTab.id,
                    url: activeTab.url,
                    domain: new URL(activeTab.url).hostname,
                    title: activeTab.title
                }
            };

            await activityQueue.enqueue(activity);
        }
    } catch (error) {
        console.error('Failed to capture window focus:', error);
    }
});

// ========================================
// MANUAL SYNC
// ========================================

/**
 * Manual sync triggered from popup or context menu
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'manual_sync') {
        handleManualSync().then(sendResponse);
        return true; // Keep channel open for async response
    }

    if (message.action === 'get_metrics') {
        handleGetMetrics().then(sendResponse);
        return true;
    }

    if (message.action === 'retry_failed') {
        handleRetryFailed().then(sendResponse);
        return true;
    }

    if (message.action === 'get_dead_letters') {
        handleGetDeadLetters().then(sendResponse);
        return true;
    }
});

async function handleManualSync() {
    try {
        const result = await activityQueue.flush(true);
        await updateBadge();
        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleGetMetrics() {
    try {
        const metrics = await activityQueue.getMetrics();
        return { success: true, metrics };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleRetryFailed() {
    try {
        const count = await activityQueue.retryFailed();
        await activityQueue.flush();
        await updateBadge();
        return { success: true, count };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function handleGetDeadLetters() {
    try {
        const deadLetters = await activityQueue.getDeadLetters();
        return { success: true, deadLetters };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ========================================
// BADGE UPDATE
// ========================================

async function updateBadge() {
    try {
        const metrics = await activityQueue.getMetrics();
        const pendingCount = metrics.pending_count + metrics.retrying_count;

        if (pendingCount > 0) {
            await chrome.action.setBadgeText({
                text: pendingCount > 99 ? '99+' : String(pendingCount)
            });
            await chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
        } else {
            await chrome.action.setBadgeText({ text: '' });
        }

        // Update badge for dead letters (different color)
        if (metrics.dead_letter_count > 0) {
            await chrome.action.setBadgeBackgroundColor({ color: '#f56565' });
        }
    } catch (error) {
        console.error('Failed to update badge:', error);
    }
}

// ========================================
// MAINTENANCE
// ========================================

/**
 * Run daily maintenance tasks
 */
chrome.alarms.create('queue_maintenance', {
    periodInMinutes: 24 * 60 // Daily
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'queue_maintenance') {
        console.log('Running queue maintenance...');

        // Prune old synced activities (7 days)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const pruned = await activityQueue.pruneSynced(sevenDaysAgo);

        console.log(`Maintenance complete: pruned ${pruned} old activities`);
    }
});

// ========================================
// UTILITIES
// ========================================

function generateHash() {
    return Math.random().toString(36).substring(2, 10);
}

// ========================================
// DEBUGGING
// ========================================

/**
 * Expose queue instance for debugging in console
 */
if (typeof window !== 'undefined') {
    window.activityQueue = activityQueue;
}

console.log('Activity queue background service loaded');
