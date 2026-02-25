// Background service worker - main entry point
import { TabTracker } from './tab-tracker.js';
import { SyncManager } from '../lib/sync.js';
import { StorageManager } from '../lib/storage.js';

console.log('🚀 MiniMe Extension Service Worker starting...');

// Initialize tab tracker
const tabTracker = new TabTracker();
tabTracker.init();

// Set up alarms for periodic tasks
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed/updated');

    // Create alarms
    chrome.alarms.create('autoSync', { periodInMinutes: 5 });
    chrome.alarms.create('flushActivity', { periodInMinutes: 1 });
    chrome.alarms.create('cleanupOldData', { periodInMinutes: 1440 }); // Daily

    // Initialize badge
    await SyncManager.updateBadge();
});

// Handle alarms
chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log('Alarm triggered:', alarm.name);

    switch (alarm.name) {
        case 'autoSync':
            await SyncManager.sync();
            break;

        case 'flushActivity':
            await tabTracker.saveCurrentActivity();
            await SyncManager.updateBadge();
            break;

        case 'cleanupOldData':
            await StorageManager.clearOldData(30);
            break;
    }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request.action);

    (async () => {
        try {
            switch (request.action) {
                case 'getCurrentTabTime':
                    // Calculate time spent on current tab
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
                    const syncResult = await SyncManager.sync();
                    sendResponse(syncResult);
                    break;

                case 'toggleTracking':
                    const enabled = await tabTracker.toggleTracking();
                    sendResponse({ success: true, enabled });
                    break;

                case 'getStatus':
                    const status = {
                        tracking: tabTracker.getTrackingStatus(),
                        authenticated: await SyncManager.isAuthenticated(),
                        unsyncedCount: await StorageManager.getUnsyncedCount(),
                        todayStats: await StorageManager.getTodayStats(),
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

// Ensure activity is saved before extension unloads
chrome.runtime.onSuspend.addListener(async () => {
    console.log('Extension suspending, saving activity...');
    await tabTracker.saveCurrentActivity();
});

console.log('✅ Service Worker ready');
