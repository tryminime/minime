'use client';

import { CreditCard } from 'lucide-react';
import { SubscriptionStatus } from '@/components/Billing/SubscriptionStatus';
import { UsageMetrics } from '@/components/Billing/UsageMetrics';
import { PricingTable } from '@/components/Billing/PricingTable';
import { InvoiceHistory } from '@/components/Billing/InvoiceHistory';

export default function BillingPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
                </div>
                <p className="text-gray-600">Manage your subscription, usage, and billing information</p>
            </div>

            {/* Subscription Status */}
            <SubscriptionStatus />

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Usage Metrics */}
                <UsageMetrics />

                {/* Invoice History */}
                <InvoiceHistory />
            </div>

            {/* Pricing Plans */}
            <div id="pricing">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Available Plans</h2>
                <PricingTable />
            </div>

            {/* Help Section */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Need help with billing?</h3>
                <p className="text-sm text-gray-600 mb-4">
                    Contact our support team for questions about your subscription, invoices, or usage.
                </p>
                <div className="flex flex-wrap gap-3">
                    <a
                        href="mailto:support@minime.app"
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        Email Support
                    </a>
                    <a
                        href="mailto:support@minime.app?subject=Billing%20Question"
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        View FAQ
                    </a>
                </div>
            </div>
        </div>
    );
}
