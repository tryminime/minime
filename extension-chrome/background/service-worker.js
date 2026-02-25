// Background service worker - Enhanced with Activity Queue
import { TabTracker } from './tab-tracker.js';
import { SyncManager } from '../lib/sync.js';
import { StorageManager } from '../lib/storage.js';
import { ActivityQueue } from '../lib/activity-queue.js';

console.log('🚀 MiniMe Extension Service Worker starting...');

// ========================================
// ACTIVITY QUEUE INITIALIZATION
// ========================================

let activityQueue;

async function initializeQueue() {
    console.log('Initializing Activity Queue...');

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
    console.log('✅ Activity Queue initialized');

    // Update badge with queue metrics
    await updateQueueBadge();
}

// ========================================
// TAB TRACKER WITH QUEUE INTEGRATION
// ========================================

// Initialize tab tracker
const tabTracker = new TabTracker();
tabTracker.init();

// Override TabTracker's saveCurrentActivity to use queue
const originalSaveActivity = tabTracker.saveCurrentActivity.bind(tabTracker);
tabTracker.saveCurrentActivity = async function () {
    // Call original save (for local storage backward compatibility)
    await originalSaveActivity();

    // Also enqueue to new activity queue
    if (!this.currentTab || !this.currentTab.url) return;

    // Skip chrome:// and about: pages
    if (this.currentTab.url.startsWith('chrome://') ||
        this.currentTab.url.startsWith('about:') ||
        this.currentTab.url.startsWith('chrome-extension://')) {
        return;
    }

    try {
        const url = new URL(this.currentTab.url);
        const domain = url.hostname;

        // Apply privacy filter
        if (!this.privacyFilter.shouldTrack(domain, url.href, this.currentTab.title)) {
            return;
        }

        // Skip incognito tabs
        if (this.currentTab.incognito) {
            return;
        }

        const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);

        // Only queue if spent more than 2 seconds
        if (durationSeconds < 2) {
            return;
        }

        // Enqueue to activity queue
        if (activityQueue) {
            await activityQueue.enqueue({
                client_generated_id: `browser:${this.currentTab.id}:${Date.now()}:${generateHash()}`,
                occurred_at: new Date(Date.now() - (durationSeconds * 1000)).toISOString(),
                type: 'page_view',
                context: {
                    url: url.href,
                    domain: domain,
                    title: this.currentTab.title || domain,
                    tab_id: this.currentTab.id,
                    window_id: this.currentTab.windowId
                },
                duration_seconds: durationSeconds,
                metadata: {
                    browser: 'chrome',
                    version: chrome.runtime.getManifest().version,
                    incognito: this.currentTab.incognito
                }
            });

            // Update badge
            await updateQueueBadge();
        }
    } catch (error) {
        console.error('Queue enqueue error:', error);
    }
};

// ========================================
// INSTALLATION & SETUP
// ========================================

chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed/updated');

    // Initialize activity queue
    await initializeQueue();

    // Create alarms
    chrome.alarms.create('autoSync', { periodInMinutes: 5 });
    chrome.alarms.create('flushActivity', { periodInMinutes: 1 });
    chrome.alarms.create('cleanupOldData', { periodInMinutes: 1440 }); // Daily
    chrome.alarms.create('queueMaintenance', { periodInMinutes: 1440 }); // Daily

    // Initialize badge
    await SyncManager.updateBadge();
    await updateQueueBadge();
});

// Initialize queue on startup
chrome.runtime.onStartup.addListener(async () => {
    await initializeQueue();
});

// ========================================
// ALARMS
// ========================================

chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('Alarm triggered:', alarm.name);

    switch (alarm.name) {
        case 'autoSync':
            // Legacy sync
            await SyncManager.sync();

            // NEW: Queue flush
            if (activityQueue) {
                await activityQueue.flush();
                await updateQueueBadge();
            }
            break;

        case 'flushActivity':
            await tabTracker.saveCurrentActivity();
            await SyncManager.updateBadge();
            break;

        case 'cleanupOldData':
            await StorageManager.clearOldData(30);
            break;

        case 'queueMaintenance':
            if (activityQueue) {
                // Prune old synced activities (7 days)
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                const pruned = await activityQueue.pruneSynced(sevenDaysAgo);
                console.log(`Queue maintenance: pruned ${pruned} old activities`);
            }
            break;
    }
});

// ========================================
// MESSAGE HANDLERS
// ========================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request.action);

    (async () => {
        try {
            switch (request.action) {
                // Existing handlers
                case 'getCurrentTabTime':
                    if (tabTracker.currentTab && tabTracker.currentTab.id === request.tabId) {
                        const timeSpent = Math.floor((Date.now() - tabTracker.startTime) / 1000);
                        sendResponse({ success: true, time: timeSpent });
                    } else {
                        sendResponse({ success: true, time: 0 });
                    }
                    break;

                case 'getTodayStats':
                    const stats = await StorageManager.getTodayStats();
                    sendResponse({ success: true, stats });
                    break;

                case 'getRecentActivities':
                    const limit = request.limit || 5;
                    const activities = await StorageManager.getRecentActivities(limit);
                    sendResponse({ success: true, activities });
                    break;

                case 'setTracking':
                    tabTracker.isTracking = request.tracking;
                    await chrome.storage.local.set({ trackingEnabled: request.tracking });
                    sendResponse({ success: true, tracking: request.tracking });
                    break;

                case 'syncNow':
                    // Legacy sync
                    const syncResult = await SyncManager.sync();

                    // NEW: Force queue flush
                    let queueResult = null;
                    if (activityQueue) {
                        queueResult = await activityQueue.flush(true);
                        await updateQueueBadge();
                    }

                    sendResponse({
                        success: true,
                        legacy: syncResult,
                        queue: queueResult
                    });
                    break;

                case 'toggleTracking':
                    const enabled = await tabTracker.toggleTracking();
                    sendResponse({ success: true, enabled });
                    break;

                case 'getStatus':
                    const queueMetrics = activityQueue ? await activityQueue.getMetrics() : null;

                    const status = {
                        tracking: tabTracker.getTrackingStatus(),
                        authenticated: await SyncManager.isAuthenticated(),
                        unsyncedCount: await StorageManager.getUnsyncedCount(),
                        todayStats: await StorageManager.getTodayStats(),
                        queue: queueMetrics  // NEW
                    };
                    sendResponse({ success: true, status });
                    break;

                case 'login':
                    const loginResult = await SyncManager.login(request.email, request.password);
                    sendResponse(loginResult);
                    break;

                case 'logout':
                    await SyncManager.logout();
                    sendResponse({ success: true });
                    break;

                case 'clearOldData':
                    const cleaned = await StorageManager.clearOldData(request.days || 30);
                    sendResponse({ success: true, count: cleaned });
                    break;

                case 'exportData':
                    const allActivities = await StorageManager.getAllActivities();
                    sendResponse({ success: true, data: allActivities });
                    break;

                case 'clearAllData':
                    await StorageManager.clearAll();
                    sendResponse({ success: true });
                    break;

                // NEW: Queue-specific handlers
                case 'getQueueMetrics':
                    if (activityQueue) {
                        const metrics = await activityQueue.getMetrics();
                        sendResponse({ success: true, metrics });
                    } else {
                        sendResponse({ success: false, error: 'Queue not initialized' });
                    }
                    break;

                case 'getQueuePending':
                    if (activityQueue) {
                        const pending = await activityQueue.getPending();
                        sendResponse({ success: true, pending });
                    } else {
                        sendResponse({ success: false, error: 'Queue not initialized' });
                    }
                    break;

                case 'getQueueDeadLetters':
                    if (activityQueue) {
                        const deadLetters = await activityQueue.getDeadLetters();
                        sendResponse({ success: true, deadLetters });
                    } else {
                        sendResponse({ success: false, error: 'Queue not initialized' });
                    }
                    break;

                case 'retryQueueFailed':
                    if (activityQueue) {
                        const count = await activityQueue.retryFailed();
                        await activityQueue.flush();
                        await updateQueueBadge();
                        sendResponse({ success: true, count });
                    } else {
                        sendResponse({ success: false, error: 'Queue not initialized' });
                    }
                    break;

                case 'clearQueueDeadLetters':
                    if (activityQueue) {
                        const count = await activityQueue.clearDeadLetters();
                        await updateQueueBadge();
                        sendResponse({ success: true, count });
                    } else {
                        sendResponse({ success: false, error: 'Queue not initialized' });
                    }
                    break;

                default:
                    sendResponse({ success: false, error: 'Unknown action' });
            }
        } catch (error) {
            console.error('Message handler error:', error);
            sendResponse({ success: false, error: error.message });
        }
    })();

    return true; // Keep channel open for async response
});

// ========================================
// BADGE UPDATE
// ========================================

async function updateQueueBadge() {
    if (!activityQueue) return;

    try {
        const metrics = await activityQueue.getMetrics();
        const pendingCount = metrics.pending_count + metrics.retrying_count;

        if (pendingCount > 0) {
            await chrome.action.setBadgeText({
                text: pendingCount > 99 ? '99+' : String(pendingCount)
            });

            // Red badge for dead letters, blue for normal pending
            if (metrics.dead_letter_count > 0) {
                await chrome.action.setBadgeBackgroundColor({ color: '#f56565' });
            } else {
                await chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
            }
        } else {
            await chrome.action.setBadgeText({ text: '' });
        }
    } catch (error) {
        console.error('Badge update error:', error);
    }
}

// ========================================
// LIFECYCLE
// ========================================

// Ensure activity is saved before extension unloads
chrome.runtime.onSuspend.addListener(async () => {
    console.log('Extension suspending, saving activity...');
    await tabTracker.saveCurrentActivity();

    // Stop queue gracefully
    if (activityQueue) {
        await activityQueue.stop();
    }
});

// Network status monitoring
if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
        console.log('Network online - triggering queue flush');
        if (activityQueue) {
            await activityQueue.flush();
            await updateQueueBadge();
        }
    });
}

// ========================================
// UTILITIES
// ========================================

function generateHash() {
    return Math.random().toString(36).substring(2, 10);
}

// Expose queue for debugging
if (typeof globalThis !== 'undefined') {
    globalThis.activityQueue = activityQueue;
}

console.log('✅ Service Worker ready with Activity Queue');
