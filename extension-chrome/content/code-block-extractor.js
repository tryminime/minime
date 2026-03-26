/**
 * MiniMe Code Block Extractor — Content Script
 *
 * Finds and extracts code blocks from web pages:
 * - Standard <pre><code> blocks
 * - GitHub file views (.highlight .blob-code-content)
 * - CodePen / JSFiddle embeds
 * - StackOverflow code blocks (.s-code-block)
 * - Inline code statistics (language distribution)
 *
 * Called by content-extractor.js, results merged into the content payload.
 */

(function () {
    'use strict';

    // Language detection from CSS class names
    const LANG_CLASS_PATTERNS = [
        [/language-(\w+)/, 1],
        [/highlight-(\w+)/, 1],
        [/lang-(\w+)/, 1],
        [/(\w+)-code/, 1],
        [/brush:\s*(\w+)/, 1],
    ];

    /**
     * Detect language from element class list.
     */
    function detectLang(el) {
        const className = (el.className || '') + ' ' +
            ((el.closest ? el.closest('pre, div')?.className : '') || '');

        for (const [pattern, group] of LANG_CLASS_PATTERNS) {
            const m = className.match(pattern);
            if (m) return m[group].toLowerCase();
        }
        return 'unknown';
    }

    /**
     * Extract standard <pre><code> blocks.
     */
    function extractPreCodeBlocks() {
        const blocks = [];
        document.querySelectorAll('pre code, pre.code').forEach(el => {
            const text = el.innerText || el.textContent || '';
            if (text.trim().length < 20) return;

            const lang = detectLang(el) || detectLang(el.parentElement);
            blocks.push({
                type: 'code_block',
                language: lang,
                code: text.trim().substring(0, 5000),
                line_count: text.split('\n').length,
            });
        });
        return blocks;
    }

    /**
     * Extract GitHub file view code (blob view).
     */
    function extractGitHubCode() {
        if (!window.location.hostname.includes('github.com')) return [];
        const blocks = [];

        // Blob view: language in breadcrumb
        const langEl = document.querySelector('.file-info .information-tooltip-icon');
        const lang = langEl ? langEl.getAttribute('aria-label') || 'unknown' : 'unknown';

        const codeEl = document.querySelector('.blob-wrapper-embedded, .js-blob-code-container');
        if (codeEl) {
            const text = codeEl.innerText || '';
            if (text.trim().length > 20) {
                blocks.push({
                    type: 'github_file',
                    language: lang.toLowerCase(),
                    code: text.trim().substring(0, 10000),
                    line_count: text.split('\n').length,
                    file_path: document.title.split('·')[0]?.trim() || '',
                });
            }
        }
        return blocks;
    }

    /**
     * Extract StackOverflow code blocks.
     */
    function extractStackOverflowCode() {
        if (!window.location.hostname.includes('stackoverflow.com') &&
            !window.location.hostname.includes('stackexchange.com')) {
            return [];
        }

        const blocks = [];
        document.querySelectorAll('.s-code-block, .lang-all, pre code').forEach(el => {
            const text = el.innerText || '';
            if (text.trim().length < 20) return;
            const lang = detectLang(el);
            blocks.push({
                type: 'stackoverflow_snippet',
                language: lang,
                code: text.trim().substring(0, 3000),
                line_count: text.split('\n').length,
            });
        });
        return blocks.slice(0, 5);  // Max 5 per page
    }

    /**
     * Count language distribution across all code blocks on the page.
     */
    function getLanguageDistribution(blocks) {
        const dist = {};
        for (const b of blocks) {
            if (b.language && b.language !== 'unknown') {
                dist[b.language] = (dist[b.language] || 0) + 1;
            }
        }
        return dist;
    }

    /**
     * Main: collect all code blocks from the page.
     */
    function extractAllCodeBlocks() {
        const allBlocks = [
            ...extractPreCodeBlocks(),
            ...extractGitHubCode(),
            ...extractStackOverflowCode(),
        ].slice(0, 20);  // Max 20 code blocks per page

        return {
            blocks: allBlocks,
            total_blocks: allBlocks.length,
            language_distribution: getLanguageDistribution(allBlocks),
        };
    }

    // Expose as global so content-extractor.js can call it
    window.__minimeCodeExtractor = { extractAllCodeBlocks };

})();
