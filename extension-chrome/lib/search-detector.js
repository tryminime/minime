/**
 * Search Query Detector
 *
 * Detects search engine queries from URLs and extracts the search term.
 * Supports Google, Bing, DuckDuckGo, Yahoo, Brave, Ecosia, Yandex, Baidu.
 */

export class SearchDetector {
    constructor() {
        // Each entry: { name, icon, queryParams (list of URL param keys that hold the query) }
        this.engines = {
            'google.com': { name: 'Google', icon: '🔍', params: ['q'] },
            'www.google.com': { name: 'Google', icon: '🔍', params: ['q'] },
            'bing.com': { name: 'Bing', icon: '🅱️', params: ['q'] },
            'www.bing.com': { name: 'Bing', icon: '🅱️', params: ['q'] },
            'duckduckgo.com': { name: 'DuckDuckGo', icon: '🦆', params: ['q'] },
            'search.yahoo.com': { name: 'Yahoo', icon: '🟣', params: ['p'] },
            'search.brave.com': { name: 'Brave', icon: '🦁', params: ['q'] },
            'ecosia.org': { name: 'Ecosia', icon: '🌳', params: ['q'] },
            'www.ecosia.org': { name: 'Ecosia', icon: '🌳', params: ['q'] },
            'yandex.com': { name: 'Yandex', icon: '🔎', params: ['text'] },
            'www.baidu.com': { name: 'Baidu', icon: '🔵', params: ['wd', 'word'] },
            'baidu.com': { name: 'Baidu', icon: '🔵', params: ['wd', 'word'] },
            'startpage.com': { name: 'Startpage', icon: '🔐', params: ['query'] },
            'www.startpage.com': { name: 'Startpage', icon: '🔐', params: ['query'] },
            'kagi.com': { name: 'Kagi', icon: '🟡', params: ['q'] },
            'perplexity.ai': { name: 'Perplexity', icon: '🧠', params: ['q'] },
            'www.perplexity.ai': { name: 'Perplexity', icon: '🧠', params: ['q'] },
        };

        // URL path patterns that indicate a search results page (not a homepage)
        this.searchPaths = [
            /\/search/i,
            /\/results/i,
            /\/web/i,           // DuckDuckGo uses /?q=
            /\/s\?/i,           // Baidu
        ];
    }

    /**
     * Detect if a URL is a search query.
     * @param {string} url - Full URL
     * @returns {Object|null} {engine, query, icon} or null
     */
    detect(url) {
        if (!url || typeof url !== 'string') return null;

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace(/^www\./, '');

            // Find matching engine
            const engineKey = Object.keys(this.engines).find(key => {
                const cleanKey = key.replace(/^www\./, '');
                return hostname === cleanKey || hostname.endsWith('.' + cleanKey);
            });

            if (!engineKey) return null;

            const engine = this.engines[engineKey];

            // Extract query from URL params
            for (const param of engine.params) {
                const query = urlObj.searchParams.get(param);
                if (query && query.trim().length > 0) {
                    return {
                        engine: engine.name,
                        icon: engine.icon,
                        query: query.trim(),
                        isSearch: true,
                    };
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Quick check if URL is a search engine query.
     * @param {string} url
     * @returns {boolean}
     */
    isSearch(url) {
        return this.detect(url) !== null;
    }

    /**
     * Enrich an activity event with search metadata.
     * @param {Object} activity - Activity event
     * @returns {Object} Enriched activity
     */
    enrichActivity(activity) {
        const { url } = activity;
        if (!url) return activity;

        const searchData = this.detect(url);
        if (!searchData) return activity;

        return {
            ...activity,
            activityType: 'SearchQuery',
            search: {
                engine: searchData.engine,
                icon: searchData.icon,
                query: searchData.query,
            },
            metadata: {
                ...(activity.metadata || {}),
                isSearch: true,
                searchEngine: searchData.engine,
                searchQuery: searchData.query,
            },
        };
    }
}

export const searchDetector = new SearchDetector();
export default SearchDetector;
