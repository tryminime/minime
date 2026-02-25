'use client';

import { Activity, Database, Zap, AlertTriangle } from 'lucide-react';
import { useUsageMetrics } from '@/lib/hooks/useBilling';

export function UsageMetrics() {
    const { data, isLoading, error } = useUsageMetrics();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Usage This Month</h3>
                <div className="bg-gray-100 animate-pulse rounded h-64" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Failed to load usage data</p>
            </div>
        );
    }

    const metrics = [
        {
            label: 'Activities',
            icon: <Activity className="w-5 h-5" />,
            current: data.usage.activities_count,
            limit: data.limits.activities_per_month,
            color: 'blue',
            warning: data.warnings.activities,
        },
        {
            label: 'Graph Nodes',
            icon: <Database className="w-5 h-5" />,
            current: data.usage.graph_nodes_count,
            limit: data.limits.graph_nodes,
            color: 'purple',
            warning: data.warnings.graph_nodes,
        },
        {
            label: 'API Calls Today',
            icon: <Zap className="w-5 h-5" />,
            current: data.usage.api_calls_count,
            limit: data.limits.api_calls_per_day,
            color: 'green',
            warning: data.warnings.api_calls,
        },
    ];

    const formatLimit = (limit: number) => {
        if (limit === -1) return 'Unlimited';
        if (limit >= 1000) return `${(limit / 1000).toFixed(1)}k`;
        return limit.toString();
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Usage This Month</h3>
                    <p className="text-sm text-gray-600 mt-1">{data.month}</p>
                </div>
                <div className="text-sm text-gray-600 capitalize">
                    <span className="font-semibold">{data.plan_type}</span> Plan
                </div>
            </div>

            <div className="space-y-6">
                {metrics.map((metric) => {
                    const isUnlimited = metric.limit === -1;
                    const percentUsed = isUnlimited ? 0 : (metric.current / metric.limit) * 100;
                    const isWarning = metric.warning?.warning && !isUnlimited;
                    const isExceeded = metric.warning?.exceeded && !isUnlimited;

                    const getBarColor = () => {
                        if (isUnlimited) return 'bg-gray-200';
                        if (isExceeded) return 'bg-red-500';
                        if (isWarning) return 'bg-yellow-500';
                        return `bg-${metric.color}-500`;
                    };

                    return (
                        <div key={metric.label}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded text-${metric.color}-600`}>
                                        {metric.icon}
                                    </div>
                                    <span className="font-medium text-gray-900">{metric.label}</span>
                                    {(isWarning || isExceeded) && (
                                        <AlertTriangle className={`w-4 h-4 ${isExceeded ? 'text-red-600' : 'text-yellow-600'}`} />
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {metric.current.toLocaleString()} / {formatLimit(metric.limit)}
                                    </p>
                                    {!isUnlimited && (
                                        <p className="text-xs text-gray-500">
                                            {metric.warning?.remaining.toLocaleString()} remaining
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all ${getBarColor()}`}
                                    style={{ width: isUnlimited ? '100%' : `${Math.min(100, percentUsed)}%` }}
                                />
                            </div>

                            {!isUnlimited && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {percentUsed.toFixed(1)}% used
                                </p>
                            )}

                            {/* Warning/Error Messages */}
                            {isExceeded && (
                                <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                                    ⚠️ Limit exceeded! Upgrade for unlimited access.
                                </div>
                            )}
                            {isWarning && !isExceeded && (
                                <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 rounded px-2 py-1">
                                    ⚠️ Approaching limit ({percentUsed.toFixed(0)}% used)
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Upgrade CTA for Free users */}
            {data.plan_type === 'free' && metrics.some(m => m.warning?.warning) && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Need more capacity?</h4>
                        <p className="text-sm text-gray-600 mb-3">
                            Upgrade to Pro for unlimited activities and advanced features.
                        </p>
                        <a
                            href="#pricing"
                            className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            View Plans →
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}
