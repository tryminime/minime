/**
 * URL Pattern Analyzer
 * 
 * Extracts meaningful patterns and metadata from URLs.
 * Identifies repositories, tickets, documents, and other structured content.
 */

export class URLAnalyzer {
    constructor() {
        // Pattern definitions for common platforms
        this.patterns = {
            // Code platforms
            github: {
                regex: /github\.com\/([^\/]+)\/([^\/]+)(?:\/([^\/]+))?(?:\/(.+))?/,
                extract: (match, url) => ({
                    type: 'github_repo',
                    owner: match[1],
                    repo: match[2],
                    section: match[3] || 'main',
                    path: match[4] || '',
                    entities: [match[1], match[2]],
                    category: 'code'
                })
            },

            gitlab: {
                regex: /gitlab\.com\/([^\/]+)\/([^\/]+)(?:\/(.+))?/,
                extract: (match) => ({
                    type: 'gitlab_repo',
                    owner: match[1],
                    repo: match[2],
                    path: match[3] || '',
                    entities: [match[1], match[2]],
                    category: 'code'
                })
            },

            stackoverflow: {
                regex: /stackoverflow\.com\/questions\/(\d+)\/([^\/]+)/,
                extract: (match) => ({
                    type: 'stackoverflow_question',
                    questionId: match[1],
                    slug: match[2],
                    entities: [match[2].replace(/-/g, ' ')],
                    category: 'code'
                })
            },

            // Project management
            jira: {
                regex: /([^\.]+)\.atlassian\.net\/browse\/([A-Z]+-\d+)/,
                extract: (match) => ({
                    type: 'jira_ticket',
                    workspace: match[1],
                    ticketId: match[2],
                    entities: [match[1], match[2]],
                    category: 'work'
                })
            },

            linear: {
                regex: /linear\.app\/([^\/]+)\/issue\/([^\/]+)/,
                extract: (match) => ({
                    type: 'linear_issue',
                    team: match[1],
                    issueId: match[2],
                    entities: [match[1], match[2]],
                    category: 'work'
                })
            },

            // Documentation
            googleDocs: {
                regex: /docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^\/]+)/,
                extract: (match) => ({
                    type: `google_${match[1]}`,
                    docId: match[2],
                    docType: match[1],
                    entities: [],
                    category: 'productivity'
                })
            },

            notion: {
                regex: /notion\.so\/([^\/]+)\/([^\/\?]+)/,
                extract: (match) => ({
                    type: 'notion_page',
                    workspace: match[1],
                    pageSlug: match[2],
                    entities: [match[1]],
                    category: 'productivity'
                })
            },

            confluence: {
                regex: /([^\.]+)\.atlassian\.net\/wiki\/spaces\/([^\/]+)/,
                extract: (match) => ({
                    type: 'confluence_space',
                    workspace: match[1],
                    space: match[2],
                    entities: [match[1], match[2]],
                    category: 'work'
                })
            },

            // Academic
            arxiv: {
                regex: /arxiv\.org\/abs\/(\d+\.\d+)/,
                extract: (match) => ({
                    type: 'arxiv_paper',
                    paperId: match[1],
                    entities: [match[1]],
                    category: 'learning'
                })
            },

            scholar: {
                regex: /scholar\.google\.com.*[\?&]q=([^&]+)/,
                extract: (match) => ({
                    type: 'scholar_search',
                    query: decodeURIComponent(match[1]),
                    entities: [decodeURIComponent(match[1])],
                    category: 'learning'
                })
            },

            // Media
            youtube: {
                regex: /youtube\.com\/watch\?v=([^&]+)|youtu\.be\/([^?]+)/,
                extract: (match) => ({
                    type: 'youtube_video',
                    videoId: match[1] || match[2],
                    entities: [],
                    category: 'entertainment'
                })
            },

            // Communication
            slack: {
                regex: /([^\.]+)\.slack\.com\/archives\/([^\/]+)/,
                extract: (match) => ({
                    type: 'slack_channel',
                    workspace: match[1],
                    channelId: match[2],
                    entities: [match[1]],
                    category: 'work'
                })
            },

            discord: {
                regex: /discord\.com\/channels\/(\d+)\/(\d+)/,
                extract: (match) => ({
                    type: 'discord_channel',
                    serverId: match[1],
                    channelId: match[2],
                    entities: [],
                    category: 'social'
                })
            }
        };
    }

    /**
     * Analyze a URL and extract structured metadata
     * @param {string} url - URL to analyze
     * @returns {Object} Metadata object with type, entities, category, etc.
     */
    analyze(url) {
        if (!url || typeof url !== 'string') {
            return this.getDefaultMetadata(url);
        }

        // Try each pattern
        for (const [platform, config] of Object.entries(this.patterns)) {
            const match = url.match(config.regex);
            if (match) {
                try {
                    const metadata = config.extract(match, url);
                    return {
                        ...metadata,
                        platform,
                        url,
                        analyzed: true,
                        timestamp: Date.now()
                    };
                } catch (error) {
                    console.error(`Error extracting ${platform} metadata:`, error);
                }
            }
        }

        // No pattern matched - return basic metadata
        return this.getDefaultMetadata(url);
    }

    /**
     * Get default metadata for URLs that don't match any pattern
     */
    getDefaultMetadata(url) {
        try {
            const urlObj = new URL(url);
            return {
                type: 'generic_url',
                domain: urlObj.hostname,
                path: urlObj.pathname,
                entities: [],
                category: 'other',
                platform: 'unknown',
                url,
                analyzed: true,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                type: 'invalid_url',
                url,
                entities: [],
                category: 'other',
                platform: 'unknown',
                analyzed: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Extract query parameters from URL
     * @param {string} url - URL to parse
     * @returns {Object} Query parameters as key-value pairs
     */
    extractQueryParams(url) {
        try {
            const urlObj = new URL(url);
            const params = {};
            urlObj.searchParams.forEach((value, key) => {
                params[key] = value;
            });
            return params;
        } catch (error) {
            return {};
        }
    }

    /**
     * Batch analyze multiple URLs
     * @param {Array<string>} urls - Array of URLs to analyze
     * @returns {Array<Object>} Array of metadata objects
     */
    batchAnalyze(urls) {
        if (!Array.isArray(urls)) {
            return [];
        }

        return urls.map(url => this.analyze(url));
    }

    /**
     * Check if URL matches a specific platform
     * @param {string} url - URL to check
     * @param {string} platform - Platform name (github, jira, etc.)
     * @returns {boolean} True if URL is from specified platform
     */
    isPlatform(url, platform) {
        const pattern = this.patterns[platform];
        if (!pattern) {
            return false;
        }

        return pattern.regex.test(url);
    }

    /**
     * Get all supported platforms
     * @returns {Array<string>} List of platform names
     */
    getSupportedPlatforms() {
        return Object.keys(this.patterns);
    }
}

// Export singleton instance
export const urlAnalyzer = new URLAnalyzer();

// Export class for testing
export default URLAnalyzer;
