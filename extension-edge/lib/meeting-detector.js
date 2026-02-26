/**
 * Meeting / Video Call Detector
 *
 * Detects Zoom, Google Meet, Microsoft Teams, Webex, Slack Huddle,
 * and other video conferencing platforms. Tracks meeting duration,
 * platform, and metadata.
 */

export class MeetingDetector {
    constructor() {
        // Meeting platform definitions with URL patterns
        this.platforms = {
            'zoom.us': { name: 'Zoom', icon: '📹', joinPattern: /\/j\/|\/wc\/|\/my\//i },
            'meet.google.com': { name: 'Google Meet', icon: '🟢', joinPattern: /\/[a-z]{3}-[a-z]{4}-[a-z]{3}/i },
            'teams.microsoft.com': { name: 'Microsoft Teams', icon: '🟣', joinPattern: /\/l\/meetup-join|\/meeting/i },
            'teams.live.com': { name: 'Microsoft Teams', icon: '🟣', joinPattern: /\/meet\//i },
            'webex.com': { name: 'Cisco Webex', icon: '🔵', joinPattern: /\/meet\/|\/join\//i },
            'app.slack.com': { name: 'Slack Huddle', icon: '💜', joinPattern: /\/huddle\//i },
            'whereby.com': { name: 'Whereby', icon: '🟤', joinPattern: /\/.+/i },
            'around.co': { name: 'Around', icon: '⚪', joinPattern: /\/.+/i },
            'gather.town': { name: 'Gather', icon: '🏠', joinPattern: /\/app\//i },
            'pop.com': { name: 'Pop', icon: '🟡', joinPattern: /\/.+/i },
            'cal.com': { name: 'Cal.com', icon: '📅', joinPattern: /\/.+/i },
            'loom.com': { name: 'Loom', icon: '🎬', joinPattern: /\/share\//i },
        };

        // Title patterns that indicate an active meeting
        this.meetingTitlePatterns = [
            /meeting/i,
            /call/i,
            /huddle/i,
            /standup/i,
            /stand-up/i,
            /sync/i,
            /1[:\-]1/i,
            /one.on.one/i,
            /interview/i,
            /demo/i,
            /presentation/i,
            /webinar/i,
            /conference/i,
        ];

        // Active meeting state tracking
        this.activeMeeting = null;
    }

    /**
     * Detect if a URL belongs to a meeting/video call platform
     * @param {string} url - Full URL
     * @param {string} title - Page title
     * @returns {Object|null} Meeting info or null
     */
    detect(url, title = '') {
        if (!url || typeof url !== 'string') return null;

        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace(/^www\./, '');

            for (const [platformDomain, platformInfo] of Object.entries(this.platforms)) {
                if (domain === platformDomain || domain.endsWith('.' + platformDomain)) {
                    const isInMeeting = platformInfo.joinPattern.test(urlObj.pathname);

                    return {
                        platform: platformInfo.name,
                        icon: platformInfo.icon,
                        domain: platformDomain,
                        isInMeeting,
                        meetingUrl: isInMeeting ? url : null,
                        meetingTitle: this._extractMeetingTitle(title, platformInfo.name),
                    };
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Extract a privacy-safe meeting title
     * @param {string} title - Raw page title
     * @param {string} platformName - Platform name to strip
     * @returns {string} Cleaned meeting title
     */
    _extractMeetingTitle(title, platformName) {
        if (!title) return 'Unknown Meeting';

        // Strip platform name from title
        let cleaned = title
            .replace(new RegExp(platformName, 'gi'), '')
            .replace(/[-|–—·•]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        // Don't expose participant names — just return generic title if it looks like a name
        if (cleaned.length < 3 || /^\w+\s\w+$/.test(cleaned)) {
            return 'Meeting';
        }

        // Truncate long titles
        if (cleaned.length > 80) {
            cleaned = cleaned.substring(0, 77) + '...';
        }

        return cleaned || 'Meeting';
    }

    /**
     * Start tracking a meeting session
     * @param {Object} meetingInfo - Output from detect()
     * @returns {Object} Meeting session with start time
     */
    startMeeting(meetingInfo) {
        this.activeMeeting = {
            ...meetingInfo,
            startedAt: new Date().toISOString(),
            startTimestamp: Date.now(),
        };
        return this.activeMeeting;
    }

    /**
     * End the current meeting session
     * @returns {Object|null} Completed meeting with duration, or null
     */
    endMeeting() {
        if (!this.activeMeeting) return null;

        const meeting = {
            ...this.activeMeeting,
            endedAt: new Date().toISOString(),
            durationSeconds: Math.floor((Date.now() - this.activeMeeting.startTimestamp) / 1000),
        };

        this.activeMeeting = null;
        return meeting;
    }

    /**
     * Get current active meeting, if any
     * @returns {Object|null}
     */
    getActiveMeeting() {
        if (!this.activeMeeting) return null;

        return {
            ...this.activeMeeting,
            currentDurationSeconds: Math.floor((Date.now() - this.activeMeeting.startTimestamp) / 1000),
        };
    }

    /**
     * Check if a tab's audible state indicates a call
     * @param {Object} tab - Chrome tab object
     * @returns {boolean}
     */
    isTabInCall(tab) {
        if (!tab) return false;

        // A tab is likely in a call if it's audible AND on a meeting platform
        const isMeetingPlatform = this.detect(tab.url) !== null;
        return isMeetingPlatform && (tab.audible === true);
    }

    /**
     * Enrich an activity event with meeting metadata
     * @param {Object} activity - Activity event object
     * @returns {Object} Enriched activity
     */
    enrichActivity(activity) {
        const { url, windowTitle } = activity;
        if (!url) return activity;

        const meetingData = this.detect(url, windowTitle);
        if (!meetingData) return activity;

        // If we detect a meeting and it's in-meeting, track the session
        if (meetingData.isInMeeting && !this.activeMeeting) {
            this.startMeeting(meetingData);
        }

        return {
            ...activity,
            activityType: meetingData.isInMeeting ? 'VideoCall' : 'MeetingPlatform',
            meeting: {
                platform: meetingData.platform,
                platformIcon: meetingData.icon,
                isInMeeting: meetingData.isInMeeting,
                meetingTitle: meetingData.meetingTitle,
                activeMeetingDuration: this.activeMeeting
                    ? Math.floor((Date.now() - this.activeMeeting.startTimestamp) / 1000)
                    : null,
            },
            metadata: {
                ...(activity.metadata || {}),
                isMeeting: true,
                meetingPlatform: meetingData.platform,
                meetingActive: meetingData.isInMeeting,
            },
        };
    }

    /**
     * Get all supported meeting platforms
     * @returns {Array<Object>}
     */
    getSupportedPlatforms() {
        const seen = new Set();
        return Object.values(this.platforms)
            .filter(p => {
                if (seen.has(p.name)) return false;
                seen.add(p.name);
                return true;
            })
            .map(p => ({ name: p.name, icon: p.icon }));
    }
}

// Export singleton
export const meetingDetector = new MeetingDetector();
export default MeetingDetector;
