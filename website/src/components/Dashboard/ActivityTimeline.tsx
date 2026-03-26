'use client';

import { useState, useMemo } from 'react';
import { useActivities, useDeleteActivity, useBulkDeleteActivities, ActivityItem } from '@/lib/hooks/useActivities';
import { ActivityDetailModal } from './ActivityDetailModal';
import {
    Monitor, Globe, Users, Camera, Clock, ChevronDown, ChevronRight, Layers, BookOpen,
    Play, Search, MessageCircle, Zap, FileText, BarChart3,
    Timer, TrendingUp, Trash2, X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Monitor; color: string; gradient: string }> = {
    window_focus:      { label: 'App',       icon: Monitor,       color: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
    app_focus:         { label: 'App',       icon: Monitor,       color: '#3b82f6', gradient: 'from-blue-500 to-blue-600' },
    web_visit:         { label: 'Web',       icon: Globe,         color: '#10b981', gradient: 'from-emerald-500 to-emerald-600' },
    page_view:         { label: 'Web',       icon: Globe,         color: '#10b981', gradient: 'from-emerald-500 to-emerald-600' },
    reading_analytics: { label: 'Reading',   icon: BookOpen,      color: '#059669', gradient: 'from-green-500 to-green-600' },
    social_media:      { label: 'Social',    icon: MessageCircle, color: '#8b5cf6', gradient: 'from-violet-500 to-violet-600' },
    video_watching:    { label: 'Video',     icon: Play,          color: '#ef4444', gradient: 'from-red-500 to-red-600' },
    video_watch:       { label: 'Video',     icon: Play,          color: '#ef4444', gradient: 'from-red-500 to-red-600' },
    search_query:      { label: 'Search',    icon: Search,        color: '#f59e0b', gradient: 'from-amber-500 to-amber-600' },
    meeting:           { label: 'Meeting',   icon: Users,         color: '#6366f1', gradient: 'from-indigo-500 to-indigo-600' },
    screenshot:        { label: 'Screenshot',icon: Camera,        color: '#6b7280', gradient: 'from-gray-500 to-gray-600' },
};

const FILE_CATEGORY_ICONS: Record<string, string> = {
    document: '📄', note: '📝', spreadsheet: '📊', presentation: '📽️',
    code: '💻', script: '⚡', data: '🗃️', database: '🗄️',
    notebook: '🧪', log: '📋', design: '🎨', '3d_model': '🧊',
    image: '🖼️', audio: '🎵', video: '🎬', archive: '📦',
    text: '📝', file: '📁',
};

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

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

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

const FILTERS = [
    { value: 'all', label: 'All', icon: Layers },
    { value: 'app_focus', label: 'Apps', icon: Monitor },
    { value: 'web_visit', label: 'Web', icon: Globe },
    { value: 'reading_analytics', label: 'Reading', icon: BookOpen },
    { value: 'social_media', label: 'Social', icon: MessageCircle },
    { value: 'video_watching', label: 'Video', icon: Play },
    { value: 'search_query', label: 'Search', icon: Search },
    { value: 'meeting', label: 'Meetings', icon: Users },
];

// ─────────────────────────────────────────────────────────────────
// Deduplication: active-session sync creates near-duplicate entries
// ─────────────────────────────────────────────────────────────────

function deduplicateActivities(activities: ActivityItem[]): ActivityItem[] {
    const deduped: ActivityItem[] = [];
    const seen = new Map<string, ActivityItem>();

    for (const a of activities) {
        const key = `${a.app || a.domain || ''}::${a.title || ''}::${a.type}`;
        const existing = seen.get(key);
        if (existing) {
            const timeDiff = Math.abs(
                new Date(a.created_at).getTime() - new Date(existing.created_at).getTime()
            );
            // Within 5 minutes = same session snapshot, keep the longest
            if (timeDiff < 5 * 60 * 1000) {
                if ((a.duration_seconds || 0) > (existing.duration_seconds || 0)) {
                    const idx = deduped.indexOf(existing);
                    if (idx >= 0) deduped[idx] = a;
                    seen.set(key, a);
                }
                continue;
            }
        }
        seen.set(key, a);
        deduped.push(a);
    }
    return deduped;
}

// ─────────────────────────────────────────────────────────────────
// Grouping
// ─────────────────────────────────────────────────────────────────

function getGroupKey(a: ActivityItem): string {
    if (a.type === 'social_media') return a.context?.platform || a.domain || 'Social';
    if (a.type === 'video_watching' || a.type === 'video_watch') return a.context?.platform || a.domain || 'Video';
    if (a.type === 'search_query') return a.context?.engine || a.domain || 'Search';
    if (a.type === 'web_visit' || a.type === 'page_view' || a.type === 'reading_analytics') {
        return a.domain || a.context?.domain || a.app || 'Unknown';
    }
    return a.app || a.title || 'Unknown';
}

interface ActivityGroup {
    key: string;
    label: string;
    type: string;
    items: ActivityItem[];
    totalDuration: number;
    latestTime: string;
    earliestTime: string;
    fileTypes: Set<string>;
}

function groupActivitiesByApp(items: ActivityItem[]): ActivityGroup[] {
    const map = new Map<string, ActivityGroup>();

    items.forEach(a => {
        const key = getGroupKey(a);
        if (!map.has(key)) {
            map.set(key, {
                key, label: a.app || a.domain || a.context?.domain || a.title || a.context?.title || key,
                type: a.type, items: [], totalDuration: 0,
                latestTime: a.created_at, earliestTime: a.created_at,
                fileTypes: new Set(),
            });
        }
        const group = map.get(key)!;
        group.items.push(a);
        group.totalDuration += a.duration_seconds || 0;
        if (new Date(a.created_at) > new Date(group.latestTime)) group.latestTime = a.created_at;
        if (new Date(a.created_at) < new Date(group.earliestTime)) group.earliestTime = a.created_at;
        if (a.data?.files) {
            a.data.files.forEach((f: { type?: string }) => {
                if (f.type) group.fileTypes.add(f.type);
            });
        }
        if (a.data?.file_type) group.fileTypes.add(a.data.file_type);
    });

    for (const group of map.values()) {
        group.items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return Array.from(map.values()).sort(
        (a, b) => new Date(b.latestTime).getTime() - new Date(a.latestTime).getTime()
    );
}

// ─────────────────────────────────────────────────────────────────
// Summary Stats
// ─────────────────────────────────────────────────────────────────

function SummaryStats({ activities }: { activities: ActivityItem[] }) {
    const stats = useMemo(() => {
        const totalDuration = activities.reduce((sum, a) => sum + (a.duration_seconds || 0), 0);
        const uniqueApps = new Set(activities.map(a => a.app || a.domain || 'Unknown')).size;
        const filesOpened = activities.reduce((sum, a) => sum + (a.data?.files?.length || (a.data?.file_name ? 1 : 0)), 0);
        return { totalDuration, uniqueApps, filesOpened, sessions: activities.length };
    }, [activities]);

    const tiles = [
        { icon: Timer,      label: 'Total Time',  value: formatDuration(stats.totalDuration), color: 'text-blue-600',   bg: 'bg-blue-50' },
        { icon: Monitor,    label: 'Apps Used',    value: `${stats.uniqueApps}`,              color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { icon: FileText,   label: 'Files Opened', value: `${stats.filesOpened}`,             color: 'text-emerald-600',bg: 'bg-emerald-50' },
        { icon: TrendingUp, label: 'Sessions',     value: `${stats.sessions}`,                color: 'text-amber-600',  bg: 'bg-amber-50' },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiles.map(t => {
                const Icon = t.icon;
                return (
                    <div key={t.label} className={`${t.bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
                        <div className="p-2 bg-white/80 rounded-lg shadow-sm">
                            <Icon className={`w-4 h-4 ${t.color}`} />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-gray-900 leading-none">{t.value}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{t.label}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Activity Row (single item)
// ─────────────────────────────────────────────────────────────────

function ActivityRow({ activity, onClick, onDelete, compact = false }: {
    activity: ActivityItem; onClick: () => void; compact?: boolean;
    onDelete?: (id: string) => void;
}) {
    const config = TYPE_CONFIG[activity.type] || { label: activity.type, icon: Clock, color: '#6b7280', gradient: 'from-gray-500 to-gray-600' };
    const Icon = config.icon;
    const fileType = activity.data?.file_type;
    const fileIcon = fileType ? FILE_CATEGORY_ICONS[fileType] : null;

    return (
        <div
            className={`flex items-center gap-3 bg-white rounded-xl border border-gray-100 hover:border-blue-200 
                hover:shadow-sm cursor-pointer transition-all group
                ${compact ? 'px-3 py-2 ml-10' : 'px-4 py-3'}`}
        >
            {!compact && (
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config.color + '12' }}
                    onClick={onClick}
                >
                    <Icon className="w-4.5 h-4.5" style={{ color: config.color }} />
                </div>
            )}
            <div className="flex-1 min-w-0" onClick={onClick}>
                <p className={`font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors ${compact ? 'text-sm' : ''}`}>
                    {activity.title || activity.context?.title || activity.app || 'Untitled'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {activity.app && <span className="text-xs text-gray-400 truncate">{activity.app}</span>}
                    {(activity.domain || activity.context?.domain) && (
                        <span className="text-xs text-gray-400 truncate">· {activity.domain || activity.context?.domain}</span>
                    )}
                    {activity.data?.file_name && (
                        <span className="text-xs text-blue-500 truncate flex items-center gap-0.5">
                            · {fileIcon || '📄'} {activity.data.file_name}
                        </span>
                    )}
                </div>
            </div>
            <div className="text-right flex-shrink-0" onClick={onClick}>
                <p className="text-sm font-semibold text-gray-700">{formatDuration(activity.duration_seconds)}</p>
                <p className="text-[11px] text-gray-400">
                    {compact ? formatTime(activity.created_at) : timeAgo(activity.created_at)}
                </p>
            </div>
            {/* Delete button — visible on hover */}
            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                        opacity-0 group-hover:opacity-100 transition-opacity
                        text-gray-300 hover:text-red-500 hover:bg-red-50"
                    title="Delete activity"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Stacked Group (expandable)
// ─────────────────────────────────────────────────────────────────

function StackedGroupRow({ group, onSessionClick, onDelete, onDeleteGroup }: {
    group: ActivityGroup; onSessionClick: (a: ActivityItem) => void;
    onDelete?: (id: string) => void;
    onDeleteGroup?: (ids: string[]) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const config = TYPE_CONFIG[group.type] || { label: group.type, icon: Clock, color: '#6b7280', gradient: 'from-gray-500 to-gray-600' };
    const Icon = config.icon;
    const Chevron = expanded ? ChevronDown : ChevronRight;

    return (
        <div className="relative">
            {/* Collapsed stack shadow */}
            {!expanded && group.items.length > 1 && (
                <>
                    <div className="absolute inset-x-1.5 -bottom-1 h-1.5 rounded-b-xl bg-gray-50 border-x border-b border-gray-100/80" />
                    {group.items.length > 2 && (
                        <div className="absolute inset-x-3 -bottom-2.5 h-1.5 rounded-b-xl bg-gray-50/60 border-x border-b border-gray-100/50" />
                    )}
                </>
            )}

            {/* Group Header */}
            <div
                onClick={() => setExpanded(prev => !prev)}
                className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 
                    hover:border-blue-200 hover:shadow-sm cursor-pointer transition-all group relative z-10"
            >
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 relative"
                    style={{ backgroundColor: config.color + '12' }}
                >
                    <Icon className="w-4.5 h-4.5" style={{ color: config.color }} />
                    <span
                        className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full text-[9px] font-bold 
                            flex items-center justify-center text-white"
                        style={{ backgroundColor: config.color }}
                    >
                        {group.items.length}
                    </span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                            {group.label}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                            {formatTime(group.earliestTime)} — {formatTime(group.latestTime)}
                        </span>
                        {group.fileTypes.size > 0 && (
                            <div className="flex gap-0.5">
                                {Array.from(group.fileTypes).slice(0, 3).map(ft => (
                                    <span key={ft} className="text-[10px]" title={ft}>
                                        {FILE_CATEGORY_ICONS[ft] || '📁'}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-700">{formatDuration(group.totalDuration)}</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                        {group.items.length} session{group.items.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Delete group button */}
                {onDeleteGroup && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteGroup(group.items.map(a => a.id)); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
                            opacity-0 group-hover:opacity-100 transition-opacity
                            text-gray-300 hover:text-red-500 hover:bg-red-50"
                        title={`Delete all ${group.items.length} sessions`}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}

                <Chevron className="w-4 h-4 text-gray-300 flex-shrink-0 transition-transform" />
            </div>

            {/* Expanded items — shows timeline of when each session was opened */}
            <div
                className={`grid transition-all duration-200 ease-out ${
                    expanded ? 'grid-rows-[1fr] mt-1.5 opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
                <div className="overflow-hidden space-y-1">
                    {group.items.map(activity => (
                        <ActivityRow
                            key={activity.id}
                            activity={activity}
                            onClick={() => onSessionClick(activity)}
                            onDelete={onDelete}
                            compact
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Delete Confirmation Dialog
// ─────────────────────────────────────────────────────────────────

function DeleteConfirmDialog({ onConfirm, onCancel }: {
    onConfirm: () => void; onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)' }}
            onClick={onCancel}
        >
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Delete Activity?</h3>
                        <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone.</p>
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >Cancel</button>
                    <button onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                    >Delete</button>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Main Timeline
// ─────────────────────────────────────────────────────────────────

export function ActivityTimeline() {
    const [filter, setFilter] = useState('all');
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | string[] | null>(null);
    const { data, isLoading, error } = useActivities(filter, 100);
    const deleteActivity = useDeleteActivity();
    const bulkDelete = useBulkDeleteActivities();

    // Deduplicate active-session sync entries
    const activities = useMemo(() => {
        return deduplicateActivities(data?.activities || []);
    }, [data?.activities]);

    const handleDelete = (id: string) => {
        setDeleteTarget(id);
    };

    const confirmDelete = () => {
        if (deleteTarget) {
            if (Array.isArray(deleteTarget)) {
                bulkDelete.mutate(deleteTarget);
            } else {
                deleteActivity.mutate(deleteTarget);
            }
            setDeleteTarget(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center animate-pulse">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-400 font-medium">Loading activities…</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-red-400" />
                </div>
                <p className="font-semibold text-gray-700">Failed to load activities</p>
                <p className="text-sm text-gray-400 mt-1">Check your connection and try refreshing</p>
            </div>
        );
    }

    // Date grouping
    const dateGroups: Record<string, { dateSort: string; items: ActivityItem[] }> = {};
    activities.forEach(a => {
        const dateLabel = new Date(a.created_at).toLocaleDateString('en-US', {
            weekday: 'long', month: 'short', day: 'numeric',
        });
        const dateSort = a.created_at.split('T')[0];
        if (!dateGroups[dateLabel]) dateGroups[dateLabel] = { dateSort, items: [] };
        dateGroups[dateLabel].items.push(a);
    });

    const sortedDateEntries = Object.entries(dateGroups)
        .sort((a, b) => b[1].dateSort.localeCompare(a[1].dateSort));

    return (
        <div className="space-y-5">
            {/* Filter pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {FILTERS.map(f => {
                    const FIcon = f.icon;
                    return (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${filter === f.value
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <FIcon className="w-3.5 h-3.5" />
                            {f.label}
                        </button>
                    );
                })}
            </div>

            {/* Summary Stats — computed from DEDUPLICATED + FILTERED activities */}
            {activities.length > 0 && <SummaryStats activities={activities} />}

            {/* Empty State */}
            {activities.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="font-semibold text-gray-600">No activities found</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                        Activities will appear here as they&apos;re tracked by the MiniMe desktop agent
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {sortedDateEntries.map(([date, { items }]) => {
                        const appGroups = groupActivitiesByApp(items);
                        const dayDuration = items.reduce((s, a) => s + (a.duration_seconds || 0), 0);

                        return (
                            <div key={date}>
                                {/* Date header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        {date}
                                    </h3>
                                    <div className="flex-1 h-px bg-gray-100" />
                                    <span className="text-xs font-medium text-gray-400">
                                        {formatDuration(dayDuration)}
                                    </span>
                                </div>

                                {/* Activity groups */}
                                <div className="space-y-2.5">
                                    {appGroups.map(group =>
                                        group.items.length === 1 ? (
                                            <ActivityRow
                                                key={group.items[0].id}
                                                activity={group.items[0]}
                                                onClick={() => setSelectedActivity(group.items[0])}
                                                onDelete={handleDelete}
                                            />
                                        ) : (
                                            <StackedGroupRow
                                                key={group.key}
                                                group={group}
                                                onSessionClick={a => setSelectedActivity(a)}
                                                onDelete={handleDelete}
                                            />
                                        )
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination hint */}
            {data && (
                <div className="text-center">
                    <p className="text-xs text-gray-400">
                        Showing {activities.length} of {data.total} activities
                    </p>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <DeleteConfirmDialog
                    onConfirm={confirmDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* Detail Modal */}
            {selectedActivity && (
                <ActivityDetailModal
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                />
            )}
        </div>
    );
}
