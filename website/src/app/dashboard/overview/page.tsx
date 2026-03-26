'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';
import { TrendingUp, Clock, Coffee, BarChart3, Zap, Activity, Monitor, Globe, Heart, Target, Download } from 'lucide-react';
import { ProactiveInsightsPanel } from '@/components/Dashboard/ProactiveInsightsPanel';
import { RecommendationsPanel } from '@/components/Dashboard/RecommendationsPanel';
import { useWellness } from '@/lib/hooks/useGoals';
import { useGoals } from '@/lib/hooks/useGoals';
import { useState } from 'react';
import { toast } from 'sonner';

interface DashboardOverview {
    total_activities: number;
    total_hours: number;
    focus_score: number;
    deep_work_hours: number;
    meetings_count: number;
    breaks_count: number;
    top_apps: { app: string; hours: number; duration: string }[];
    recent_activities: {
        type: string;
        title: string;
        app: string;
        duration: string;
        duration_seconds: number;
        time_ago: string;
        occurred_at: string;
        domain: string;
    }[];
    activity_types: Record<string, number>;
}

interface DailyMetric {
    date: string;
    total_seconds: number;
    focus_score: number;
}

function getActivityIcon(type: string) {
    switch (type) {
        case 'window_focus':
        case 'app_focus':
            return <Monitor className="w-4 h-4 text-blue-500" />;
        case 'page_view':
            return <Globe className="w-4 h-4 text-indigo-500" />;
        case 'meeting':
            return <Activity className="w-4 h-4 text-purple-500" />;
        case 'break':
            return <Coffee className="w-4 h-4 text-green-500" />;
        case 'idle':
            return <Clock className="w-4 h-4 text-gray-400" />;
        default:
            return <Activity className="w-4 h-4 text-gray-500" />;
    }
}

function getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        window_focus: 'Focus Session',
        app_focus: 'App Usage',
        page_view: 'Web Browsing',
        meeting: 'Meeting',
        break: 'Break',
        idle: 'Idle',
    };
    return labels[type] || type;
}

// 30-day activity heatmap — one cell per day, coloured by tracked hours
function ActivityHeatmap({ dailyData }: { dailyData: DailyMetric[] }) {
    const today = new Date();

    // Deduplicate dailyData by date (API may return multiple entries per day)
    // Keep the last entry per date if duplicates exist
    const dateMap = new Map<string, DailyMetric>();
    for (const m of dailyData) {
        dateMap.set(m.date, m);
    }

    const cells: { date: string; hours: number }[] = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const match = dateMap.get(dateStr);
        const hours = match ? (match.total_seconds || 0) / 3600 : 0;
        cells.push({ date: dateStr, hours });
    }
    const maxHours = Math.max(...cells.map(c => c.hours), 1);
    function intensity(h: number): string {
        if (h === 0) return '#f3f4f6';
        const pct = h / maxHours;
        if (pct < 0.25) return '#c7d2fe';
        if (pct < 0.5) return '#818cf8';
        if (pct < 0.75) return '#4f46e5';
        return '#3730a3';
    }

    // Lay out in 5 rows × 6 cols
    const rows = [cells.slice(0, 6), cells.slice(6, 12), cells.slice(12, 18), cells.slice(18, 24), cells.slice(24, 30)];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">30-Day Activity Heatmap</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-3 h-3 rounded-sm bg-gray-100" /> Less
                    <div className="w-3 h-3 rounded-sm bg-indigo-300" />
                    <div className="w-3 h-3 rounded-sm bg-indigo-600" />
                    <div className="w-3 h-3 rounded-sm bg-indigo-900" /> More
                </div>
            </div>
            <div className="space-y-1.5">
                {rows.map((row, ri) => (
                    <div key={ri} className="flex gap-1.5">
                        {row.map((cell, ci) => (
                            <div
                                key={`${ri}-${ci}-${cell.date}`}
                                title={`${cell.date}: ${cell.hours.toFixed(1)}h tracked`}
                                className="flex-1 h-7 rounded cursor-default transition-opacity hover:opacity-80"
                                style={{ background: intensity(cell.hours) }}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{cells[0]?.date}</span>
                <span>Today</span>
            </div>
        </div>
    );
}

export default function DashboardOverviewPage() {
    const { user } = useAuth();
    const api = getAPIClient();
    const [isExporting, setIsExporting] = useState(false);

    const { data, isLoading, error } = useQuery<DashboardOverview>({
        queryKey: ['dashboard', 'overview'],
        queryFn: () => api.get<DashboardOverview>('/api/v1/analytics/overview'),
        staleTime: 30 * 1000,
        retry: 2,
    });

    const { data: dailyData } = useQuery<{ metrics: DailyMetric[] }>({
        queryKey: ['productivity', 'daily-range'],
        queryFn: () => api.get('/api/v1/analytics/productivity/daily-range?days=30'),
        staleTime: 5 * 60 * 1000,
    });

    const { data: wellnessData } = useWellness();
    const { data: goals } = useGoals();

    const activeGoals = (goals ?? []).filter((g: { status: string }) => g.status === 'active').length;
    const completedGoals = (goals ?? []).filter((g: { status: string }) => g.status === 'completed').length;
    const totalGoals = (goals?.length ?? 0);
    const goalCompletionPct = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

    const handleExportJSON = async () => {
        setIsExporting(true);
        try {
            const result = await api.get<{ activities: object[]; total: number; format: string }>('/api/v1/analytics/export?format=json');
            // Safely handle different response structures
            const payload = result?.activities ?? result ?? [];
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `minime_analytics_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);
            toast.success(`Exported ${result?.total ?? (Array.isArray(payload) ? payload.length : 0)} activities`);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Export failed — please try again');
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome section */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-8 text-white flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back, {user?.username || 'there'}! 👋
                    </h1>
                    <p className="text-blue-100">
                        Here&apos;s your productivity overview for today.
                    </p>
                </div>
                <button
                    onClick={handleExportJSON}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'Exporting…' : 'Export JSON'}
                </button>
            </div>

            {/* Quick stats — REAL DATA */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-20 mb-3" />
                            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
                            <div className="h-3 bg-gray-200 rounded w-24" />
                        </div>
                    ))}
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600">Failed to load dashboard data</p>
                </div>
            ) : data ? (
                <>
                    {/* Core KPI row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-4 h-4 text-blue-500" />
                                <p className="text-sm text-gray-600">Focus Score</p>
                            </div>
                            <p className="text-3xl font-bold mb-2">{data.focus_score}</p>
                            <p className="text-sm text-blue-600">{data.total_activities} activities tracked</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <p className="text-sm text-gray-600">Deep Work</p>
                            </div>
                            <p className="text-3xl font-bold mb-2">{data.deep_work_hours}h</p>
                            <p className="text-sm text-green-600">{data.total_hours}h total tracked</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <BarChart3 className="w-4 h-4 text-yellow-500" />
                                <p className="text-sm text-gray-600">Meetings</p>
                            </div>
                            <p className="text-3xl font-bold mb-2">{data.meetings_count}</p>
                            <p className="text-sm text-yellow-600">{data.breaks_count} breaks taken</p>
                        </div>
                        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className="w-4 h-4 text-purple-500" />
                                <p className="text-sm text-gray-600">Activity Types</p>
                            </div>
                            <p className="text-3xl font-bold mb-2">{Object.keys(data.activity_types).length}</p>
                            <p className="text-sm text-purple-600">
                                {Object.entries(data.activity_types).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t, c]) => `${getTypeLabel(t)}: ${c}`).join(', ')}
                            </p>
                        </div>
                    </div>

                    {/* Wellness + Goals KPI row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Wellness mini-card */}
                        <div className="bg-white relative hover:shadow-md transition-shadow rounded-lg p-6 shadow-sm border border-gray-200 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <Heart className="w-7 h-7 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-500 mb-2">7-Day Wellness Trend</p>
                                <div className="flex items-end gap-1 h-8">
                                    {(dailyData?.metrics?.slice(-7) ?? []).length > 0 ? (dailyData?.metrics?.slice(-7) ?? []).map((day, i) => (
                                        <div 
                                            key={i} 
                                            className="w-full bg-emerald-400 rounded-t-sm transition-all" 
                                            style={{ height: `${Math.max(4, (day.focus_score / 100) * 32)}px` }} 
                                            title={`Score: ${day.focus_score.toFixed(0)}`}
                                        />
                                    )) : (
                                        <span className="text-sm text-gray-400">No data</span>
                                    )}
                                </div>
                                <p className={`text-xs mt-2 font-medium ${wellnessData?.burnout_risk?.level === 'low' ? 'text-emerald-600' :
                                    wellnessData?.burnout_risk?.level === 'medium' ? 'text-amber-600' : 'text-red-500'
                                    }`}>
                                    Burnout risk: {wellnessData?.burnout_risk?.level ?? 'unknown'}
                                </p>
                            </div>
                            <a href="/dashboard/wellness" className="text-xs font-medium px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg shrink-0 transition-colors after:absolute after:inset-0">View &rarr;</a>
                        </div>

                        {/* Goals mini-card */}
                        <div className="bg-white relative hover:shadow-md transition-shadow rounded-lg p-6 shadow-sm border border-gray-200 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <Target className="w-7 h-7 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-500 mb-1">Goals</p>
                                <p className="text-2xl font-bold text-gray-900">{activeGoals} active</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                        <div
                                            className="h-1.5 rounded-full bg-indigo-500"
                                            style={{ width: `${goalCompletionPct}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-400">{goalCompletionPct}% done</span>
                                </div>
                            </div>
                            <a href="/dashboard/goals" className="text-xs font-medium px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg shrink-0 transition-colors after:absolute after:inset-0">View &rarr;</a>
                        </div>
                    </div>

                    {/* Activity Heatmap — last 30 days */}
                    <ActivityHeatmap dailyData={dailyData?.metrics ?? []} />

                    {/* ── Today at a Glance ──────────────────────────────── */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6">
                        <h3 className="text-base font-semibold text-indigo-900 mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-indigo-500" />
                            Today at a Glance
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Hours Tracked</p>
                                <p className="text-xl font-bold text-indigo-700">{data.total_hours.toFixed(1)}h</p>
                                <p className="text-xs text-gray-400">today</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Focus Score</p>
                                <p className="text-xl font-bold text-indigo-700">{data.focus_score}</p>
                                <p className="text-xs text-gray-400">out of 100</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Top App</p>
                                <p className="text-xl font-bold text-indigo-700 truncate">{data.top_apps[0]?.app ?? '—'}</p>
                                <p className="text-xs text-gray-400">{data.top_apps[0]?.duration ?? 'no data'}</p>
                            </div>
                            <div className="bg-white rounded-lg p-4 shadow-sm">
                                <p className="text-xs text-gray-500 mb-1">Activities</p>
                                <p className="text-xl font-bold text-indigo-700">{data.total_activities}</p>
                                <p className="text-xs text-gray-400">logged</p>
                            </div>
                        </div>
                        {data.recent_activities.length > 0 && (
                            <p className="text-xs text-indigo-700 mt-3">
                                Latest: <span className="font-medium">{data.recent_activities[0]?.title || data.recent_activities[0]?.app}</span>
                                <span className="text-indigo-400 ml-1">· {data.recent_activities[0]?.time_ago}</span>
                            </p>
                        )}
                    </div>

                    {/* Top Apps */}
                    {data.top_apps.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold mb-4">Top Apps by Usage</h3>
                            <div className="space-y-3">
                                {data.top_apps.map((app, i) => {
                                    const maxHours = data.top_apps[0]?.hours || 1;
                                    const percent = Math.min(100, (app.hours / maxHours) * 100);
                                    return (
                                        <div key={i} className="flex items-center gap-4">
                                            <div className="w-24 text-sm font-medium text-gray-700 truncate">{app.app}</div>
                                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 w-16 text-right">{app.duration}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* High-Level Highlights */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">High-Level Highlights</h3>
                        <div className="space-y-4">
                            {data.top_apps.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Monitor className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Most Productive App</p>
                                        <p className="text-sm text-gray-500">
                                            {data.top_apps[0].app} ({data.top_apps[0].duration} today)
                                        </p>
                                    </div>
                                </div>
                            )}
                            {data.deep_work_hours > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Deep Work Achieved</p>
                                        <p className="text-sm text-gray-500">
                                            You logged {data.deep_work_hours.toFixed(1)}h of deep work today.
                                        </p>
                                    </div>
                                </div>
                            )}
                            {Object.keys(data.activity_types).length > 0 && (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                        <Target className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Top Activity Category</p>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {Object.entries(data.activity_types).sort((a,b) => b[1]-a[1])[0][0]} ({Object.entries(data.activity_types).sort((a,b) => b[1]-a[1])[0][1]} instances)
                                        </p>
                                    </div>
                                </div>
                            )}
                            {data.top_apps.length === 0 && data.deep_work_hours === 0 && Object.keys(data.activity_types).length === 0 && (
                                <div className="text-center py-4 text-gray-400">
                                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Not enough data for highlights yet. Start tracking!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : null}

            {/* AI Panels — Proactive Insights + Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="text-lg">🧠</span> AI Insights
                    </h3>
                    <ProactiveInsightsPanel overviewFocusScore={data?.focus_score} overviewDeepWorkHours={data?.deep_work_hours} />
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <RecommendationsPanel overview={data ?? null} />
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <a
                    href="/dashboard/productivity"
                    className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                    <h3 className="font-semibold mb-2">View Productivity</h3>
                    <p className="text-sm text-gray-600">See your detailed productivity metrics</p>
                </a>
                <a
                    href="/dashboard/graph"
                    className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                    <h3 className="font-semibold mb-2">Explore Graph</h3>
                    <p className="text-sm text-gray-600">Visualize your knowledge graph</p>
                </a>
                <a
                    href="/dashboard/weekly-digest"
                    className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                    <h3 className="font-semibold mb-2">Weekly Report</h3>
                    <p className="text-sm text-gray-600">Read your weekly summary</p>
                </a>
            </div>
        </div>
    );
}
