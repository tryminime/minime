// Tab tracker - monitors active tabs and URLs
import { PrivacyFilter } from '../lib/privacy.js';
import { StorageManager } from '../lib/storage.js';
import { MediaDetector } from '../lib/media-detector.js';

export class TabTracker {
    constructor() {
        this.currentTab = null;
        this.startTime = Date.now();
        this.privacyFilter = new PrivacyFilter();
        this.isTracking = true;
    }

    async init() {
        console.log('🚀 TabTracker initialized');

        // Load tracking state
        const { trackingEnabled } = await chrome.storage.local.get('trackingEnabled');
        this.isTracking = trackingEnabled !== false;

        // Create context menu
        this.createContextMenu();

        // Listen for tab activation
        chrome.tabs.onActivated.addListener(this.handleTabChange.bind(this));

        // Listen for URL updates
        chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));

        // Listen for window focus
        chrome.windows.onFocusChanged.addListener(this.handleWindowFocus.bind(this));

        // Listen for tab removal
        chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));

        // Get current active tab
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (activeTab) {
            this.currentTab = activeTab;
            this.startTime = Date.now();
        }
    }

    createContextMenu() {
        chrome.contextMenus.create({
            id: 'minime-blacklist',
            title: 'Add domain to MiniMe blacklist',
            contexts: ['page'],
        });

        chrome.contextMenus.create({
            id: 'minime-pause',
            title: 'Pause MiniMe tracking',
            contexts: ['page'],
        });

        chrome.contextMenus.onClicked.addListener(async (info, tab) => {
            if (info.menuItemId === 'minime-blacklist') {
                const url = new URL(tab.url);
                await this.privacyFilter.addToBlacklist(url.hostname);
                console.log('Added to blacklist:', url.hostname);
            } else if (info.menuItemId === 'minime-pause') {
                await this.toggleTracking();
            }
        });
    }

    async handleTabChange(activeInfo) {
        if (!this.isTracking) return;

        await this.saveCurrentActivity();

        try {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            this.currentTab = tab;
            this.startTime = Date.now();
            console.log('Tab changed:', tab.url);
        } catch (error) {
            console.error('handleTabChange error:', error);
        }
    }

    async handleTabUpdate(tabId, changeInfo, tab) {
        if (!this.isTracking) return;

        // Only process URL changes for the current tab
        if (changeInfo.url && tabId === this.currentTab?.id) {
            await this.saveCurrentActivity();
            this.currentTab = tab;
            this.startTime = Date.now();
            console.log('URL changed:', tab.url);
        }

        // Update title if it changes
        if (changeInfo.title && tabId === this.currentTab?.id) {
            this.currentTab.title = changeInfo.title;
        }
    }

    async handleWindowFocus(windowId) {
        if (!this.isTracking) return;

        if (windowId === chrome.windows.WINDOW_ID_NONE) {
            // Browser lost focus
            await this.saveCurrentActivity();
            this.currentTab = null;
        } else {
            // Get active tab in focused window
            const [activeTab] = await chrome.tabs.query({ active: true, windowId });
            if (activeTab) {
                await this.saveCurrentActivity();
                this.currentTab = activeTab;
                this.startTime = Date.now();
            }
        }
    }

    async handleTabRemoved(tabId) {
        if (tabId === this.currentTab?.id) {
            await this.saveCurrentActivity();
            this.currentTab = null;
        }
    }

    async saveCurrentActivity() {
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
                console.log('Skipping tracking for:', domain);
                return;
            }

            // Skip incognito tabs
            if (this.currentTab.incognito) {
                console.log('Skipping incognito tab');
                return;
            }

            const durationSeconds = Math.floor((Date.now() - this.startTime) / 1000);

            // Only save if spent more than 2 seconds
            if (durationSeconds < 2) {
                return;
            }

            let activity = {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                activityType: 'WebBrowsing',
                url: url.href,
                domain: domain,
                windowTitle: this.currentTab.title || domain,
                durationSeconds: durationSeconds,
                isIdle: false,
                deviceId: await this.getDeviceId(),
            };

            // Enrich with media detection
            activity = MediaDetector.enrichActivity(activity);

            await StorageManager.saveActivity(activity);
            console.log(`✅ Saved activity: ${domain} (${durationSeconds}s)${activity.metadata ? ' [Media]' : ''}`);
        } catch (error) {
            console.error('saveCurrentActivity error:', error);
        }
    }

    async getDeviceId() {
        const { deviceId } = await chrome.storage.local.get('deviceId');
        if (deviceId) return deviceId;

        // Generate new device ID
        const newDeviceId = `browser-${crypto.randomUUID()}`;
        await chrome.storage.local.set({ deviceId: newDeviceId });
        return newDeviceId;
    }

    async toggleTracking() {
        this.isTracking = !this.isTracking;
        await chrome.storage.local.set({ trackingEnabled: this.isTracking });
        console.log(`Tracking ${this.isTracking ? 'enabled' : 'disabled'}`);
        return this.isTracking;
    }

    getTrackingStatus() {
        return this.isTracking;
    }
}
