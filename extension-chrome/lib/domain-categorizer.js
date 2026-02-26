/**
 * Domain Categorizer
 * 
 * Automatically categorizes domains into predefined categories.
 * Supports 100+ popular domains with fallback to heuristic categorization.
 */

export class DomainCategorizer {
    constructor() {
        // Comprehensive domain category mappings
        this.domainCategories = {
            // Code & Development
            'github.com': 'code',
            'gitlab.com': 'code',
            'bitbucket.org': 'code',
            'stackoverflow.com': 'code',
            'stackexchange.com': 'code',
            'replit.com': 'code',
            'codesandbox.io': 'code',
            'codepen.io': 'code',
            'jsfiddle.net': 'code',
            'npm.org': 'code',
            'npmjs.com': 'code',
            'pypi.org': 'code',
            'crates.io': 'code',
            'packagist.org': 'code',

            // Work & Productivity
            'jira.atlassian.com': 'work',
            'atlassian.net': 'work',
            'linear.app': 'work',
            'asana.com': 'work',
            'monday.com': 'work',
            'clickup.com': 'work',
            'trello.com': 'work',
            'slack.com': 'work',
            'teams.microsoft.com': 'work',
            'zoom.us': 'work',
            'meet.google.com': 'work',
            'webex.com': 'work',
            'notion.so': 'productivity',
            'notion.site': 'productivity',
            'coda.io': 'productivity',
            'airtable.com': 'productivity',
            'todoist.com': 'productivity',
            'any.do': 'productivity',
            'evernote.com': 'productivity',
            'onenote.com': 'productivity',

            // Google Services
            'docs.google.com': 'productivity',
            'sheets.google.com': 'productivity',
            'slides.google.com': 'productivity',
            'drive.google.com': 'productivity',
            'calendar.google.com': 'productivity',
            'gmail.com': 'productivity',
            'mail.google.com': 'productivity',

            // Learning & Education
            'coursera.org': 'learning',
            'udemy.com': 'learning',
            'edx.org': 'learning',
            'khanacademy.org': 'learning',
            'linkedin.com/learning': 'learning',
            'pluralsight.com': 'learning',
            'skillshare.com': 'learning',
            'udacity.com': 'learning',
            'arxiv.org': 'learning',
            'scholar.google.com': 'learning',
            'researchgate.net': 'learning',
            'jstor.org': 'learning',
            'wikipedia.org': 'learning',
            'wikihow.com': 'learning',
            'medium.com': 'learning',
            'dev.to': 'learning',
            'hashnode.com': 'learning',

            // Social Media
            'twitter.com': 'social',
            'x.com': 'social',
            'facebook.com': 'social',
            'instagram.com': 'social',
            'linkedin.com': 'social',
            'reddit.com': 'social',
            'discord.com': 'social',
            'tiktok.com': 'social',
            'snapchat.com': 'social',
            'pinterest.com': 'social',
            'tumblr.com': 'social',
            'mastodon.social': 'social',

            // Entertainment
            'youtube.com': 'entertainment',
            'youtu.be': 'entertainment',
            'netflix.com': 'entertainment',
            'hulu.com': 'entertainment',
            'disneyplus.com': 'entertainment',
            'primevideo.com': 'entertainment',
            'spotify.com': 'entertainment',
            'soundcloud.com': 'entertainment',
            'twitch.tv': 'entertainment',
            'vimeo.com': 'entertainment',
            'dailymotion.com': 'entertainment',

            // News & Media
            'nytimes.com': 'news',
            'washingtonpost.com': 'news',
            'theguardian.com': 'news',
            'bbc.com': 'news',
            'cnn.com': 'news',
            'reuters.com': 'news',
            'apnews.com': 'news',
            'bloomberg.com': 'news',
            'techcrunch.com': 'news',
            'theverge.com': 'news',
            'arstechnica.com': 'news',
            'wired.com': 'news',
            'hackernews.com': 'news',
            'news.ycombinator.com': 'news',

            // Shopping & E-commerce
            'amazon.com': 'shopping',
            'ebay.com': 'shopping',
            'etsy.com': 'shopping',
            'shopify.com': 'shopping',
            'walmart.com': 'shopping',
            'target.com': 'shopping',
            'aliexpress.com': 'shopping',
            'alibaba.com': 'shopping',

            // Finance
            'paypal.com': 'finance',
            'stripe.com': 'finance',
            'coinbase.com': 'finance',
            'robinhood.com': 'finance',
            'chase.com': 'finance',
            'bankofamerica.com': 'finance',

            // Design & Creative
            'figma.com': 'design',
            'canva.com': 'design',
            'dribbble.com': 'design',
            'behance.net': 'design',
            'adobe.com': 'design',
            'sketch.com': 'design',

            // Cloud & Infrastructure
            'aws.amazon.com': 'infrastructure',
            'console.aws.amazon.com': 'infrastructure',
            'cloud.google.com': 'infrastructure',
            'azure.microsoft.com': 'infrastructure',
            'heroku.com': 'infrastructure',
            'vercel.com': 'infrastructure',
            'netlify.com': 'infrastructure',
            'digitalocean.com': 'infrastructure',
        };

        // Category metadata
        this.categoryMetadata = {
            code: { label: 'Code & Development', icon: '💻', color: '#10b981' },
            work: { label: 'Work', icon: '💼', color: '#3b82f6' },
            productivity: { label: 'Productivity', icon: '📝', color: '#8b5cf6' },
            learning: { label: 'Learning', icon: '📚', color: '#f59e0b' },
            social: { label: 'Social', icon: '👥', color: '#ec4899' },
            entertainment: { label: 'Entertainment', icon: '🎬', color: '#ef4444' },
            news: { label: 'News', icon: '📰', color: '#6366f1' },
            shopping: { label: 'Shopping', icon: '🛒', color: '#14b8a6' },
            finance: { label: 'Finance', icon: '💰', color: '#22c55e' },
            design: { label: 'Design', icon: '🎨', color: '#f97316' },
            infrastructure: { label: 'Infrastructure', icon: '☁️', color: '#06b6d4' },
            other: { label: 'Other', icon: '📄', color: '#6b7280' }
        };
    }

    /**
     * Extract domain from URL
     * @param {string} url - Full URL
     * @returns {string} Domain name
     */
    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace(/^www\./, '');
        } catch (error) {
            return '';
        }
    }

    /**
     * Categorize a domain
     * @param {string} url - URL or domain to categorize
     * @returns {string} Category name
     */
    categorize(url) {
        if (!url || typeof url !== 'string') {
            return 'other';
        }

        const domain = url.includes('://') ? this.extractDomain(url) : url;

        // Direct match
        if (this.domainCategories[domain]) {
            return this.domainCategories[domain];
        }

        // Check if domain contains any known pattern
        for (const [knownDomain, category] of Object.entries(this.domainCategories)) {
            if (domain.includes(knownDomain) || knownDomain.includes(domain)) {
                return category;
            }
        }

        // Heuristic categorization
        return this.heuristicCategorize(domain);
    }

    /**
     * Heuristic categorization based on domain patterns
     * @param {string} domain - Domain to categorize
     * @returns {string} Category name
     */
    heuristicCategorize(domain) {
        // Code-related keywords
        if (domain.match(/git|code|dev|api|docs|npm|pypi|maven/i)) {
            return 'code';
        }

        // Work-related keywords
        if (domain.match(/jira|confluence|slack|teams|workspace/i)) {
            return 'work';
        }

        // Learning keywords
        if (domain.match(/learn|edu|university|course|tutorial|academy/i)) {
            return 'learning';
        }

        // News keywords
        if (domain.match(/news|times|post|gazette|herald/i)) {
            return 'news';
        }

        // Shopping keywords
        if (domain.match(/shop|store|buy|market|cart/i)) {
            return 'shopping';
        }

        return 'other';
    }

    /**
     * Get category metadata (label, icon, color)
     * @param {string} category - Category name
     * @returns {Object} Category metadata
     */
    getCategoryMetadata(category) {
        return this.categoryMetadata[category] || this.categoryMetadata.other;
    }

    /**
     * Get all categories
     * @returns {Array<string>} List of all category names
     */
    getAllCategories() {
        return Object.keys(this.categoryMetadata);
    }

    /**
     * Batch categorize multiple URLs
     * @param {Array<string>} urls - Array of URLs to categorize
     * @returns {Array<Object>} Array of {url, domain, category, metadata}
     */
    batchCategorize(urls) {
        if (!Array.isArray(urls)) {
            return [];
        }

        return urls.map(url => {
            const domain = this.extractDomain(url);
            const category = this.categorize(url);
            const metadata = this.getCategoryMetadata(category);

            return {
                url,
                domain,
                category,
                metadata
            };
        });
    }

    /**
     * Get statistics on domain categories
     * @param {Array<string>} urls - Array of URLs
     * @returns {Object} Category counts and percentages
     */
    getStatistics(urls) {
        const categorized = this.batchCategorize(urls);
        const counts = {};

        categorized.forEach(item => {
            counts[item.category] = (counts[item.category] || 0) + 1;
        });

        const total = urls.length;
        const stats = {};

        for (const [category, count] of Object.entries(counts)) {
            stats[category] = {
                count,
                percentage: ((count / total) * 100).toFixed(1),
                metadata: this.getCategoryMetadata(category)
            };
        }

        return stats;
    }

    /**
     * Add custom domain mapping
     * @param {string} domain - Domain to map
     * @param {string} category - Category to assign
     */
    addCustomMapping(domain, category) {
        this.domainCategories[domain] = category;
    }

    /**
     * Get domains in a specific category
     * @param {string} category - Category name
     * @returns {Array<string>} List of domains in category
     */
    getDomainsInCategory(category) {
        return Object.entries(this.domainCategories)
            .filter(([_, cat]) => cat === category)
            .map(([domain]) => domain);
    }
}

// Export singleton instance
export const domainCategorizer = new DomainCategorizer();

// Export class for testing
export default DomainCategorizer;
