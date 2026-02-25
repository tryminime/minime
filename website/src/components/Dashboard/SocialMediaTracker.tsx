'use client';

import { useSocialMedia } from '@/lib/hooks/useSocialMedia';
import { Globe, Clock, Eye, AlertTriangle } from 'lucide-react';

const PLATFORM_COLORS = [
    '#4267B2', '#1DA1F2', '#E4405F', '#FF0000', '#0A66C2',
    '#FF6900', '#5865F2', '#25D366', '#1DB954', '#FF4500',
];

export function SocialMediaTracker() {
    const { data, isLoading, error } = useSocialMedia();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p className="font-semibold">Failed to load social media data</p>
            </div>
        );
    }

    if (!data) return null;

    const highUsage = data.total_time_minutes > 120;

    return (
        <div>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.total_time_minutes}m</p>
                    <p className="text-xs text-gray-500 mt-1">Total Social Time</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Eye className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.total_visits}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Visits</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <Globe className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.platforms.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Platforms Used</p>
                </div>
            </div>

            {/* High usage warning */}
            {highUsage && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-amber-800">High social media usage detected</p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            You've spent {data.total_time_minutes} minutes on social media. Consider setting focus boundaries.
                        </p>
                    </div>
                </div>
            )}

            {/* Platform breakdown */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Platform Breakdown</h3>
            {data.platforms.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No social media activity</p>
                    <p className="text-sm mt-1">Social media visits will appear here</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {data.platforms.map((platform, i) => {
                        const color = PLATFORM_COLORS[i % PLATFORM_COLORS.length];
                        const percentage = data.total_time_minutes
                            ? Math.round((platform.time_minutes / data.total_time_minutes) * 100)
                            : 0;

                        return (
                            <div key={platform.name} className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                                            style={{ backgroundColor: color }}
                                        >
                                            {platform.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{platform.name}</p>
                                            <p className="text-xs text-gray-500">{platform.domain}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900">{platform.time_minutes}m</p>
                                        <p className="text-xs text-gray-400">{platform.visit_count} visits</p>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                                    <div
                                        className="h-2 rounded-full transition-all"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: color,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
