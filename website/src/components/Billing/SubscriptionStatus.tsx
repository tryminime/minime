'use client';

import { CreditCard, Calendar, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { useSubscription, useCustomerPortal, useCancelSubscription } from '@/lib/hooks/useBilling';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';

export function SubscriptionStatus() {
    const { data: subscription, isLoading } = useSubscription();
    const customerPortal = useCustomerPortal();
    const cancelSubscription = useCancelSubscription();
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="bg-gray-100 animate-pulse rounded h-32" />
            </div>
        );
    }

    if (!subscription) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Failed to load subscription data</p>
            </div>
        );
    }

    const isPro = subscription.plan_type !== 'free';
    const isActive = subscription.status === 'active';
    const isCanceling = subscription.cancel_at_period_end;

    const handleOpenPortal = () => {
        const returnUrl = `${window.location.origin}/dashboard/billing`;
        customerPortal.mutate(returnUrl);
    };

    const handleCancelSubscription = () => {
        cancelSubscription.mutate(true); // Cancel at period end
        setShowCancelConfirm(false);
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Subscription Status</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage your billing and subscription</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${isActive && !isCanceling
                        ? 'bg-green-100 text-green-700'
                        : isCanceling
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                    {isCanceling ? 'Canceling' : subscription.status}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Current Plan */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <CreditCard className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">Current Plan</p>
                        <p className="text-lg font-bold text-gray-900 capitalize">
                            {subscription.plan_type}
                        </p>
                        {subscription.plan_details && (
                            <p className="text-sm text-gray-600">${subscription.plan_details.price}/month</p>
                        )}
                    </div>
                </div>

                {/* Renewal Date */}
                {isPro && subscription.current_period_end && (
                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                            <p className="text-xs font-medium text-gray-500 uppercase">
                                {isCanceling ? 'Expires On' : 'Renews On'}
                            </p>
                            <p className="text-lg font-bold text-gray-900">
                                {formatDate(subscription.current_period_end)}
                            </p>
                            <p className="text-sm text-gray-600">
                                {isCanceling ? 'Subscription ending' : 'Auto-renewal enabled'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Cancellation Warning */}
            {isCanceling && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-medium text-yellow-900">Subscription Canceling</p>
                        <p className="text-sm text-yellow-700 mt-1">
                            Your subscription will end on {subscription.current_period_end && formatDate(subscription.current_period_end)}.
                            You'll be downgraded to the Free plan.
                        </p>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
                {isPro && (
                    <button
                        onClick={handleOpenPortal}
                        disabled={customerPortal.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <ExternalLink className="w-4 h-4" />
                        {customerPortal.isPending ? 'Opening...' : 'Manage Billing'}
                    </button>
                )}

                {isPro && isActive && !isCanceling && (
                    <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="px-4 py-2 bg-white text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Cancel Subscription
                    </button>
                )}
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Subscription?</h3>
                        <p className="text-gray-600 mb-4">
                            Your subscription will remain active until {subscription.current_period_end && formatDate(subscription.current_period_end)}.
                            After that, you'll be downgraded to the Free plan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelSubscription}
                                disabled={cancelSubscription.isPending}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {cancelSubscription.isPending ? 'Canceling...' : 'Yes, Cancel'}
                            </button>
                            <button
                                onClick={() => setShowCancelConfirm(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Keep Subscription
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
