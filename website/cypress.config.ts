import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: 'http://localhost:3000',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: true,
        screenshotOnRunFailure: true,

        setupNodeEvents(on, config) {
            // implement node event listeners here
        },

        env: {
            apiUrl: 'http://localhost:8000',
        },

        // Retry failed tests
        retries: {
            runMode: 2,
            openMode: 0,
        },
    },

    component: {
        devServer: {
            framework: 'next',
            bundler: 'webpack',
        },
    },
});
