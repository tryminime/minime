'use client';

import { useMeetings } from '@/lib/hooks/useMeetings';
import { Video, Clock, Calendar, BarChart3 } from 'lucide-react';

function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
    });
}

const PLATFORM_ICONS: Record<string, string> = {
    zoom: '📹',
    'google meet': '📞',
    teams: '💬',
    webex: '🖥️',
    slack: '💬',
};

export function MeetingList() {
    const { data, isLoading, error } = useMeetings();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p className="font-semibold">Failed to load meetings</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                            <Video className="w-4 h-4 text-violet-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.total_meetings}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Meetings</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.total_hours}h</p>
                    <p className="text-xs text-gray-500 mt-1">Total Meeting Hours</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.meetings_today}</p>
                    <p className="text-xs text-gray-500 mt-1">Meetings Today</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.avg_duration_minutes}m</p>
                    <p className="text-xs text-gray-500 mt-1">Avg Duration</p>
                </div>
            </div>

            {/* Daily bar chart */}
            {data.daily_count.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Meeting Load</h3>
                    <div className="flex items-end gap-2 h-28">
                        {data.daily_count.map(d => {
                            const maxCount = Math.max(...data.daily_count.map(x => x.count), 1);
                            const height = (d.count / maxCount) * 100;
                            return (
                                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs text-gray-500 font-medium">{d.count}</span>
                                    <div
                                        className="w-full rounded-t-md bg-gradient-to-t from-violet-600 to-violet-400 transition-all"
                                        style={{ height: `${Math.max(height, 6)}%` }}
                                    />
                                    <span className="text-xs text-gray-400">
                                        {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Meeting list */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Meetings</h3>
            {data.meetings.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No meetings recorded</p>
                    <p className="text-sm mt-1">Video meetings will appear here</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {data.meetings.map(meeting => {
                        const icon = PLATFORM_ICONS[meeting.platform.toLowerCase()] || '📅';
                        return (
                            <div
                                key={meeting.id}
                                className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0 text-lg">
                                    {icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{meeting.title}</p>
                                    <p className="text-sm text-gray-500">{meeting.platform}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-medium text-gray-700">{meeting.duration_minutes}m</p>
                                    <p className="text-xs text-gray-400">
                                        {formatDate(meeting.created_at)} · {formatTime(meeting.created_at)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
