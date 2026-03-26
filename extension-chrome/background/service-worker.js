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

    const apiBase = await getApiBase();
    activityQueue = new ActivityQueue({
        batchSize: 100,
        maxRetries: 20,
        flushInterval: 60000,  // 1 minute
        apiBaseUrl: `${apiBase}/api`,
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

// ========================================
// INSTALLATION & SETUP
// ========================================

chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed/updated');

    // Initialize activity queue
    await initializeQueue();
    exposeQueueForDebug();

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
    exposeQueueForDebug();
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
                    // Save whatever is currently being viewed first
                    await tabTracker.saveCurrentActivity();

                    // Check auth before doing anything
                    const isAuth = await SyncManager.isAuthenticated();
                    if (!isAuth) {
                        sendResponse({ success: false, error: 'not_authenticated' });
                        break;
                    }

                    // Legacy sync (StorageManager IndexedDB → backend)
                    const syncResult = await SyncManager.sync();

                    // NEW: Force ActivityQueue flush
                    let queueResult = null;
                    if (activityQueue) {
                        queueResult = await activityQueue.flush(true);
                        await updateQueueBadge();
                    }

                    sendResponse({
                        success: syncResult.success || (queueResult?.synced > 0),
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

                // Called by tab-tracker to route a saved visit into the sync pipeline
                case 'enqueueActivity':
                    if (activityQueue && request.activity) {
                        await activityQueue.enqueue(request.activity);
                        await updateQueueBadge();
                        sendResponse({ success: true });
                    } else {
                        sendResponse({ success: false, error: 'Queue not ready' });
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

                // Phase 3: Content extraction handlers
                case 'content_extracted':
                    await handleContentExtracted(request.payload, sender);
                    sendResponse({ success: true });
                    break;

                case 'getContentStatus': {
                    const tabId = request.tabId || (sender.tab && sender.tab.id);
                    const statusKey = `content_status_${tabId}`;
                    const stored = await chrome.storage.session.get(statusKey);
                    sendResponse({ success: true, status: stored[statusKey] || null });
                    break;
                }

                // Reading analytics from content script (fires on page leave)
                case 'reading_analytics': {
                    const rp = request.payload;
                    if (rp && rp.url && activityQueue) {
                        await activityQueue.enqueue({
                            client_generated_id: `reading:${encodeURIComponent(rp.url).slice(0, 100)}:${Date.now()}`,
                            occurred_at: new Date().toISOString(),
                            type: 'reading_analytics',
                            context: {
                                url: rp.url,
                                domain: rp.domain || (() => { try { return new URL(rp.url).hostname; } catch (_) { return ''; } })(),
                                title: rp.title || document.title || '',
                                reading: {
                                    scroll_depth_pct: rp.scroll_depth_pct || 0,
                                    time_on_page_sec: rp.time_on_page_sec || 0,
                                    word_count: rp.word_count || 0,
                                    estimated_read_time_sec: rp.estimated_read_time_sec || 0,
                                    estimated_read_pct: rp.estimated_read_pct || 0,
                                    selection_count: rp.selection_count || 0,
                                    user_interacted: rp.user_interacted || false,
                                },
                            },
                            duration_seconds: rp.time_on_page_sec || 0,
                            metadata: {
                                browser: 'chrome',
                                is_reading_analytics: true,
                            },
                        });
                    }
                    sendResponse({ success: true });
                    break;
                }

                // ── Social Media Activity ──────────────────────────
                case 'social_media_activity': {
                    const sp = request.payload;
                    if (sp && sp.platform && activityQueue) {
                        await activityQueue.enqueue({
                            client_generated_id: `social:${sp.platform}:${Date.now()}`,
                            occurred_at: new Date().toISOString(),
                            type: 'social_media',
                            context: {
                                platform: sp.platform,
                                url: sp.url,
                                domain: sp.domain,
                                title: sp.title || '',
                                time_spent_sec: sp.time_spent_sec || 0,
                                scroll_depth_pct: sp.scroll_depth_pct || 0,
                                interaction_count: sp.interaction_count || 0,
                                is_feed: sp.is_feed || false,
                                subreddit: sp.subreddit || null,
                                profile_viewed: sp.profile_viewed || null,
                                content_type: sp.content_type || 'page',
                            },
                            duration_seconds: sp.time_spent_sec || 0,
                            metadata: {
                                browser: 'chrome',
                                is_social_media: true,
                            },
                        });
                    }
                    sendResponse({ success: true });
                    break;
                }

                // ── Video Watching ─────────────────────────────────
                case 'video_watching': {
                    const vp = request.payload;
                    if (vp && vp.platform && activityQueue) {
                        await activityQueue.enqueue({
                            client_generated_id: `video:${vp.platform}:${vp.video_id || Date.now()}`,
                            occurred_at: new Date().toISOString(),
                            type: 'video_watching',
                            context: {
                                platform: vp.platform,
                                url: vp.url,
                                domain: vp.domain,
                                video_title: vp.video_title || '',
                                channel: vp.channel || '',
                                video_duration_sec: vp.video_duration_sec || 0,
                                watched_seconds: vp.watched_seconds || 0,
                                watch_pct: vp.watch_pct || 0,
                                time_on_page_sec: vp.time_on_page_sec || 0,
                                is_watching: vp.is_watching || false,
                                content_type: vp.content_type || 'browse',
                                video_id: vp.video_id || null,
                            },
                            duration_seconds: vp.time_on_page_sec || 0,
                            metadata: {
                                browser: 'chrome',
                                is_video_watching: true,
                            },
                        });
                    }
                    sendResponse({ success: true });
                    break;
                }

                // ── Search Query ───────────────────────────────────
                case 'search_query': {
                    const sq = request.payload;
                    if (sq && sq.query && activityQueue) {
                        await activityQueue.enqueue({
                            client_generated_id: `search:${sq.engine}:${Date.now()}`,
                            occurred_at: new Date().toISOString(),
                            type: 'search_query',
                            context: {
                                engine: sq.engine,
                                query: sq.query,
                                url: sq.url,
                                domain: sq.domain,
                                time_on_results_sec: sq.time_on_results_sec || 0,
                                result_clicks: sq.result_clicks || 0,
                                result_count: sq.result_count || null,
                                page: sq.page || 1,
                            },
                            duration_seconds: sq.time_on_results_sec || 0,
                            metadata: {
                                browser: 'chrome',
                                is_search_query: true,
                            },
                        });
                    }
                    sendResponse({ success: true });
                    break;
                }

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

// Network status monitoring (use self, not window, in service worker context)
self.addEventListener('online', async () => {
    console.log('Network online - triggering queue flush');
    if (activityQueue) {
        await activityQueue.flush();
        await updateQueueBadge();
    }
});

// ========================================
// UTILITIES
// ========================================

function generateHash() {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Get the configured API base URL (local dev or production).
 * Reads from extension options; defaults to localhost.
 */
async function getApiBase() {
    try {
        const { apiUrl } = await chrome.storage.local.get('apiUrl');
        return (apiUrl || 'http://localhost:8000').replace(/\/$/, '');
    } catch (_) {
        return 'http://localhost:8000';
    }
}

// Expose queue for debugging (set lazily after initialization)
function exposeQueueForDebug() {
    if (typeof globalThis !== 'undefined' && activityQueue) {
        globalThis.activityQueue = activityQueue;
    }
}

// ========================================
// PHASE 3: CONTENT EXTRACTION HANDLER
// ========================================

/**
 * Handle content extracted by the content script.
 * Stores status, queues activity, forwards to API.
 */
async function handleContentExtracted(payload, sender) {
    if (!payload || !payload.url) return;

    const tabId = sender.tab && sender.tab.id;

    // Store extraction status in session storage (popup reads this)
    if (tabId) {
        const statusKey = `content_status_${tabId}`;
        await chrome.storage.session.set({
            [statusKey]: {
                status: 'extracted',
                word_count: payload.word_count || 0,
                page_type: payload.page_type || 'webpage',
                extracted_at: payload.extracted_at || new Date().toISOString(),
            },
        });
    }

    // Skip content that's too short to be useful
    if (!payload.full_text || payload.full_text.trim().length < 100) return;

    // Enqueue as a page_view activity (correct ActivityQueue payload format)
    if (activityQueue) {
        await activityQueue.enqueue({
            client_generated_id: `content:${encodeURIComponent(payload.url)}:${Date.now()}`,
            occurred_at: payload.extracted_at || new Date().toISOString(),
            type: 'page_view',
            context: {
                url: payload.url,
                domain: (() => { try { return new URL(payload.url).hostname; } catch (_) { return ''; } })(),
                title: payload.title || '',
                page_type: payload.page_type || 'webpage',
                word_count: payload.word_count || 0,
            },
            duration_seconds: payload.reading_time_seconds || 0,
            metadata: {
                content_captured: true,
                browser: 'chrome',
            }
        });
    }

    // Forward to backend content ingestion API with auth token
    try {
        const { authToken } = await chrome.storage.local.get('authToken');
        if (!authToken) {
            console.warn('[MiniMe] No auth token — content not ingested to backend');
            return;
        }

        const apiBase = await getApiBase();
        const response = await fetch(`${apiBase}/api/v1/content/ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                url: payload.url,
                title: payload.title || '',
                doc_type: payload.page_type || 'webpage',
                full_text: payload.full_text,
                word_count: payload.word_count,
                importance_score: payload.importance_score || 0,
                is_important: payload.is_important || false,
                engagement: payload.engagement || {},
                links: payload.links || [],
                metadata: {
                    language: payload.language || 'en',
                    headings: (payload.headings || []).slice(0, 20),
                    description: payload.meta?.description || '',
                    author: payload.meta?.author || '',
                    keywords: payload.meta?.keywords || '',
                    selected_text: payload.selected_text || '',
                },
            }),
        });

        if (response.ok) {
            const result = await response.json();
            const imp = payload.importance_score || 0;
            const tier = imp >= 70 ? '⭐ Essential' : imp >= 50 ? '✅ Curated' : '📄 Browsed';
            console.log(`[MiniMe] Content ingested [${tier}, score=${imp}]: ${payload.title} (${payload.word_count} words)`);

            // Update session status for popup
            if (tabId) {
                const statusKey = `content_status_${tabId}`;
                await chrome.storage.session.set({
                    [statusKey]: {
                        status: 'synced',
                        word_count: payload.word_count || 0,
                        page_type: payload.page_type || 'webpage',
                        importance_score: imp,
                        tier,
                        keyphrases: (result.keyphrases || []).slice(0, 5),
                        extracted_at: payload.extracted_at || new Date().toISOString(),
                    },
                });
            }
        } else {
            const text = await response.text();
            console.error(`[MiniMe] Content ingest failed: ${response.status}`, text);
        }
    } catch (err) {
        console.warn('[MiniMe] Content ingest error:', err.message);
    }
}

console.log('✅ Service Worker ready with Activity Queue + Content Intelligence');

