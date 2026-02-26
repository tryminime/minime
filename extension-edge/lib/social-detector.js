/**
 * Social Media Activity Detector
 *
 * Detects and classifies social media usage with engagement metrics.
 * Enriches activity events with platform-specific metadata.
 */

export class SocialMediaDetector {
    constructor() {
        // Social media platform definitions with URL patterns and activity classification
        this.platforms = {
            // --- Major Social Networks ---
            'twitter.com':    { name: 'Twitter/X',   icon: '🐦', category: 'social_network' },
            'x.com':          { name: 'Twitter/X',   icon: '🐦', category: 'social_network' },
            'facebook.com':   { name: 'Facebook',    icon: '📘', category: 'social_network' },
            'instagram.com':  { name: 'Instagram',   icon: '📷', category: 'social_network' },
            'linkedin.com':   { name: 'LinkedIn',    icon: '💼', category: 'professional' },
            'reddit.com':     { name: 'Reddit',      icon: '🟠', category: 'forum' },
            'tiktok.com':     { name: 'TikTok',      icon: '🎵', category: 'short_video' },
            'snapchat.com':   { name: 'Snapchat',    icon: '👻', category: 'messaging' },
            'pinterest.com':  { name: 'Pinterest',   icon: '📌', category: 'social_network' },
            'tumblr.com':     { name: 'Tumblr',      icon: '📝', category: 'blogging' },
            'mastodon.social': { name: 'Mastodon',   icon: '🐘', category: 'social_network' },

            // --- Messaging Platforms ---
            'discord.com':    { name: 'Discord',     icon: '🎮', category: 'messaging' },
            'web.whatsapp.com': { name: 'WhatsApp',  icon: '💬', category: 'messaging' },
            'web.telegram.org': { name: 'Telegram',  icon: '✈️', category: 'messaging' },
            'signal.group':   { name: 'Signal',      icon: '🔒', category: 'messaging' },

            // --- Content / Video ---
            'youtube.com':    { name: 'YouTube',     icon: '▶️', category: 'video' },
            'youtu.be':       { name: 'YouTube',     icon: '▶️', category: 'video' },
            'twitch.tv':      { name: 'Twitch',      icon: '🟣', category: 'streaming' },

            // --- Professional / Blogging ---
            'medium.com':     { name: 'Medium',      icon: '📄', category: 'blogging' },
            'dev.to':         { name: 'DEV',         icon: '👩‍💻', category: 'blogging' },
            'hashnode.dev':   { name: 'Hashnode',    icon: '📝', category: 'blogging' },
            'substack.com':   { name: 'Substack',    icon: '📧', category: 'newsletter' },
            'threads.net':    { name: 'Threads',     icon: '🧵', category: 'social_network' },
            'bsky.app':       { name: 'Bluesky',     icon: '🦋', category: 'social_network' },
        };

        // URL path patterns that indicate specific activity types
        this.activityPatterns = {
            messaging: [
                /\/messages/i, /\/inbox/i, /\/dm/i, /\/direct/i, /\/chat/i,
            ],
            posting: [
                /\/compose/i, /\/new/i, /\/create/i, /\/write/i, /\/editor/i,
                /\/submit/i, /\/post/i,
            ],
            browsing: [
                /\/feed/i, /\/home/i, /\/explore/i, /\/discover/i,
                /\/trending/i, /\/popular/i, /\/search/i, /\/timeline/i,
            ],
            profile: [
                /\/profile/i, /\/settings/i, /\/account/i, /\/@/i,
            ],
            notifications: [
                /\/notifications/i, /\/alerts/i, /\/activity/i,
            ],
        };
    }

    /**
     * Detect if a URL belongs to a social media platform
     * @param {string} url - Full URL
     * @returns {Object|null} Platform info or null
     */
    detect(url) {
        if (!url || typeof url !== 'string') return null;

        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace(/^www\./, '');

            // Check against known platforms
            for (const [platformDomain, platformInfo] of Object.entries(this.platforms)) {
                if (domain === platformDomain || domain.endsWith('.' + platformDomain)) {
                    return {
                        ...platformInfo,
                        domain: platformDomain,
                        activityType: this._classifyActivity(urlObj.pathname, urlObj.search),
                        path: urlObj.pathname,
                    };
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Classify the type of social media activity based on URL path
     * @param {string} pathname - URL pathname
     * @param {string} search - URL search/query params
     * @returns {string} Activity type
     */
    _classifyActivity(pathname, search) {
        const fullPath = pathname + search;

        for (const [type, patterns] of Object.entries(this.activityPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(fullPath)) {
                    return type;
                }
            }
        }

        return 'browsing'; // Default
    }

    /**
     * Enrich an activity event with social media metadata
     * @param {Object} activity - Activity event object
     * @returns {Object} Enriched activity
     */
    enrichActivity(activity) {
        const { url, windowTitle } = activity;
        if (!url) return activity;

        const socialData = this.detect(url);
        if (!socialData) return activity;

        return {
            ...activity,
            activityType: 'SocialMedia',
            socialMedia: {
                platform: socialData.name,
                platformIcon: socialData.icon,
                category: socialData.category,
                activityType: socialData.activityType,
                domain: socialData.domain,
            },
            metadata: {
                ...(activity.metadata || {}),
                isSocialMedia: true,
                socialPlatform: socialData.name,
                socialCategory: socialData.category,
                socialActivityType: socialData.activityType,
            },
        };
    }

    /**
     * Check if a URL is social media (quick boolean check)
     * @param {string} url - URL to check
     * @returns {boolean}
     */
    isSocialMedia(url) {
        return this.detect(url) !== null;
    }

    /**
     * Get all supported platform names
     * @returns {Array<string>}
     */
    getSupportedPlatforms() {
        const seen = new Set();
        return Object.values(this.platforms)
            .filter(p => {
                if (seen.has(p.name)) return false;
                seen.add(p.name);
                return true;
            })
            .map(p => ({ name: p.name, icon: p.icon, category: p.category }));
    }
}

// Export singleton
export const socialDetector = new SocialMediaDetector();
export default SocialMediaDetector;
