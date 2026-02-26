// Privacy filter for domain tracking
export class PrivacyFilter {
    constructor() {
        this.blacklist = new Set();
        this.whitelist = new Set();
        this.sensitivePatterns = [
            /password/i,
            /private/i,
            /incognito/i,
            /bank/i,
            /credit[- ]?card/i,
            /login/i,
            /signin/i,
            /auth/i,
        ];

        // Default blacklisted domains
        this.defaultBlacklist = [
            'localhost',
            '127.0.0.1',
        ];

        this.init();
    }

    async init() {
        const settings = await chrome.storage.local.get(['blacklist', 'whitelist', 'trackingEnabled']);
        this.blacklist = new Set([...this.defaultBlacklist, ...(settings.blacklist || [])]);
        this.whitelist = new Set(settings.whitelist || []);
        this.trackingEnabled = settings.trackingEnabled !== false; // Default true
    }

    shouldTrack(domain, url = '', title = '') {
        if (!this.trackingEnabled) {
            return false;
        }

        // Check blacklist
        if (this.blacklist.has(domain)) {
            return false;
        }

        // Check whitelist (if enabled)
        if (this.whitelist.size > 0 && !this.whitelist.has(domain)) {
            return false;
        }

        // Check for sensitive patterns
        if (this.hasSensitiveContent(url) || this.hasSensitiveContent(title)) {
            return false;
        }

        return true;
    }

    hasSensitiveContent(text) {
        for (const pattern of this.sensitivePatterns) {
            if (pattern.test(text)) {
                return true;
            }
        }
        return false;
    }

    redactSensitive(text) {
        if (this.hasSensitiveContent(text)) {
            return '[REDACTED]';
        }
        return text;
    }

    async addToBlacklist(domain) {
        this.blacklist.add(domain);
        const blacklistArray = Array.from(this.blacklist).filter(d => !this.defaultBlacklist.includes(d));
        await chrome.storage.local.set({ blacklist: blacklistArray });
    }

    async addToWhitelist(domain) {
        this.whitelist.add(domain);
        await chrome.storage.local.set({ whitelist: Array.from(this.whitelist) });
    }

    async removeFromBlacklist(domain) {
        this.blacklist.delete(domain);
        const blacklistArray = Array.from(this.blacklist).filter(d => !this.defaultBlacklist.includes(d));
        await chrome.storage.local.set({ blacklist: blacklistArray });
    }

    async setTrackingEnabled(enabled) {
        this.trackingEnabled = enabled;
        await chrome.storage.local.set({ trackingEnabled: enabled });
    }

    getBlacklist() {
        return Array.from(this.blacklist);
    }

    getWhitelist() {
        return Array.from(this.whitelist);
    }
}
