import { NextResponse } from 'next/server';

/**
 * Sentry Error Tracking Configuration
 * 
 * This file shows you where to add Sentry integration.
 * Install: npm install @sentry/nextjs
 * Then run: npx @sentry/wizard -i nextjs
 */

export async function GET() {
    return NextResponse.json({
        message: 'Install Sentry with: npx @sentry/wizard -i nextjs',
        docs: 'https://docs.sentry.io/platforms/javascript/guides/nextjs/',
    });
}
