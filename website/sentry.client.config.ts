// Sentry client-side configuration for Next.js
// Initialize Sentry for browser-side error tracking and performance monitoring

import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

    // Environment and release tagging
    environment: process.env.NODE_ENV || "development",
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || "minime-web@0.1.0",

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Session replay (optional, for debugging UX issues)
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 0.1,

    // Integrations
    integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
    ],

    // Filter out non-actionable errors
    ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Non-Error promise rejection captured",
        /Loading chunk \d+ failed/,
        "Network request failed",
        "AbortError",
    ],

    // PII scrubbing — remove sensitive headers/cookies before sending
    beforeSend(event) {
        if (event.request) {
            // Remove auth headers
            if (event.request.headers) {
                delete event.request.headers["authorization"];
                delete event.request.headers["cookie"];
                delete event.request.headers["x-api-key"];
            }
        }
        return event;
    },

    // Breadcrumb filtering — limit noisy console logs
    beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.category === "console" && breadcrumb.level === "debug") {
            return null; // drop debug console breadcrumbs
        }
        return breadcrumb;
    },
});
