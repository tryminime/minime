'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { useUsageMetrics } from '@/lib/hooks/useBilling';

const STORAGE_KEY = 'minime_usage_banner_dismissed';

/**
 * Shows a dismissible top banner when the user is approaching their plan limits.
 * Reads usage metrics and warns at 80%+ utilisation.
 * Dismiss is remembered in localStorage until next session.
 */
export function UsageWarningBanner() {
    const { data: usage } = useUsageMetrics();
    const [dismissed, setDismissed] = useState(true); // start hidden to avoid SSR flash

    useEffect(() => {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (!stored) setDismissed(false);
    }, []);

    const dismiss = () => {
        sessionStorage.setItem(STORAGE_KEY, '1');
        setDismissed(true);
    };

    if (dismissed || !usage) return null;

    // Find the most critical warning
    const warnings = usage.warnings ?? {};
    const critical = Object.entries(warnings).find(([, w]) => (w as any).exceeded);
    const warning = critical ?? Object.entries(warnings).find(([, w]) => (w as any).warning);

    if (!warning) return null;

    const [metricKey, info] = warning as [string, any];
    const isExceeded = info.exceeded;

    const metricLabel: Record<string, string> = {
        activities: 'monthly activity',
        graph_nodes: 'knowledge graph node',
        api_calls: 'daily API call',
    };
    const label = metricLabel[metricKey] ?? metricKey;
    const pct = info.percent_used ?? 0;
    const lim = info.limit;
    const cur = info.current;

    return (
        <div
            className="flex items-center gap-3 px-4 py-2.5 text-sm relative"
            style={{
                background: isExceeded
                    ? 'rgba(239, 68, 68, 0.1)'
                    : 'rgba(245, 158, 11, 0.1)',
                borderBottom: `1px solid ${isExceeded ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
            }}
        >
            <AlertTriangle
                className="w-4 h-4 flex-shrink-0"
                style={{ color: isExceeded ? '#ef4444' : '#f59e0b' }}
            />
            <span style={{ color: 'var(--color-primary)' }}>
                {isExceeded
                    ? `You've exceeded your ${label} limit (${cur}/${lim}).`
                    : `You've used ${pct}% of your ${label} limit (${cur}/${lim}).`}
                {' '}
                <Link
                    href="/dashboard/billing"
                    className="font-semibold underline underline-offset-2 hover:no-underline"
                    style={{ color: isExceeded ? '#ef4444' : '#f59e0b' }}
                >
                    Upgrade to Pro for unlimited tracking.
                </Link>
            </span>
            <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="ml-auto flex-shrink-0 p-1 rounded opacity-60 hover:opacity-100 transition-opacity"
            >
                <X className="w-3.5 h-3.5" style={{ color: 'var(--color-muted)' }} />
            </button>
        </div>
    );
}
