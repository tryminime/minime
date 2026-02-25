module.exports = {
    ci: {
        collect: {
            url: [
                'http://localhost:3000',
                'http://localhost:3000/waitlist',
                'http://localhost:3000/pricing',
                'http://localhost:3000/about',
            ],
            numberOfRuns: 3,
            settings: {
                preset: 'desktop',
            },
        },
        assert: {
            assertions: {
                'categories:performance': ['error', { minScore: 0.9 }],
                'categories:accessibility': ['error', { minScore: 0.95 }],
                'categories:best-practices': ['error', { minScore: 0.95 }],
                'categories:seo': ['error', { minScore: 0.95 }],

                // Core Web Vitals
                'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
                'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-blocking-time': ['error', { maxNumericValue: 300 }],
            },
        },
        upload: {
            target: 'temporary-public-storage',
        },
    },
};
