'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Zap, Check } from 'lucide-react';
import { useCreateCheckout } from '@/lib/hooks/useBilling';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Short name of the feature that triggered the modal */
    featureName?: string;
    /** Minimum tier required */
    tier?: 'pro' | 'enterprise';
}

const PRO_HIGHLIGHTS = [
    'Unlimited Knowledge Base (500 items)',
    'AI Copilot chat with your history',
    'Cloud Sync (Google Drive + OneDrive)',
    'Advanced analytics & weekly digest',
    'Manual document upload & export',
    'Knowledge Base collections',
];

/**
 * Modal that appears when a gated feature is clicked.
 * Shows Pro highlights and starts the Stripe checkout flow.
 */
export function UpgradeModal({ isOpen, onClose, featureName, tier = 'pro' }: UpgradeModalProps) {
    const checkout = useCreateCheckout();

    const handleUpgrade = () => {
        checkout.mutate({
            plan_type: tier,
            success_url: `${window.location.origin}/billing/success?plan=${tier}`,
            cancel_url: window.location.href,
        });
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                {/* Header */}
                <div
                    className="relative px-6 py-5"
                    style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))' }}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
                    >
                        <X className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
                        >
                            <Zap className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
                                Upgrade to {tier === 'pro' ? 'Pro' : 'Enterprise'}
                            </p>
                            <h2 className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                                {featureName ? `Unlock ${featureName}` : 'Unlock the full MiniMe'}
                            </h2>
                        </div>
                    </div>

                    <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                        Start a 14-day free trial today. No credit card required to start.
                    </p>
                </div>

                {/* Feature list */}
                <div className="px-6 py-5 space-y-2.5">
                    {PRO_HIGHLIGHTS.map((item) => (
                        <div key={item} className="flex items-center gap-2.5">
                            <div
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(16,185,129,0.12)' }}
                            >
                                <Check className="w-3 h-3" style={{ color: '#10b981' }} />
                            </div>
                            <span className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                                {item}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Pricing + CTA */}
                <div className="px-6 pb-6 space-y-3">
                    <div className="text-center">
                        <span className="text-3xl font-black" style={{ color: 'var(--color-primary)' }}>
                            $15
                        </span>
                        <span className="text-sm" style={{ color: 'var(--color-muted)' }}>/month billed annually</span>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                            or $19/month month-to-month
                        </p>
                    </div>

                    <button
                        onClick={handleUpgrade}
                        disabled={checkout.isPending}
                        className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                        style={{ background: 'var(--color-accent)', color: '#fff' }}
                    >
                        {checkout.isPending ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Redirecting to checkout…
                            </span>
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                Start 14-day Free Trial
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                        Cancel anytime.{' '}
                        <Link href="/pricing" onClick={onClose} className="underline hover:no-underline">
                            Compare all plans
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
