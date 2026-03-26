/**
 * MiniMe Content Extractor — Content Script
 *
 * Injected into every web page. Measures:
 *   - Scroll depth (how much the user read)
 *   - Time on page (engagement indicator)
 *   - Content quality (word count, structure)
 *   - Page type (research > entertainment)
 *   - Selection / highlight events (explicit interest signal)
 *
 * Then computes an IMPORTANCE SCORE (0–100).
 * Only pages scoring ≥ IMPORTANCE_THRESHOLD are sent to the backend
 * for knowledge graph + RAG ingestion.
 */

(function () {
    'use strict';

    // ── Guard ────────────────────────────────────────────────────────────────
    const href = window.location.href;
    if (
        href.startsWith('chrome://') ||
        href.startsWith('chrome-extension://') ||
        href.startsWith('about:') ||
        href.startsWith('moz-extension://') ||
        href.startsWith('data:')
    ) return;

    if (window.__minimeExtracted) return;
    window.__minimeExtracted = true;

    // ── Constants ────────────────────────────────────────────────────────────
    const IMPORTANCE_THRESHOLD = 35;  // 0–100, pages below this are activity-only

    // Page-type importance base scores
    const PAGE_TYPE_SCORES = {
        research: 85,  // arxiv, pubmed, scholar
        documentation: 75,  // docs, readthedocs, MDN
        q_and_a: 65,  // StackOverflow, Quora
        article: 60,  // Medium, Substack, dev.to
        code_repo: 60,  // GitHub, GitLab
        wiki: 70,  // Wikipedia, wikis
        news: 35,  // News sites
        media: 10,  // YouTube, Netflix
        social: 10,  // Twitter, Reddit frontpage
        shopping: 5,  // ecommerce
        webpage: 40,  // generic
    };

    // Domains that are always high-importance regardless of time
    const HIGH_VALUE_DOMAINS = [
        /arxiv\.org/, /pubmed\.ncbi/, /scholar\.google/, /semanticscholar\.org/,
        /wikipedia\.org/, /nature\.com/, /science\.org/, /cell\.com/,
        /github\.com/, /stackoverflow\.com/, /docs\./,
        /readthedocs\.io/, /developer\.mozilla\.org/, /w3\.org/,
        /acm\.org/, /ieee\.org/, /springer\.com/, /jstor\.org/,
    ];

    // Domains that are always low-importance
    const LOW_VALUE_DOMAINS = [
        /facebook\.com/, /instagram\.com/, /tiktok\.com/, /twitter\.com/,
        /x\.com/, /netflix\.com/, /youtube\.com\/shorts/,
        /amazon\.com\/s\?/, /ebay\.com/, /etsy\.com/,
    ];

    // ── State ────────────────────────────────────────────────────────────────
    const startTime = Date.now();
    let maxScrollDepth = 0;         // 0–100 %
    let selectionCount = 0;         // times user highlighted text
    let selectionChars = 0;         // total characters highlighted
    let userInteracted = false;     // any scroll/click/key
    let extractionSent = false;     // prevent duplicate sends

    // ── Engagement tracking ──────────────────────────────────────────────────
    function updateScrollDepth() {
        userInteracted = true;
        const scrolled = window.scrollY + window.innerHeight;
        const total = Math.max(document.body.scrollHeight, 1);
        const depth = Math.min(100, Math.round(scrolled / total * 100));
        if (depth > maxScrollDepth) maxScrollDepth = depth;
    }

    function trackSelection() {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 10) {
            selectionCount++;
            selectionChars += sel.toString().length;
            userInteracted = true;
        }
    }

    window.addEventListener('scroll', updateScrollDepth, { passive: true });
    window.addEventListener('click', () => { userInteracted = true; }, { passive: true });
    window.addEventListener('keydown', () => { userInteracted = true; }, { passive: true });
    document.addEventListener('selectionchange', trackSelection, { passive: true });

    // Initial scroll depth read (page may already be scrolled)
    setTimeout(updateScrollDepth, 500);

    // ── DOM extraction helpers ───────────────────────────────────────────────
    const NOISE_SELECTORS = [
        'nav', 'header', 'footer', 'aside', 'script', 'style', 'noscript',
        '[role="navigation"]', '[role="banner"]', '[role="complementary"]',
        '.nav', '.navbar', '.sidebar', '.footer', '.header', '.ad', '.ads',
        '.advertisement', '.cookie-banner', '.popup', '.modal-overlay',
        '[aria-hidden="true"]', '.sr-only',
    ];

    const CONTENT_SELECTORS = [
        'article', '[role="main"]', 'main', '.article-body', '.post-content',
        '.entry-content', '.content-body', '#content', '#main-content',
        '.prose', '.markdown-body', '.readme', '[itemprop="articleBody"]',
    ];

    function findContentNode() {
        for (const selector of CONTENT_SELECTORS) {
            const el = document.querySelector(selector);
            if (el && el.innerText.trim().length > 200) return el;
        }
        return document.body;
    }

    function stripNoise(node) {
        const clone = node.cloneNode(true);
        for (const selector of NOISE_SELECTORS) {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        }
        return clone;
    }

    function extractCleanText(node) {
        const cleaned = stripNoise(node);
        const raw = cleaned.innerText || cleaned.textContent || '';
        return raw
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .join('\n')
            .substring(0, 50000);
    }

    function extractHeadings() {
        const headings = [];
        document.querySelectorAll('h1, h2, h3, h4').forEach(h => {
            const text = h.innerText.trim();
            if (text) headings.push({ level: parseInt(h.tagName[1]), text: text.substring(0, 200) });
        });
        return headings.slice(0, 30);
    }

    function extractLinks() {
        // Extract meaningful outbound links (articles, docs, papers)
        const links = [];
        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.href;
            const text = a.innerText.trim();
            if (
                href.startsWith('http') &&
                !href.includes(window.location.hostname) &&
                text.length > 3 && text.length < 120 &&
                links.length < 20
            ) {
                links.push({ url: href, text: text.substring(0, 100) });
            }
        });
        return links;
    }

    function extractMeta() {
        const get = (name) => {
            const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
            return el ? el.getAttribute('content') || '' : '';
        };
        return {
            description: get('description') || get('og:description'),
            author: get('author') || get('article:author'),
            published: get('article:published_time') || get('datePublished'),
            keywords: get('keywords'),
            og_type: get('og:type'),
        };
    }

    function detectPageType() {
        const host = window.location.hostname;
        if (/arxiv\.org|pubmed\.ncbi|scholar\.google|semanticscholar/.test(host)) return 'research';
        if (/github\.com|gitlab\.com|bitbucket\.org/.test(host)) return 'code_repo';
        if (/stackoverflow\.com|stackexchange\.com/.test(host)) return 'q_and_a';
        if (/docs\.|documentation\.|readthedocs\.|developer\.mozilla/.test(host)) return 'documentation';
        if (/medium\.com|dev\.to|substack\.com|hashnode\.com/.test(host)) return 'article';
        if (/youtube\.com|netflix\.com|twitch\.tv/.test(host)) return 'media';
        if (/twitter\.com|x\.com|facebook\.com|instagram\.com/.test(host)) return 'social';
        if (/amazon\.com|ebay\.com|etsy\.com/.test(host)) return 'shopping';
        if (/wikipedia\.org|wikimedia\.org/.test(host)) return 'wiki';
        if (/bbc\.|cnn\.|nytimes\.|reuters\.|apnews\./.test(host)) return 'news';

        const ogType = document.querySelector('meta[property="og:type"]');
        if (ogType) {
            const t = ogType.getAttribute('content') || '';
            if (t.includes('article')) return 'article';
            if (t.includes('video')) return 'media';
        }
        return 'webpage';
    }

    function readingTimeSec(text) {
        const words = text.split(/\s+/).length;
        return Math.max(1, Math.ceil(words / 200 * 60));
    }

    function getSelectedText() {
        try {
            const sel = window.getSelection();
            if (sel && sel.toString().trim().length > 10) {
                return sel.toString().trim().substring(0, 2000);
            }
        } catch (_) { }
        return '';
    }

    // ── Importance scoring ───────────────────────────────────────────────────
    /**
     * Compute an importance score 0–100 for this page visit.
     *
     * Signals (weighted):
     *   Page type base score         (0–85)   — type matters most
     *   Scroll depth bonus           (0–15)   — did user actually read it?
     *   Time on page bonus           (0–10)   — engagement duration
     *   Selection/highlight bonus    (0–15)   — explicit interest
     *   Content quality bonus        (0–10)   — word count, heading structure
     *   High-value domain override   (+30)    — always important domains
     *   Low-value domain penalty     (set 0)  — junk domains
     */
    function computeImportanceScore(opts) {
        const {
            pageType, timeOnPageMs, scrollDepth,
            wordCount, headingCount, selCount, selCharsTotal,
            url
        } = opts;

        const host = new URL(url).hostname;

        // Hard overrides
        if (LOW_VALUE_DOMAINS.some(r => r.test(host))) return 5;
        const isHighValue = HIGH_VALUE_DOMAINS.some(r => r.test(host));

        // Base score from page type
        let score = PAGE_TYPE_SCORES[pageType] || 40;

        // Scroll depth bonus (0-15)
        if (scrollDepth >= 80) score += 15;
        else if (scrollDepth >= 50) score += 10;
        else if (scrollDepth >= 25) score += 5;

        // Time on page bonus (0-10)
        const timeMin = timeOnPageMs / 60000;
        if (timeMin >= 5) score += 10;
        else if (timeMin >= 2) score += 7;
        else if (timeMin >= 1) score += 4;
        else if (timeMin >= 0.5) score += 2;

        // Selection / highlight bonus (0-15)
        if (selCount >= 3 || selCharsTotal > 500) score += 15;
        else if (selCount >= 1 || selCharsTotal > 100) score += 8;

        // Content quality bonus (0-10)
        if (wordCount >= 1500 && headingCount >= 3) score += 10;
        else if (wordCount >= 800) score += 6;
        else if (wordCount >= 300) score += 3;

        // High-value domain bonus
        if (isHighValue) score = Math.max(score, 70);

        // URL noise penalties
        if (/\/(login|signup|cart|checkout|404|error|search\?|feed$)/.test(url)) score = Math.min(score, 20);

        return Math.min(100, Math.max(0, Math.round(score)));
    }

    // ── Main extraction ──────────────────────────────────────────────────────
    function runExtraction() {
        if (extractionSent) return;

        try {
            const contentNode = findContentNode();
            const fullText = extractCleanText(contentNode);

            if (fullText.trim().length < 50) return;  // Skip near-empty pages

            const wordCount = fullText.split(/\s+/).filter(w => w).length;
            const headings = extractHeadings();
            const meta = extractMeta();
            const pageType = detectPageType();
            const timeOnPage = Date.now() - startTime;

            const importanceScore = computeImportanceScore({
                pageType,
                timeOnPageMs: timeOnPage,
                scrollDepth: maxScrollDepth,
                wordCount,
                headingCount: headings.length,
                selCount: selectionCount,
                selCharsTotal: selectionChars,
                url: window.location.href,
            });

            const isImportant = importanceScore >= IMPORTANCE_THRESHOLD;

            const payload = {
                url: window.location.href,
                title: document.title.trim(),
                full_text: isImportant ? fullText : fullText.substring(0, 2000),
                headings,
                links: isImportant ? extractLinks() : [],
                selected_text: getSelectedText(),
                meta,
                page_type: pageType,
                word_count: wordCount,
                reading_time_seconds: readingTimeSec(fullText),
                language: document.documentElement.lang || 'en',
                extracted_at: new Date().toISOString(),
                // Importance signals
                importance_score: importanceScore,
                is_important: isImportant,
                engagement: {
                    scroll_depth_pct: maxScrollDepth,
                    time_on_page_ms: timeOnPage,
                    selection_count: selectionCount,
                    selection_chars: selectionChars,
                    user_interacted: userInteracted,
                },
            };

            extractionSent = true;

            chrome.runtime.sendMessage({ action: 'content_extracted', payload }, (response) => {
                if (chrome.runtime.lastError) return; // Extension context invalidated
            });

        } catch (err) {
            console.debug('[MiniMe] Content extraction failed:', err.message);
        }
    }

    // Run after DOM + JS rendering
    if (document.readyState === 'complete') {
        setTimeout(runExtraction, 2000);
    } else {
        window.addEventListener('load', () => setTimeout(runExtraction, 1500));
    }

    // Re-run on SPA navigation (React/Next.js/Vue)
    let mutationTimer = null;
    const observer = new MutationObserver(() => {
        clearTimeout(mutationTimer);
        mutationTimer = setTimeout(() => {
            extractionSent = false;
            window.__minimeExtracted = false;
            runExtraction();
            window.__minimeExtracted = true;
        }, 3000);
    });

    observer.observe(document.body || document.documentElement, {
        childList: true,
        subtree: false,
    });

    // ── Reading Analytics beacon ────────────────────────────────────────────
    // Sends final scroll/reading metrics when user leaves the page.
    // This enriches the *activity* record (not the content extraction).
    let readingBeaconSent = false;

    function sendReadingAnalytics() {
        if (readingBeaconSent) return;
        readingBeaconSent = true;

        const timeOnPageSec = Math.floor((Date.now() - startTime) / 1000);
        if (timeOnPageSec < 3) return; // Skip very brief visits

        const contentNode = findContentNode();
        const rawText = (contentNode.innerText || contentNode.textContent || '').trim();
        const wordCount = rawText.split(/\s+/).filter(w => w).length;
        const estimatedReadTimeSec = Math.max(1, Math.ceil(wordCount / 200 * 60));

        // How much of the estimated reading time did the user actually spend?
        const estimatedReadPct = Math.min(100, Math.round((timeOnPageSec / estimatedReadTimeSec) * 100));

        try {
            chrome.runtime.sendMessage({
                action: 'reading_analytics',
                payload: {
                    url: window.location.href,
                    title: document.title.trim(),
                    domain: window.location.hostname,
                    scroll_depth_pct: maxScrollDepth,
                    time_on_page_sec: timeOnPageSec,
                    word_count: wordCount,
                    estimated_read_time_sec: estimatedReadTimeSec,
                    estimated_read_pct: estimatedReadPct,
                    selection_count: selectionCount,
                    user_interacted: userInteracted,
                },
            }, () => { chrome.runtime.lastError; }); // swallow errors
        } catch (_) { /* extension context gone */ }
    }

    // Fire on page visibility change (tab switch) and unload (navigation/close)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') sendReadingAnalytics();
    }, { passive: true });

    window.addEventListener('pagehide', sendReadingAnalytics, { passive: true });

})();
