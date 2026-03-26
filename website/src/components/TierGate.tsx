'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { useSubscription } from '@/lib/hooks/useBilling';

type Tier = 'pro' | 'enterprise';

interface TierGateProps {
    /** Minimum tier required to see the children */
    require: Tier;
    children: React.ReactNode;
    /** Custom fallback UI — defaults to an upgrade banner */
    fallback?: React.ReactNode;
    /** If true, render children but visually disabled with overlay */
    blur?: boolean;
}

/**
 * Wrapper that gates content behind a subscription tier.
 *
 * Usage:
 *   <TierGate require="pro">
 *     <CloudSyncSettings />
 *   </TierGate>
 */
export function TierGate({ require: requireTier, children, fallback, blur = false }: TierGateProps) {
    const { data: subscription, isLoading } = useSubscription();

    // While loading, show a content skeleton so the page doesn't flash
    if (isLoading) {
        return (
            <div className="animate-pulse rounded-xl h-16 w-full" style={{ background: 'var(--color-surface)' }} />
        );
    }

    const currentTier = subscription?.plan_type ?? 'free';
    const tierRank: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };
    const requiredRank = requireTier === 'pro' ? 1 : 2;
    const allowed = (tierRank[currentTier] ?? 0) >= requiredRank;

    if (allowed) return <>{children}</>;

    // Blur overlay mode: show content but locked
    if (blur) {
        return (
            <div className="relative">
                <div className="pointer-events-none select-none opacity-30 blur-sm">{children}</div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <UpgradePill tier={requireTier} />
                </div>
            </div>
        );
    }

    // Default fallback or custom fallback
    if (fallback) return <>{fallback}</>;

    return <UpgradeBanner tier={requireTier} />;
}

function UpgradePill({ tier }: { tier: Tier }) {
    return (
        <Link
            href="/dashboard/billing"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-all hover:scale-105"
            style={{ background: 'var(--color-accent)', color: '#fff' }}
        >
            <Lock className="w-3.5 h-3.5" />
            {tier === 'pro' ? 'Pro' : 'Enterprise'} Feature — Upgrade
        </Link>
    );
}

function UpgradeBanner({ tier }: { tier: Tier }) {
    return (
        <div
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{
                background: 'rgba(245, 158, 11, 0.06)',
                borderColor: 'rgba(245, 158, 11, 0.25)',
            }}
        >
            <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(245, 158, 11, 0.12)' }}
            >
                <Lock className="w-4 h-4" style={{ color: '#f59e0b' }} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                    {tier === 'pro' ? 'Pro' : 'Enterprise'} Feature
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                    Upgrade to unlock this feature and much more.
                </p>
            </div>
            <Link
                href="/dashboard/billing"
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all hover:opacity-90"
                style={{ background: 'var(--color-accent)', color: '#fff' }}
            >
                Upgrade →
            </Link>
        </div>
    );
}
