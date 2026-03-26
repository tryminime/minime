/**
 * MiniMe Activity Detector — Content Script
 *
 * Detects and reports specific activity types:
 *   1. Social media usage (Facebook, Twitter/X, Instagram, LinkedIn, Reddit, TikTok)
 *   2. Video watching (YouTube, Vimeo, Twitch)
 *   3. Search queries (Google, Bing, DuckDuckGo, Yahoo)
 *
 * Sends structured messages to the background service worker via chrome.runtime.sendMessage.
 */

(function () {
    'use strict';

    // Guard: only run once
    if (window.__miniMeActivityDetector) return;
    window.__miniMeActivityDetector = true;

    const host = window.location.hostname.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    const href = window.location.href;

    // ═══════════════════════════════════════════════════════════════
    // 1. SOCIAL MEDIA DETECTION
    // ═══════════════════════════════════════════════════════════════

    const SOCIAL_PLATFORMS = {
        'facebook.com': { name: 'Facebook', feedPath: /^\/(|home\.php|watch|groups|marketplace)/i },
        'www.facebook.com': { name: 'Facebook', feedPath: /^\/(|home\.php|watch|groups|marketplace)/i },
        'web.facebook.com': { name: 'Facebook', feedPath: /^\/(|home\.php|watch|groups|marketplace)/i },
        'twitter.com': { name: 'Twitter/X', feedPath: /^\/(home|explore|search|notifications|i\/)/i },
        'x.com': { name: 'Twitter/X', feedPath: /^\/(home|explore|search|notifications|i\/)/i },
        'www.instagram.com': { name: 'Instagram', feedPath: /^\/(|explore|reels|stories)/i },
        'instagram.com': { name: 'Instagram', feedPath: /^\/(|explore|reels|stories)/i },
        'www.linkedin.com': { name: 'LinkedIn', feedPath: /^\/(feed|in\/|company\/|posts|pulse)/i },
        'linkedin.com': { name: 'LinkedIn', feedPath: /^\/(feed|in\/|company\/|posts|pulse)/i },
        'www.reddit.com': { name: 'Reddit', feedPath: /^\/(|r\/|user\/|popular|all)/i },
        'reddit.com': { name: 'Reddit', feedPath: /^\/(|r\/|user\/|popular|all)/i },
        'old.reddit.com': { name: 'Reddit', feedPath: /^\/(|r\/|user\/)/i },
        'www.tiktok.com': { name: 'TikTok', feedPath: /^\/(|foryou|following|@)/i },
        'tiktok.com': { name: 'TikTok', feedPath: /^\/(|foryou|following|@)/i },
        'www.snapchat.com': { name: 'Snapchat', feedPath: /^\/(|discover|spotlight)/i },
        'www.threads.net': { name: 'Threads', feedPath: /^\/(|@)/i },
        'threads.net': { name: 'Threads', feedPath: /^\/(|@)/i },
        'mastodon.social': { name: 'Mastodon', feedPath: /^\/(|home|explore|public)/i },
        'bsky.app': { name: 'Bluesky', feedPath: /^\/(|profile\/|search)/i },
    };

    function detectSocialMedia() {
        const platform = SOCIAL_PLATFORMS[host];
        if (!platform) return;

        const startTime = Date.now();
        let scrollDepth = 0;
        let interactionCount = 0;
        let sentBeacon = false;

        // Track scroll depth
        function updateScroll() {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight;
            if (docHeight > 0) {
                scrollDepth = Math.max(scrollDepth, Math.round((scrollTop / docHeight) * 100));
            }
            interactionCount++;
        }

        // Track interactions (likes, clicks etc.)
        function trackInteraction() {
            interactionCount++;
        }

        window.addEventListener('scroll', updateScroll, { passive: true });
        document.addEventListener('click', trackInteraction, { passive: true });

        function sendSocialBeacon() {
            if (sentBeacon) return;
            sentBeacon = true;

            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            if (timeSpent < 3) return; // Skip very brief visits

            // Detect what kind of content they're viewing
            const isViewingFeed = platform.feedPath.test(path);
            const subreddit = host.includes('reddit') ? (path.match(/^\/r\/([^/]+)/)?.[1] || null) : null;
            const profile = path.match(/^\/@?([^/?]+)/)?.[1] || null;

            try {
                chrome.runtime.sendMessage({
                    action: 'social_media_activity',
                    payload: {
                        platform: platform.name,
                        url: href,
                        title: document.title.trim(),
                        domain: host,
                        time_spent_sec: timeSpent,
                        scroll_depth_pct: scrollDepth,
                        interaction_count: interactionCount,
                        is_feed: isViewingFeed,
                        subreddit: subreddit,
                        profile_viewed: profile,
                        content_type: isViewingFeed ? 'feed' : 'page',
                    },
                }, () => { chrome.runtime.lastError; });
            } catch (_) { }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') sendSocialBeacon();
        }, { passive: true });
        window.addEventListener('pagehide', sendSocialBeacon, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. VIDEO WATCHING DETECTION
    // ═══════════════════════════════════════════════════════════════

    const VIDEO_PLATFORMS = {
        'www.youtube.com': { name: 'YouTube' },
        'youtube.com': { name: 'YouTube' },
        'm.youtube.com': { name: 'YouTube' },
        'music.youtube.com': { name: 'YouTube Music' },
        'www.twitch.tv': { name: 'Twitch' },
        'twitch.tv': { name: 'Twitch' },
        'vimeo.com': { name: 'Vimeo' },
        'www.vimeo.com': { name: 'Vimeo' },
        'www.dailymotion.com': { name: 'Dailymotion' },
        'www.netflix.com': { name: 'Netflix' },
        'www.disneyplus.com': { name: 'Disney+' },
        'www.primevideo.com': { name: 'Prime Video' },
        'www.hulu.com': { name: 'Hulu' },
    };

    function detectVideoWatching() {
        const platform = VIDEO_PLATFORMS[host];
        if (!platform) return;

        const startTime = Date.now();
        let sentBeacon = false;
        let videoTitle = '';
        let channelName = '';
        let videoDuration = 0;
        let watchedSeconds = 0;
        let isPlaying = false;
        let playStartTime = 0;

        function extractYouTubeInfo() {
            // Video title
            const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, h1.title yt-formatted-string, #title h1');
            videoTitle = titleEl?.textContent?.trim() || document.title.replace(/ - YouTube$/, '').trim();

            // Channel name
            const channelEl = document.querySelector('#owner #channel-name a, #upload-info #channel-name a, ytd-video-owner-renderer #text a');
            channelName = channelEl?.textContent?.trim() || '';

            // Video duration from player
            const video = document.querySelector('video');
            if (video) {
                videoDuration = Math.floor(video.duration || 0);
                watchedSeconds = Math.floor(video.currentTime || 0);
            }
        }

        function extractGenericVideoInfo() {
            videoTitle = document.title.trim();
            const video = document.querySelector('video');
            if (video) {
                videoDuration = Math.floor(video.duration || 0);
                watchedSeconds = Math.floor(video.currentTime || 0);
            }
        }

        // Track video play/pause events
        function monitorVideo() {
            const video = document.querySelector('video');
            if (!video) return;

            video.addEventListener('play', () => {
                isPlaying = true;
                playStartTime = Date.now();
            });

            video.addEventListener('pause', () => {
                if (isPlaying && playStartTime > 0) {
                    watchedSeconds += Math.floor((Date.now() - playStartTime) / 1000);
                }
                isPlaying = false;
            });
        }

        // Delayed initialization — wait for player to load
        setTimeout(() => {
            if (platform.name === 'YouTube') {
                extractYouTubeInfo();
            } else {
                extractGenericVideoInfo();
            }
            monitorVideo();
        }, 3000);

        function sendVideoBeacon() {
            if (sentBeacon) return;
            sentBeacon = true;

            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            if (timeSpent < 5) return; // Skip very brief visits

            // Final info extraction
            if (platform.name === 'YouTube') {
                extractYouTubeInfo();
            } else {
                extractGenericVideoInfo();
            }

            // Add remaining play time
            if (isPlaying && playStartTime > 0) {
                watchedSeconds += Math.floor((Date.now() - playStartTime) / 1000);
            }

            // Determine if actually watching a video (vs browsing homepage)
            const isWatchingVideo = platform.name === 'YouTube'
                ? path.startsWith('/watch') || path.startsWith('/shorts')
                : !!document.querySelector('video');

            const watchPct = videoDuration > 0
                ? Math.min(100, Math.round((watchedSeconds / videoDuration) * 100))
                : 0;

            try {
                chrome.runtime.sendMessage({
                    action: 'video_watching',
                    payload: {
                        platform: platform.name,
                        url: href,
                        domain: host,
                        video_title: videoTitle || document.title.trim(),
                        channel: channelName,
                        video_duration_sec: videoDuration,
                        watched_seconds: watchedSeconds,
                        watch_pct: watchPct,
                        time_on_page_sec: timeSpent,
                        is_watching: isWatchingVideo,
                        content_type: isWatchingVideo ? 'video' : 'browse',
                        video_id: platform.name === 'YouTube'
                            ? new URLSearchParams(window.location.search).get('v') || null
                            : null,
                    },
                }, () => { chrome.runtime.lastError; });
            } catch (_) { }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') sendVideoBeacon();
        }, { passive: true });
        window.addEventListener('pagehide', sendVideoBeacon, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. SEARCH QUERY CAPTURE
    // ═══════════════════════════════════════════════════════════════

    const SEARCH_ENGINES = {
        'www.google.com': { name: 'Google', param: 'q' },
        'google.com': { name: 'Google', param: 'q' },
        'www.bing.com': { name: 'Bing', param: 'q' },
        'bing.com': { name: 'Bing', param: 'q' },
        'duckduckgo.com': { name: 'DuckDuckGo', param: 'q' },
        'www.duckduckgo.com': { name: 'DuckDuckGo', param: 'q' },
        'search.yahoo.com': { name: 'Yahoo', param: 'p' },
        'www.ecosia.org': { name: 'Ecosia', param: 'q' },
        'www.startpage.com': { name: 'Startpage', param: 'query' },
        'search.brave.com': { name: 'Brave Search', param: 'q' },
        'yandex.com': { name: 'Yandex', param: 'text' },
        'www.baidu.com': { name: 'Baidu', param: 'wd' },
    };

    function detectSearchQuery() {
        const engine = SEARCH_ENGINES[host];
        if (!engine) return;

        const params = new URLSearchParams(window.location.search);
        const query = params.get(engine.param);
        if (!query || !query.trim()) return; // No search query on this page

        const startTime = Date.now();
        let resultClicks = 0;
        let sentBeacon = false;

        // Count result clicks
        function trackResultClick(e) {
            const link = e.target.closest('a[href]');
            if (link && link.href && !link.href.includes(host)) {
                resultClicks++;
            }
        }
        document.addEventListener('click', trackResultClick, { passive: true });

        // Extract number of results if available
        function getResultCount() {
            // Google: "About 1,230,000 results"
            const statsEl = document.querySelector('#result-stats, .result-stats, .sb_count');
            if (statsEl) {
                const match = statsEl.textContent.match(/([\d,]+)\s*(results|résultats|ergebnisse)/i);
                if (match) return parseInt(match[1].replace(/,/g, ''), 10);
            }
            return null;
        }

        function sendSearchBeacon() {
            if (sentBeacon) return;
            sentBeacon = true;

            const timeSpent = Math.floor((Date.now() - startTime) / 1000);
            if (timeSpent < 2) return;

            try {
                chrome.runtime.sendMessage({
                    action: 'search_query',
                    payload: {
                        engine: engine.name,
                        query: query.trim(),
                        url: href,
                        domain: host,
                        time_on_results_sec: timeSpent,
                        result_clicks: resultClicks,
                        result_count: getResultCount(),
                        page: parseInt(params.get('start') || params.get('first') || '0', 10) / 10 + 1 || 1,
                    },
                }, () => { chrome.runtime.lastError; });
            } catch (_) { }
        }

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') sendSearchBeacon();
        }, { passive: true });
        window.addEventListener('pagehide', sendSearchBeacon, { passive: true });
    }

    // ═══════════════════════════════════════════════════════════════
    // RUN DETECTORS
    // ═══════════════════════════════════════════════════════════════

    detectSocialMedia();
    detectVideoWatching();
    detectSearchQuery();

})();
