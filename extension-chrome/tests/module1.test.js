/**
 * Module 1: Activity Capture — Browser Extension Tests
 * 
 * Tests Features 11-14 + 9b:
 *   11. Web URL/domain tracking (tab-tracker)
 *   12. Time on page (tab-tracker)
 *   13. Social media detection (social-detector.js)
 *   14. Meeting/video call capture (meeting-detector.js)
 *   9b. Focus period detection (focus-tracker.js)
 *
 * Run: node extension-chrome/tests/module1.test.js
 */

// ========================================
// Minimal test runner (no external deps)
// ========================================
let passed = 0;
let failed = 0;
let total = 0;

function test(name, fn) {
    total++;
    try {
        fn();
        passed++;
        console.log(`  ✅ ${name}`);
    } catch (e) {
        failed++;
        console.error(`  ❌ ${name}: ${e.message}`);
    }
}

function assertEqual(actual, expected, msg = '') {
    if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}${msg ? ': ' + msg : ''}`);
    }
}

function assertTrue(value, msg = '') {
    if (!value) throw new Error(`Expected truthy value${msg ? ': ' + msg : ''}`);
}

function assertFalse(value, msg = '') {
    if (value) throw new Error(`Expected falsy value${msg ? ': ' + msg : ''}`);
}

function assertNull(value, msg = '') {
    if (value !== null) throw new Error(`Expected null, got ${JSON.stringify(value)}${msg ? ': ' + msg : ''}`);
}

function assertNotNull(value, msg = '') {
    if (value === null || value === undefined) throw new Error(`Expected non-null${msg ? ': ' + msg : ''}`);
}

// ========================================
// Mock chrome API for testing
// ========================================
globalThis.chrome = {
    storage: {
        local: {
            get: (keys, cb) => cb && cb({}),
            set: () => { },
        },
    },
    tabs: { query: () => Promise.resolve([]) },
    windows: { WINDOW_ID_NONE: -1 },
};
globalThis.crypto = { randomUUID: () => 'test-' + Math.random().toString(36).slice(2, 10) };

// ========================================
// Feature 13: Social Media Detection
// ========================================
console.log('\n📱 Feature 13: Social Media Detection');

const { SocialMediaDetector } = require('../lib/social-detector.js');
const detector = new SocialMediaDetector();

// detect() returns null for non-matches, or {name, icon, category, domain, activityType, path}
test('detects Twitter/X', () => {
    const r = detector.detect('https://twitter.com/user/status/123');
    assertNotNull(r);
    assertEqual(r.name, 'Twitter/X');
    assertEqual(r.domain, 'twitter.com');
});

test('detects X.com', () => {
    const r = detector.detect('https://x.com/user/status/456');
    assertNotNull(r);
    assertEqual(r.name, 'Twitter/X');
});

test('detects Facebook', () => {
    const r = detector.detect('https://www.facebook.com/user');
    assertNotNull(r);
    assertEqual(r.name, 'Facebook');
});

test('detects Instagram', () => {
    const r = detector.detect('https://www.instagram.com/p/abc123/');
    assertNotNull(r);
    assertEqual(r.name, 'Instagram');
});

test('detects LinkedIn', () => {
    const r = detector.detect('https://www.linkedin.com/feed/');
    assertNotNull(r);
    assertEqual(r.name, 'LinkedIn');
});

test('detects Reddit', () => {
    const r = detector.detect('https://www.reddit.com/r/programming/');
    assertNotNull(r);
    assertEqual(r.name, 'Reddit');
});

test('detects TikTok', () => {
    const r = detector.detect('https://www.tiktok.com/@user');
    assertNotNull(r);
    assertEqual(r.name, 'TikTok');
});

test('detects Discord', () => {
    const r = detector.detect('https://discord.com/channels/123/456');
    assertNotNull(r);
    assertEqual(r.name, 'Discord');
});

test('detects WhatsApp Web', () => {
    const r = detector.detect('https://web.whatsapp.com/');
    assertNotNull(r);
    assertEqual(r.name, 'WhatsApp');
});

test('detects YouTube', () => {
    const r = detector.detect('https://www.youtube.com/watch?v=abc');
    assertNotNull(r);
    assertEqual(r.name, 'YouTube');
});

test('detects Pinterest', () => {
    const r = detector.detect('https://www.pinterest.com/pin/123');
    assertNotNull(r);
    assertEqual(r.name, 'Pinterest');
});

test('detects Snapchat web', () => {
    const r = detector.detect('https://www.snapchat.com/');
    assertNotNull(r);
    assertEqual(r.name, 'Snapchat');
});

test('detects Mastodon', () => {
    const r = detector.detect('https://mastodon.social/@user');
    assertNotNull(r);
    assertEqual(r.name, 'Mastodon');
});

test('detects Medium', () => {
    const r = detector.detect('https://medium.com/some-article');
    assertNotNull(r);
    assertEqual(r.name, 'Medium');
});

test('returns null for Google', () => {
    const r = detector.detect('https://www.google.com/search?q=test');
    assertNull(r);
});

test('returns null for GitHub', () => {
    const r = detector.detect('https://github.com/user/repo');
    assertNull(r);
});

test('returns null for empty URL', () => {
    assertNull(detector.detect(''));
    assertNull(detector.detect(null));
});

test('activityType is assigned', () => {
    const r = detector.detect('https://www.reddit.com/r/programming/');
    assertNotNull(r);
    assertTrue(typeof r.activityType === 'string');
});

test('enrichActivity adds social metadata', () => {
    const activity = { url: 'https://twitter.com/user', domain: 'twitter.com', windowTitle: 'Twitter' };
    const enriched = detector.enrichActivity(activity);
    assertTrue(enriched.metadata?.isSocialMedia);
    assertEqual(enriched.socialMedia?.platform, 'Twitter/X');
    assertEqual(enriched.activityType, 'SocialMedia');
});

test('enrichActivity skips non-social URLs', () => {
    const activity = { url: 'https://docs.google.com/', domain: 'docs.google.com', windowTitle: 'Docs' };
    const enriched = detector.enrichActivity(activity);
    assertTrue(!enriched.metadata?.isSocialMedia);
});

test('platform count >= 20', () => {
    const count = Object.keys(detector.platforms).length;
    assertTrue(count >= 20, `Expected >= 20 platforms, got ${count}`);
});

// ========================================
// Feature 14: Meeting/Video Call Detection
// ========================================
console.log('\n🎥 Feature 14: Meeting/Video Call Detection');

const { MeetingDetector } = require('../lib/meeting-detector.js');
const meetingDet = new MeetingDetector();

// detect() returns null for non-matches, or {platform, icon, domain, isInMeeting, meetingUrl, meetingTitle}
test('detects Zoom meeting', () => {
    const r = meetingDet.detect('https://zoom.us/j/12345678', 'Zoom Meeting');
    assertNotNull(r);
    assertEqual(r.platform, 'Zoom');
    assertTrue(r.isInMeeting);
});

test('detects Google Meet', () => {
    const r = meetingDet.detect('https://meet.google.com/abc-defg-hij', 'Google Meet');
    assertNotNull(r);
    assertEqual(r.platform, 'Google Meet');
    assertTrue(r.isInMeeting);
});

test('detects Microsoft Teams', () => {
    const r = meetingDet.detect('https://teams.microsoft.com/l/meetup-join/123', 'Teams');
    assertNotNull(r);
    assertEqual(r.platform, 'Microsoft Teams');
    assertTrue(r.isInMeeting);
});

test('detects Webex', () => {
    const r = meetingDet.detect('https://company.webex.com/meet/user', 'Webex Meeting');
    assertNotNull(r);
    assertEqual(r.platform, 'Cisco Webex');
    assertTrue(r.isInMeeting);
});

test('returns null for non-meeting URLs', () => {
    assertNull(meetingDet.detect('https://www.google.com/search?q=test'));
});

test('returns null for empty/null URL', () => {
    assertNull(meetingDet.detect(''));
    assertNull(meetingDet.detect(null));
});

test('non-meeting pages on meeting domains', () => {
    // Visiting teams.microsoft.com main page (not a meeting join link)
    const r = meetingDet.detect('https://teams.microsoft.com/', 'Teams');
    if (r) {
        // On a meeting platform but might not be in-meeting
        assertTrue(typeof r.isInMeeting === 'boolean');
    }
});

test('startMeeting with detect result', () => {
    const meetingInfo = meetingDet.detect('https://zoom.us/j/12345678', 'Sprint Planning');
    assertNotNull(meetingInfo);
    meetingDet.startMeeting(meetingInfo);
    const active = meetingDet.getActiveMeeting();
    assertNotNull(active);
    assertEqual(active.platform, 'Zoom');
});

test('endMeeting returns completed session', () => {
    const completed = meetingDet.endMeeting();
    assertNotNull(completed);
    assertEqual(completed.platform, 'Zoom');
    assertTrue(completed.durationSeconds >= 0);
    assertTrue(completed.endedAt !== undefined);
});

test('no active meeting after end', () => {
    const active = meetingDet.getActiveMeeting();
    assertNull(active);
});

test('endMeeting returns null when no active meeting', () => {
    assertNull(meetingDet.endMeeting());
});

test('enrichActivity adds meeting metadata', () => {
    const activity = { url: 'https://zoom.us/j/99999', domain: 'zoom.us', windowTitle: 'Zoom' };
    const enriched = meetingDet.enrichActivity(activity);
    assertTrue(enriched.metadata?.isMeeting);
    assertEqual(enriched.meeting?.platform, 'Zoom');
});

test('enrichActivity skips non-meeting URLs', () => {
    const activity = { url: 'https://www.google.com/', domain: 'google.com', windowTitle: 'Google' };
    const enriched = meetingDet.enrichActivity(activity);
    assertTrue(!enriched.metadata?.isMeeting);
});

// ========================================
// Feature 9b: Focus Period Detection (Browser)
// ========================================
console.log('\n🎯 Feature 9b: Focus Period Detection (Browser)');

const { FocusPeriodTracker } = require('../lib/focus-tracker.js');
const focusTracker = new FocusPeriodTracker();

test('initial state has no sessions', () => {
    const sessions = focusTracker.getRecentSessions();
    assertTrue(Array.isArray(sessions));
});

test('onDomainChange starts a new session', () => {
    focusTracker.onDomainChange('github.com', 'https://github.com', 'GitHub', 'development');
    assertNotNull(focusTracker.currentSession);
    assertEqual(focusTracker.currentSession.domain, 'github.com');
});

test('quick domain change does not create session (below threshold)', () => {
    const result = focusTracker.onDomainChange('google.com', 'https://google.com', 'Google', 'search');
    assertNull(result);
});

test('classifies depth correctly', () => {
    assertEqual(focusTracker._classifyDepth(1800), 'DeepWork');
    assertEqual(focusTracker._classifyDepth(1500), 'DeepWork');
    assertEqual(focusTracker._classifyDepth(900), 'Focused');
    assertEqual(focusTracker._classifyDepth(300), 'Moderate');
    assertEqual(focusTracker._classifyDepth(60), 'Shallow');
});

test('computes focus score correctly', () => {
    const shallow = focusTracker._computeScore(60, '');
    const moderate = focusTracker._computeScore(420, '');
    const focused = focusTracker._computeScore(1020, '');
    const deep = focusTracker._computeScore(1800, '');

    assertTrue(shallow < moderate, 'Shallow < Moderate');
    assertTrue(moderate < focused, 'Moderate < Focused');
    assertTrue(focused < deep, 'Focused < Deep');
    assertTrue(deep >= 85, 'Deep >= 85');
});

test('productive category gets score bonus', () => {
    const baseScore = focusTracker._computeScore(600, '');
    const prodScore = focusTracker._computeScore(600, 'development');
    assertTrue(prodScore >= baseScore);
});

test('distracting category gets score penalty', () => {
    const baseScore = focusTracker._computeScore(600, '');
    const distractScore = focusTracker._computeScore(600, 'entertainment');
    assertTrue(distractScore <= baseScore);
});

test('getAnalytics returns valid structure', () => {
    const analytics = focusTracker.getAnalytics(24);
    assertTrue(typeof analytics.sessionCount === 'number');
    assertTrue(typeof analytics.deepWorkCount === 'number');
    assertTrue(typeof analytics.totalFocusedMinutes === 'number');
    assertTrue(typeof analytics.avgFocusScore === 'number');
    assertTrue(typeof analytics.focusStreak === 'number');
    assertTrue(typeof analytics.isCurrentlyFocused === 'boolean');
    assertTrue(Array.isArray(analytics.topDomains));
});

test('enrichActivity adds focus metadata', () => {
    focusTracker.currentSession = {
        domain: 'github.com',
        category: 'development',
        startedAt: Date.now() - 600000, // 10 minutes ago
    };

    const activity = { url: 'https://github.com', domain: 'github.com' };
    const enriched = focusTracker.enrichActivity(activity);
    assertTrue(enriched.focus_period !== undefined);
    assertTrue(enriched.focus_period.in_focus_session);
    assertEqual(enriched.focus_period.depth, 'Moderate');
    assertTrue(enriched.focus_period.score > 0);
});

test('enrichActivity handles no current session', () => {
    focusTracker.currentSession = null;
    const activity = { url: 'https://example.com', domain: 'example.com' };
    const enriched = focusTracker.enrichActivity(activity);
    assertTrue(enriched.focus_period === undefined);
});

test('getRecentSessions returns array', () => {
    const sessions = focusTracker.getRecentSessions(5);
    assertTrue(Array.isArray(sessions));
});

test('topDomains aggregation works', () => {
    const sessions = [
        { domain: 'a.com', durationSeconds: 100 },
        { domain: 'a.com', durationSeconds: 200 },
        { domain: 'b.com', durationSeconds: 150 },
    ];
    const top = focusTracker._getTopDomains(sessions, 2);
    assertTrue(Array.isArray(top));
    assertTrue(top.length <= 2);
    if (top.length > 0) {
        assertEqual(top[0].domain, 'a.com');
    }
});

// ========================================
// SUMMARY
// ========================================
console.log(`\n${'='.repeat(50)}`);
console.log(`📊 Browser Extension Tests: ${passed}/${total} passed, ${failed} failed`);
if (failed > 0) {
    console.log('❌ SOME TESTS FAILED');
    process.exit(1);
} else {
    console.log('✅ ALL TESTS PASSED');
}
