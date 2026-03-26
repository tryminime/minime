/**
 * Focus Period Tracker — Browser Extension.
 *
 * Detects sustained focus sessions by tracking tab dwell time.
 * A "focus period" starts when the user stays on the same domain
 * for more than a configurable threshold (default: 2 minutes).
 *
 * Classifies sessions into:
 *   - DeepWork (≥25 min) — Pomodoro-level sustained focus
 *   - Focused  (≥15 min) — Meaningful concentrated work
 *   - Moderate (≥5 min)  — Engaged but not deep
 *   - Shallow  (<5 min)  — Quick visit / context switch
 */

class FocusPeriodTracker {
    constructor() {
        /** @type {Object|null} Current focus session */
        this.currentSession = null;

        /** @type {Array<Object>} Completed focus sessions */
        this.sessions = [];

        /** Maximum sessions to keep in memory */
        this.maxSessions = 200;

        /** Minimum seconds to count as a reportable focus session */
        this.minFocusSeconds = 120; // 2 minutes

        /** Productive domain categories that should weight higher in scoring */
        this.productiveCategories = new Set([
            'code', 'work', 'development', 'education', 'documentation',
            'research', 'design', 'writing', 'communication'
        ]);

        /** Distracting domain categories */
        this.distractingCategories = new Set([
            'social', 'entertainment', 'news', 'shopping', 'gaming'
        ]);

        this._loadSessions();
    }

    /**
     * Called when the user navigates to a new domain or tab changes.
     * Closes the current session and starts a new one.
     *
     * @param {string} domain - The new domain
     * @param {string} url - The full URL
     * @param {string} title - The page title
     * @param {string} [category] - Domain category from domain-categorizer.js
     * @returns {Object|null} The completed focus session, if above threshold
     */
    onDomainChange(domain, url, title, category = '') {
        const now = Date.now();
        let completedSession = null;

        // Close the current session
        if (this.currentSession) {
            const durationMs = now - this.currentSession.startedAt;
            const durationSeconds = Math.floor(durationMs / 1000);

            if (durationSeconds >= this.minFocusSeconds) {
                completedSession = {
                    domain: this.currentSession.domain,
                    category: this.currentSession.category,
                    startedAt: this.currentSession.startedAt,
                    endedAt: now,
                    durationSeconds,
                    depth: this._classifyDepth(durationSeconds),
                    score: this._computeScore(durationSeconds, this.currentSession.category),
                    isProductive: this.productiveCategories.has(this.currentSession.category),
                    pageTitle: this.currentSession.title,
                };

                this.sessions.push(completedSession);

                // Trim history
                if (this.sessions.length > this.maxSessions) {
                    this.sessions = this.sessions.slice(-this.maxSessions);
                }

                this._saveSessions();
            }
        }

        // Start new session
        this.currentSession = {
            domain,
            url,
            title,
            category,
            startedAt: now,
        };

        return completedSession;
    }

    /**
     * Classify focus depth from duration in seconds.
     * @param {number} seconds
     * @returns {string}
     */
    _classifyDepth(seconds) {
        const minutes = seconds / 60;
        if (minutes >= 25) return 'DeepWork';
        if (minutes >= 15) return 'Focused';
        if (minutes >= 5) return 'Moderate';
        return 'Shallow';
    }

    /**
     * Compute focus quality score (0-100).
     * Productive categories get a bonus; distracting categories get a penalty.
     * @param {number} seconds
     * @param {string} category
     * @returns {number}
     */
    _computeScore(seconds, category) {
        const minutes = seconds / 60;
        let base;

        if (minutes >= 50) base = 100;
        else if (minutes >= 25) base = 85 + Math.min(minutes - 25, 15);
        else if (minutes >= 15) base = 70 + (minutes - 15);
        else if (minutes >= 5) base = 40 + (minutes - 5) * 3;
        else base = Math.min(minutes * 8, 39);

        // Category modifier
        if (this.productiveCategories.has(category)) {
            base = Math.min(base + 5, 100);
        } else if (this.distractingCategories.has(category)) {
            base = Math.max(base - 10, 0);
        }

        return Math.round(base);
    }

    /**
     * Get analytics summary for recent sessions.
     * @param {number} [hours=24] - How many hours back to look
     * @returns {Object}
     */
    getAnalytics(hours = 24) {
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        const recent = this.sessions.filter(s => s.startedAt >= cutoff);

        const deepSessions = recent.filter(s => s.depth === 'DeepWork');
        const focusedSessions = recent.filter(s => s.depth === 'Focused' || s.depth === 'DeepWork');
        const productiveSessions = recent.filter(s => s.isProductive);

        const totalSeconds = recent.reduce((sum, s) => sum + s.durationSeconds, 0);
        const deepSeconds = deepSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
        const focusedSeconds = focusedSessions.reduce((sum, s) => sum + s.durationSeconds, 0);
        const productiveSeconds = productiveSessions.reduce((sum, s) => sum + s.durationSeconds, 0);

        const avgScore = recent.length > 0
            ? Math.round(recent.reduce((sum, s) => sum + s.score, 0) / recent.length)
            : 0;

        // Current session info
        const currentDuration = this.currentSession
            ? Math.floor((Date.now() - this.currentSession.startedAt) / 1000)
            : 0;

        // Streak — count consecutive sessions ≥ Moderate depth from end
        let streak = 0;
        for (let i = recent.length - 1; i >= 0; i--) {
            if (['DeepWork', 'Focused', 'Moderate'].includes(recent[i].depth)) {
                streak++;
            } else break;
        }

        return {
            periodHours: hours,
            sessionCount: recent.length,
            deepWorkCount: deepSessions.length,
            totalFocusedMinutes: Math.round(focusedSeconds / 60),
            totalDeepWorkMinutes: Math.round(deepSeconds / 60),
            totalProductiveMinutes: Math.round(productiveSeconds / 60),
            totalTrackedMinutes: Math.round(totalSeconds / 60),
            avgFocusScore: avgScore,
            focusStreak: streak,
            currentSessionDomain: this.currentSession?.domain || '',
            currentSessionSeconds: currentDuration,
            currentSessionDepth: this._classifyDepth(currentDuration),
            isCurrentlyFocused: currentDuration >= 300, // ≥5min
            topDomains: this._getTopDomains(recent, 5),
        };
    }

    /**
     * Get top domains by total focus time.
     * @param {Array} sessions
     * @param {number} limit
     * @returns {Array}
     */
    _getTopDomains(sessions, limit) {
        const domainMap = {};
        for (const s of sessions) {
            if (!domainMap[s.domain]) {
                domainMap[s.domain] = { domain: s.domain, totalSeconds: 0, count: 0, category: s.category };
            }
            domainMap[s.domain].totalSeconds += s.durationSeconds;
            domainMap[s.domain].count++;
        }

        return Object.values(domainMap)
            .sort((a, b) => b.totalSeconds - a.totalSeconds)
            .slice(0, limit);
    }

    /**
     * Enrich an activity event with focus period metadata.
     * @param {Object} activity
     * @returns {Object}
     */
    enrichActivity(activity) {
        if (!this.currentSession) return activity;

        const currentDuration = Math.floor((Date.now() - this.currentSession.startedAt) / 1000);

        activity.focus_period = {
            in_focus_session: currentDuration >= this.minFocusSeconds,
            session_duration_seconds: currentDuration,
            depth: this._classifyDepth(currentDuration),
            score: this._computeScore(currentDuration, this.currentSession.category || ''),
        };

        return activity;
    }

    /**
     * Get recent completed sessions.
     * @param {number} [limit=20]
     * @returns {Array}
     */
    getRecentSessions(limit = 20) {
        return this.sessions.slice(-limit).reverse();
    }

    /** Persist sessions to extension storage */
    _saveSessions() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({
                    focusSessions: this.sessions.slice(-100), // Keep last 100 in storage
                });
            }
        } catch (e) {
            // Non-critical — sessions still in memory
        }
    }

    /** Load sessions from extension storage */
    _loadSessions() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['focusSessions'], (result) => {
                    if (result.focusSessions) {
                        this.sessions = result.focusSessions;
                    }
                });
            }
        } catch (e) {
            // Start fresh
        }
    }
}

// Export for use in background scripts (ES module + CommonJS compat)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FocusPeriodTracker };
}

export { FocusPeriodTracker };
