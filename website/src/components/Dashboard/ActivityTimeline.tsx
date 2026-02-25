'use client';

import { useState } from 'react';
import { useActivities, ActivityItem } from '@/lib/hooks/useActivities';
import {
    Monitor, Globe, Users, MessageSquare, Camera, Clock,
    ChevronDown, Filter, Trash2
} from 'lucide-react';

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Monitor; color: string }> = {
    window_focus: { label: 'App', icon: Monitor, color: '#3b82f6' },
    app_focus: { label: 'App', icon: Monitor, color: '#3b82f6' },
    page_view: { label: 'Web', icon: Globe, color: '#10b981' },
    meeting: { label: 'Meeting', icon: Users, color: '#8b5cf6' },
    social_media: { label: 'Social', icon: MessageSquare, color: '#f59e0b' },
    screenshot: { label: 'Screenshot', icon: Camera, color: '#6b7280' },
};

function formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'window_focus', label: 'Apps' },
    { value: 'page_view', label: 'Web' },
    { value: 'meeting', label: 'Meetings' },
    { value: 'social_media', label: 'Social' },
];

export function ActivityTimeline() {
    const [filter, setFilter] = useState('all');
    const { data, isLoading, error } = useActivities(filter, 100);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p className="font-semibold">Failed to load activities</p>
                <p className="text-sm mt-1">Please try refreshing the page</p>
            </div>
        );
    }

    const activities = data?.activities || [];

    // Group by date
    const grouped: Record<string, ActivityItem[]> = {};
    activities.forEach(a => {
        const date = new Date(a.created_at).toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric',
        });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(a);
    });

    return (
        <div>
            {/* Filter bar */}
            <div className="flex gap-2 mb-6">
                {FILTERS.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.value
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {activities.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No activities found</p>
                    <p className="text-sm mt-1">Activities will appear here as they're captured</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([date, items]) => (
                        <div key={date}>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                {date}
                            </h3>
                            <div className="space-y-2">
                                {items.map(activity => {
                                    const config = TYPE_CONFIG[activity.type] || {
                                        label: activity.type, icon: Clock, color: '#6b7280'
                                    };
                                    const Icon = config.icon;

                                    return (
                                        <div
                                            key={activity.id}
                                            className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
                                        >
                                            <div
                                                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: config.color + '15' }}
                                            >
                                                <Icon className="w-5 h-5" style={{ color: config.color }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">
                                                    {activity.title || activity.app || 'Untitled'}
                                                </p>
                                                <p className="text-sm text-gray-500 truncate">
                                                    {activity.app && <span>{activity.app}</span>}
                                                    {activity.domain && <span> · {activity.domain}</span>}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-sm font-medium text-gray-700">
                                                    {formatDuration(activity.duration_seconds)}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {timeAgo(activity.created_at)}
                                                </p>
                                            </div>
                                            <span
                                                className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                                                style={{
                                                    backgroundColor: config.color + '15',
                                                    color: config.color,
                                                }}
                                            >
                                                {config.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {data && (
                <p className="text-center text-sm text-gray-400 mt-6">
                    Showing {activities.length} of {data.total} activities
                </p>
            )}
        </div>
    );
}
