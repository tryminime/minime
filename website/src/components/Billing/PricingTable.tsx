'use client';

import { Check, X, TrendingUp, Sparkles, Zap, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useSubscription, useCreateCheckout, useUpdateSubscription } from '@/lib/hooks/useBilling';
import { isTestMode } from '@/lib/stripe';

interface PricingPlan {
    id: 'free' | 'pro' | 'enterprise';
    name: string;
    price: number;
    description: string;
    features: string[];
    popular?: boolean;
    cta: string;
    icon: React.ReactNode;
}

const PLANS: PricingPlan[] = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        description: 'Perfect for getting started',
        icon: <Sparkles className="w-5 h-5" />,
        cta: 'Current Plan',
        features: [
            '100 activities/month',
            'Basic analytics',
            '7-day weekly digests',
            'Community support',
            '100 graph nodes',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 19,
        description: 'For power users',
        icon: <Zap className="w-5 h-5" />,
        popular: true,
        cta: 'Upgrade to Pro',
        features: [
            'Unlimited activities',
            'Advanced analytics',
            'Real-time insights',
            'Skills tracking',
            'Knowledge graph (500 nodes)',
            'Email support',
        ],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 99,
        description: 'For teams and organizations',
        icon: <TrendingUp className="w-5 h-5" />,
        cta: 'Upgrade to Enterprise',
        features: [
            'Everything in Pro',
            'Unlimited knowledge graph',
            'Custom integrations',
            'API access',
            'Priority support',
            'Team features',
            'Custom SLA',
        ],
    },
];

export function PricingTable() {
    const { data: subscription } = useSubscription();
    const createCheckout = useCreateCheckout();
    const updateSubscription = useUpdateSubscription();

    const currentPlan = subscription?.plan_type || 'free';
    const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

    const processUpgrade = (planId: string) => {
        const baseUrl = window.location.origin;
        const successUrl = `${baseUrl}/dashboard/billing?success=true`;
        const cancelUrl = `${baseUrl}/dashboard/billing`;

        if (currentPlan === 'free') {
            createCheckout.mutate({
                plan_type: planId,
                success_url: successUrl,
                cancel_url: cancelUrl,
            });
        } else {
            updateSubscription.mutate(planId);
        }
    };

    const handleUpgrade = (planId: string) => {
        if (planId === 'free') return;
        if (planId === 'enterprise') {
            setShowEnterpriseModal(true);
            return;
        }
        processUpgrade(planId);
    };

    return (
        <div className="space-y-6">
            {/* Test Mode Banner */}
            {isTestMode() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Test Mode:</strong> You can use test card <code className="bg-yellow-100 px-1 py-0.5 rounded">4242 4242 4242 4242</code> for testing payments
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLANS.map((plan) => {
                    const isCurrent = currentPlan === plan.id;
                    const canUpgrade = (
                        (currentPlan === 'free' && plan.id !== 'free') ||
                        (currentPlan === 'pro' && plan.id === 'enterprise')
                    );
                    const canDowngrade = (
                        (currentPlan === 'enterprise' && plan.id === 'pro') ||
                        (currentPlan !== 'free' && plan.id === 'free')
                    );

                    return (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl border-2 p-6 transition-all ${plan.popular
                                    ? 'border-blue-500 shadow-xl scale-105'
                                    : isCurrent
                                        ? 'border-green-500 shadow-lg'
                                        : 'border-gray-200 hover:border-gray-300 shadow-sm'
                                }`}
                        >
                            {/* Popular Badge */}
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                                        MOST POPULAR
                                    </span>
                                </div>
                            )}

                            {/* Current Plan Badge */}
                            {isCurrent && !plan.popular && (
                                <div className="absolute -top-3 right-4">
                                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                        CURRENT
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-3">
                                <div className={`p-2 rounded-lg ${plan.popular ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {plan.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                            </div>

                            <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                                <span className="text-gray-600">/month</span>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => handleUpgrade(plan.id)}
                                disabled={isCurrent || (!canUpgrade && !canDowngrade) || createCheckout.isPending || updateSubscription.isPending}
                                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${isCurrent
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : plan.popular
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                                            : 'bg-gray-900 text-white hover:bg-gray-800'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {createCheckout.isPending || updateSubscription.isPending
                                    ? 'Processing...'
                                    : isCurrent
                                        ? 'Current Plan'
                                        : canUpgrade
                                            ? plan.cta
                                            : canDowngrade
                                                ? `Downgrade to ${plan.name}`
                                                : 'Not Available'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Enterprise Confirmation Modal */}
            {showEnterpriseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Upgrade to Enterprise</h3>
                        </div>
                        
                        <div className="space-y-4 mb-8">
                            <p className="text-gray-600 leading-relaxed">
                                You are about to upgrade your subscription to the <strong>Enterprise Plan</strong> at <strong>$99/month</strong>.
                            </p>
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-900 mb-1 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" /> Enterprise Benefits
                                </h4>
                                <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                                    <li>Unlimited knowledge graph</li>
                                    <li>Custom integrations & API</li>
                                    <li>Priority 24/7 team support</li>
                                </ul>
                            </div>
                            <p className="text-sm text-gray-500 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                                {currentPlan === 'free' 
                                    ? "You will be redirected to our secure payment portal to complete your upgrade."
                                    : "Your payment method on file will be charged a prorated amount for the remainder of this billing cycle."}
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 font-medium">
                            <button
                                onClick={() => setShowEnterpriseModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowEnterpriseModal(false);
                                    processUpgrade('enterprise');
                                }}
                                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all"
                            >
                                Continue to Upgrade
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
