'use client';

import { useFocusSessions } from '@/lib/hooks/useFocusSessions';
import { Brain, Clock, Flame, Trophy, Monitor } from 'lucide-react';

const DEPTH_COLORS = {
    deep: { bg: '#7c3aed15', text: '#7c3aed', label: 'Deep Focus' },
    medium: { bg: '#3b82f615', text: '#3b82f6', label: 'Medium Focus' },
    shallow: { bg: '#f59e0b15', text: '#f59e0b', label: 'Light Focus' },
};

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

export function FocusSessions() {
    const { data, isLoading, error } = useFocusSessions();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p className="font-semibold">Failed to load focus sessions</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.total_focus_hours}h</p>
                    <p className="text-xs text-gray-500 mt-1">Total Focus Time</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.deep_work_sessions}</p>
                    <p className="text-xs text-gray-500 mt-1">Deep Work Sessions</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <Flame className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.avg_session_minutes}m</p>
                    <p className="text-xs text-gray-500 mt-1">Avg Session Length</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <Trophy className="w-4 h-4 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.longest_session_minutes}m</p>
                    <p className="text-xs text-gray-500 mt-1">Longest Session</p>
                </div>
            </div>

            {/* Daily breakdown bar */}
            {data.daily_hours.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Focus Hours</h3>
                    <div className="flex items-end gap-2 h-32">
                        {data.daily_hours.map(d => {
                            const maxHours = Math.max(...data.daily_hours.map(x => x.hours), 1);
                            const height = (d.hours / maxHours) * 100;
                            return (
                                <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-xs text-gray-500 font-medium">{d.hours}h</span>
                                    <div
                                        className="w-full rounded-t-md bg-gradient-to-t from-purple-600 to-purple-400 transition-all"
                                        style={{ height: `${Math.max(height, 4)}%` }}
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

            {/* Session list */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Focus Sessions</h3>
            {data.sessions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No focus sessions detected</p>
                    <p className="text-sm mt-1">Sessions appear after 10+ minutes of focused work</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {data.sessions.map(session => {
                        const depth = DEPTH_COLORS[session.depth];
                        return (
                            <div
                                key={session.id}
                                className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition-all"
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: depth.bg }}
                                >
                                    <Monitor className="w-5 h-5" style={{ color: depth.text }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{session.app}</p>
                                    <p className="text-sm text-gray-500 truncate">{session.title}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-medium text-gray-700">
                                        {formatDuration(session.duration_seconds)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(session.created_at).toLocaleTimeString('en-US', {
                                            hour: 'numeric', minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <span
                                    className="text-xs px-2 py-1 rounded-full font-medium flex-shrink-0"
                                    style={{ backgroundColor: depth.bg, color: depth.text }}
                                >
                                    {depth.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
