'use client';

import { ProductivityMetrics } from '@/components/Dashboard/ProductivityMetrics';
import { FocusScoreTrend } from '@/components/Dashboard/FocusScoreTrend';
import { MeetingLoad } from '@/components/Dashboard/MeetingLoad';
import { ProductivityForecastPanel } from '@/components/FeaturePanels';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';
import { TrendingUp, TrendingDown, Minus, Download, Brain, ArrowRightLeft, Coffee, Clock, Zap, Target, FileText, Camera, Eye, Layers } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ProdMetrics {
    total_hours: number;
    focus_score: number;
    deep_work_hours: number;
    context_switches: number;
    time_allocation: Record<string, number>;
    comparison: Record<string, number>;
}

interface DailyMetric {
    date: string;
    focus_score: number;
    productivity_score: number;
    total_seconds: number;
    deep_work_sessions: number;
    meeting_load_hours: number;
    activity_count: number;
}

const ALLOC_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

function TimeAllocationDonut({ allocation }: { allocation: Record<string, number> }) {
    const entries = Object.entries(allocation).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    if (total === 0) return <p className="text-sm text-gray-400 text-center py-8">No time allocation data yet</p>;

    let cumulative = 0;
    const segments = entries.map(([label, value], i) => {
        const pct = value / total;
        const startAngle = cumulative * 360;
        const endAngle = (cumulative + pct) * 360;
        cumulative += pct;
        const toRad = (deg: number) => (deg * Math.PI) / 180;
        const cx = 80, cy = 80, r = 60;
        const x1 = cx + r * Math.sin(toRad(startAngle));
        const y1 = cy - r * Math.cos(toRad(startAngle));
        const x2 = cx + r * Math.sin(toRad(endAngle));
        const y2 = cy - r * Math.cos(toRad(endAngle));
        const largeArc = pct > 0.5 ? 1 : 0;
        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
        return { label, value, pct, d, color: ALLOC_COLORS[i % ALLOC_COLORS.length] };
    });

    return (
        <div className="flex items-center gap-6">
            <svg width="160" height="160" className="shrink-0">
                {segments.map(s => <path key={s.label} d={s.d} fill={s.color} stroke="white" strokeWidth="2" />)}
                <circle cx="80" cy="80" r="30" fill="white" />
                <text x="80" y="75" textAnchor="middle" fontSize="12" fill="#374151" fontWeight="600">{total.toFixed(1)}h</text>
                <text x="80" y="90" textAnchor="middle" fontSize="9" fill="#9ca3af">total</text>
            </svg>
            <div className="flex flex-col gap-1.5 min-w-0">
                {segments.slice(0, 6).map(s => (
                    <div key={s.label} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
                        <span className="text-xs text-gray-600 truncate capitalize">{s.label.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-gray-400 ml-auto shrink-0">{(s.pct * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ComparisonRow({ label, value, unit }: { label: string; value: number; unit: string }) {
    const isPositive = value > 0;
    const isNeutral = value === 0;
    return (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-600">{label}</span>
            <div className={`flex items-center gap-1 text-sm font-semibold ${isNeutral ? 'text-gray-400' : isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                {isNeutral ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isPositive ? '+' : ''}{value}{unit}
            </div>
        </div>
    );
}

// 30-day focus score trend (SVG line chart)
function ThirtyDayTrend({ metrics }: { metrics: DailyMetric[] }) {
    if (!metrics || metrics.length === 0) {
        return <p className="text-sm text-gray-400 text-center py-8">No historical data yet — keep tracking!</p>;
    }
    const W = 500, H = 120, PAD = 20;
    const scores = metrics.map(m => m.focus_score);
    const minS = Math.min(...scores, 0);
    const maxS = Math.max(...scores, 1);
    const xStep = (W - PAD * 2) / Math.max(metrics.length - 1, 1);
    const yScale = (s: number) => PAD + ((maxS - s) / (maxS - minS || 1)) * (H - PAD * 2);
    const points = metrics.map((m, i) => `${PAD + i * xStep},${yScale(m.focus_score)}`).join(' ');
    const first = metrics[0];
    const last = metrics[metrics.length - 1];

    return (
        <div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 120 }}>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(v => (
                    <line key={v} x1={PAD} x2={W - PAD} y1={yScale(v)} y2={yScale(v)} stroke="#f3f4f6" strokeWidth="1" />
                ))}
                {/* Gradient fill */}
                <defs>
                    <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={`${PAD + 0 * xStep},${H - PAD} ${points} ${PAD + (metrics.length - 1) * xStep},${H - PAD}`}
                    fill="url(#focusGrad)"
                />
                {/* Line */}
                <polyline points={points} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {/* Dots at first and last */}
                <circle cx={PAD} cy={yScale(first.focus_score)} r="4" fill="#6366f1" />
                <circle cx={PAD + (metrics.length - 1) * xStep} cy={yScale(last.focus_score)} r="4" fill="#6366f1" />
            </svg>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{first.date}</span>
                <span>Today</span>
            </div>
        </div>
    );
}

// Daily breakdown table — last 7 days
function DailyBreakdownTable({ metrics }: { metrics: DailyMetric[] }) {
    const last7 = [...metrics].slice(-7);
    if (last7.length === 0) {
        return <p className="text-sm text-gray-400 text-center py-6">No daily data yet</p>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-100">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500">Date</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Hours</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Focus</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Deep Work</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500">Meetings</th>
                    </tr>
                </thead>
                <tbody>
                    {last7.map(m => {
                        const hours = Math.min((m.total_seconds || 0) / 3600, 24).toFixed(1);
                        const deepH = ((m.deep_work_sessions || 0) * 25 / 60).toFixed(1);  // 25min per session
                        const meetH = (m.meeting_load_hours || 0).toFixed(1);
                        const focusColor = m.focus_score >= 70 ? 'text-emerald-600' : m.focus_score >= 40 ? 'text-amber-600' : 'text-red-500';
                        return (
                            <tr key={m.date} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="py-2.5 px-3 text-gray-700 font-medium">{m.date}</td>
                                <td className="py-2.5 px-3 text-right text-gray-600">{hours}h</td>
                                <td className={`py-2.5 px-3 text-right font-semibold ${focusColor}`}>{m.focus_score.toFixed(0)}</td>
                                <td className="py-2.5 px-3 text-right text-gray-600">{deepH}h</td>
                                <td className="py-2.5 px-3 text-right text-gray-600">{meetH}h</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ============================================================
// DEEP WORK SESSIONS PANEL
// ============================================================

interface DeepWorkData {
    sessions: { start: string; end: string; duration_minutes: number; app: string; date: string }[];
    daily_summary: { date: string; sessions: number; total_minutes: number }[];
    top_apps: { app: string; hours: number }[];
    total_deep_work_hours: number;
    avg_session_minutes: number;
    longest_session_minutes: number;
    total_sessions: number;
}

function DeepWorkPanel() {
    const api = getAPIClient();
    const { data, isLoading } = useQuery<DeepWorkData>({
        queryKey: ['productivity', 'deep-work-sessions'],
        queryFn: () => api.get('/api/v1/analytics/productivity/deep-work-sessions?days=7'),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) return <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse h-64" />;

    const d = data || { sessions: [], daily_summary: [], top_apps: [], total_deep_work_hours: 0, avg_session_minutes: 0, longest_session_minutes: 0, total_sessions: 0 };
    const maxMin = Math.max(...(d.daily_summary.map(s => s.total_minutes) || [1]), 1);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Deep Work Sessions</h3>
                    <p className="text-xs text-gray-400">Focused blocks ≥25 min (last 7 days)</p>
                </div>
            </div>

            {d.total_sessions === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No deep work sessions detected yet — keep tracking!</p>
            ) : (
                <>
                    {/* Stats row */}
                    <div className="grid grid-cols-4 gap-3 mb-5">
                        {[
                            { label: 'Total Hours', value: `${d.total_deep_work_hours}h`, icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
                            { label: 'Sessions', value: d.total_sessions, icon: Zap, color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Avg Length', value: `${d.avg_session_minutes}m`, icon: Target, color: 'text-amber-600 bg-amber-50' },
                            { label: 'Longest', value: `${d.longest_session_minutes}m`, icon: TrendingUp, color: 'text-purple-600 bg-purple-50' },
                        ].map(s => (
                            <div key={s.label} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center mb-1 ${s.color}`}>
                                    <s.icon className="w-3 h-3" />
                                </div>
                                <div className="text-lg font-bold text-gray-900">{s.value}</div>
                                <div className="text-[10px] text-gray-400">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Daily bar chart + top apps */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Daily bars */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Daily Deep Work</h4>
                            <div className="space-y-2">
                                {d.daily_summary.map(day => (
                                    <div key={day.date} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-20 shrink-0">{day.date.slice(5)}</span>
                                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all"
                                                style={{ width: `${Math.max((day.total_minutes / maxMin) * 100, 2)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 w-16 text-right">{day.total_minutes}m</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Top apps */}
                        <div>
                            <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Top Deep Work Apps</h4>
                            <div className="space-y-2">
                                {d.top_apps.slice(0, 5).map((app, i) => (
                                    <div key={app.app} className="flex items-center gap-2">
                                        <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                        <span className="text-sm text-gray-700 truncate flex-1">{app.app}</span>
                                        <span className="text-xs font-medium text-gray-500">{app.hours}h</span>
                                    </div>
                                ))}
                            </div>

                            {/* Recent sessions */}
                            <h4 className="text-xs font-semibold text-gray-500 mb-2 mt-4 uppercase tracking-wider">Recent Sessions</h4>
                            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                {d.sessions.slice(-5).reverse().map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
                                        <span className="text-gray-500 w-14 shrink-0">{s.start.slice(11, 16)}</span>
                                        <span className="text-gray-700 truncate flex-1">{s.app}</span>
                                        <span className="font-medium text-gray-600">{s.duration_minutes}m</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}


// ============================================================
// CONTEXT SWITCH ANALYSIS PANEL
// ============================================================

interface ContextSwitchData {
    hourly: { hour: string; switches: number }[];
    daily: { date: string; switches: number }[];
    top_patterns: { pattern: string; count: number }[];
    total_switches: number;
    avg_per_day: number;
    peak_hour: number | null;
    peak_hour_label: string | null;
}

function ContextSwitchPanel() {
    const api = getAPIClient();
    const { data, isLoading } = useQuery<ContextSwitchData>({
        queryKey: ['productivity', 'context-switch-timeline'],
        queryFn: () => api.get('/api/v1/analytics/productivity/context-switch-timeline?days=7'),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) return <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse h-64" />;

    const d = data || { hourly: [], daily: [], top_patterns: [], total_switches: 0, avg_per_day: 0, peak_hour: null, peak_hour_label: null };
    const maxSwitches = Math.max(...(d.daily.map(s => s.switches) || [1]), 1);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Context Switch Analysis</h3>
                    <p className="text-xs text-gray-400">App transitions that break your flow (last 7 days)</p>
                </div>
            </div>

            {d.total_switches === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No context switches detected — great focus!</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left: daily trend + stats */}
                    <div>
                        {/* Stats cards */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-100">
                                <div className="text-lg font-bold text-amber-700">{d.total_switches}</div>
                                <div className="text-[10px] text-amber-500">Total Switches</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                                <div className="text-lg font-bold text-orange-700">{d.avg_per_day}</div>
                                <div className="text-[10px] text-orange-500">Avg / Day</div>
                            </div>
                            <div className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                                <div className="text-lg font-bold text-red-700">{d.peak_hour_label || '—'}</div>
                                <div className="text-[10px] text-red-500">Peak Hour</div>
                            </div>
                        </div>

                        {/* Daily bars */}
                        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Daily Switches</h4>
                        <div className="space-y-2">
                            {d.daily.map(day => (
                                <div key={day.date} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500 w-20 shrink-0">{day.date.slice(5)}</span>
                                    <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-amber-400 rounded-full transition-all"
                                            style={{ width: `${Math.max((day.switches / maxSwitches) * 100, 2)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-medium text-gray-700 w-10 text-right">{day.switches}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: top switching patterns */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Top Switch Patterns</h4>
                        <div className="space-y-2">
                            {d.top_patterns.slice(0, 8).map((p, i) => {
                                const maxCount = d.top_patterns[0]?.count || 1;
                                return (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-gray-700 truncate">{p.pattern}</div>
                                            <div className="h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-300 rounded-full"
                                                    style={{ width: `${(p.count / maxCount) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-xs font-semibold text-amber-700 w-8 text-right">{p.count}×</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Tip */}
                        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
                            <p className="text-xs text-amber-800">
                                <span className="font-semibold">💡 Tip:</span> Fewer context switches = better focus. Try batching similar tasks together.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// ============================================================
// BREAK PATTERNS PANEL
// ============================================================

interface BreakData {
    breaks: { start: string; end: string; duration_minutes: number; date: string; before_app: string; after_app: string }[];
    daily_summary: { date: string; break_count: number; avg_duration_minutes: number; total_break_minutes: number; quality_score: number }[];
    avg_break_minutes: number;
    total_breaks: number;
    break_quality_score: number;
    recommendation: string;
}

function BreakPatternsPanel() {
    const api = getAPIClient();
    const { data, isLoading } = useQuery<BreakData>({
        queryKey: ['productivity', 'break-patterns'],
        queryFn: () => api.get('/api/v1/analytics/productivity/break-patterns?days=7'),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) return <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse h-64" />;

    const d = data || { breaks: [], daily_summary: [], avg_break_minutes: 0, total_breaks: 0, break_quality_score: 5, recommendation: '' };
    const qualityPct = (d.break_quality_score / 10) * 100;
    const qualityColor = d.break_quality_score >= 7 ? 'text-emerald-600' : d.break_quality_score >= 4 ? 'text-amber-600' : 'text-red-500';
    const qualityBarColor = d.break_quality_score >= 7 ? 'bg-emerald-500' : d.break_quality_score >= 4 ? 'bg-amber-400' : 'bg-red-400';

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Coffee className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Break Patterns</h3>
                    <p className="text-xs text-gray-400">Recovery gaps between work sessions (last 7 days)</p>
                </div>
            </div>

            {d.total_breaks === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No breaks detected — take short breaks every 90-120 minutes!</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Left: quality gauge + daily breakdown */}
                    <div>
                        {/* Quality score gauge */}
                        <div className="flex items-center gap-4 mb-5 p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="text-center">
                                <div className={`text-3xl font-bold ${qualityColor}`}>{d.break_quality_score}</div>
                                <div className="text-[10px] text-gray-400">/ 10</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">Break Quality Score</div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${qualityBarColor} rounded-full transition-all`} style={{ width: `${qualityPct}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                    <span>{d.total_breaks} breaks</span>
                                    <span>~{d.avg_break_minutes}m avg</span>
                                </div>
                            </div>
                        </div>

                        {/* Daily quality bars */}
                        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Daily Break Quality</h4>
                        <div className="space-y-2">
                            {d.daily_summary.map(day => {
                                const qColor = day.quality_score >= 7 ? 'bg-emerald-500' : day.quality_score >= 4 ? 'bg-amber-400' : 'bg-red-400';
                                return (
                                    <div key={day.date} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-20 shrink-0">{day.date.slice(5)}</span>
                                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${qColor} rounded-full transition-all`} style={{ width: `${(day.quality_score / 10) * 100}%` }} />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 w-14 text-right">{day.quality_score}/10</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: recent breaks + recommendation */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Recent Breaks</h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {d.breaks.slice(-8).reverse().map((b, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-gray-50">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                    <span className="text-gray-500 w-14 shrink-0">{b.start.slice(11, 16)}</span>
                                    <span className="text-gray-600 truncate flex-1">{b.before_app} → {b.after_app}</span>
                                    <span className="font-medium text-emerald-600">{b.duration_minutes}m</span>
                                </div>
                            ))}
                        </div>

                        {/* Recommendation */}
                        {d.recommendation && (
                            <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                                <p className="text-xs text-emerald-800">
                                    <span className="font-semibold">☕ Recommendation:</span> {d.recommendation}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// BREAK CLASSIFICATION PANEL
// ============================================================

interface BreakClassification {
    breaks: { start: string; end: string; duration_minutes: number; size: string; type: string; before_app: string; after_app: string; day: string }[];
    daily_summary: Record<string, { micro: number; short: number; medium: number; long: number; extended: number; total_minutes: number; count: number }>;
    break_to_work_ratio: number;
    optimal_break_score: number;
    total_work_minutes: number;
    total_break_minutes: number;
}

const SIZE_COLORS: Record<string, string> = { micro: '#94a3b8', short: '#60a5fa', medium: '#a78bfa', long: '#f59e0b', extended: '#ef4444' };
const TYPE_COLORS: Record<string, string> = { natural: 'bg-sky-100 text-sky-700', scheduled: 'bg-violet-100 text-violet-700', forced: 'bg-rose-100 text-rose-700' };

function BreakClassificationPanel() {
    const api = getAPIClient();
    const { data, isLoading } = useQuery<BreakClassification>({
        queryKey: ['productivity', 'break-classification'],
        queryFn: () => api.get('/api/v1/analytics/productivity/break-classification?days=7'),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) return <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse h-64" />;

    const d = data || { breaks: [], daily_summary: {}, break_to_work_ratio: 0, optimal_break_score: 0, total_work_minutes: 0, total_break_minutes: 0 };
    const optPct = (d.optimal_break_score / 10) * 100;
    const optColor = d.optimal_break_score >= 7 ? 'text-emerald-600' : d.optimal_break_score >= 4 ? 'text-amber-600' : 'text-red-500';
    const optBar = d.optimal_break_score >= 7 ? 'bg-emerald-500' : d.optimal_break_score >= 4 ? 'bg-amber-400' : 'bg-red-400';
    const days = Object.entries(d.daily_summary).slice(-7);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-violet-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Break Classification</h3>
                    <p className="text-xs text-gray-400">Break types & work-break ratio (last 7 days)</p>
                </div>
            </div>

            {d.breaks.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No classified breaks yet</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div>
                        {/* Optimal break score gauge */}
                        <div className="flex items-center gap-4 mb-5 p-4 rounded-lg bg-gray-50 border border-gray-100">
                            <div className="text-center">
                                <div className={`text-3xl font-bold ${optColor}`}>{d.optimal_break_score}</div>
                                <div className="text-[10px] text-gray-400">/ 10</div>
                            </div>
                            <div className="flex-1">
                                <div className="text-xs text-gray-500 mb-1">Optimal Break Score</div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${optBar} rounded-full transition-all`} style={{ width: `${optPct}%` }} />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                                    <span>Ratio: {d.break_to_work_ratio}</span>
                                    <span>Work: {Math.round(d.total_work_minutes)}m / Break: {Math.round(d.total_break_minutes)}m</span>
                                </div>
                            </div>
                        </div>

                        {/* Daily stacked bars by size */}
                        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Daily Breakdown by Size</h4>
                        <div className="space-y-2">
                            {days.map(([date, s]) => {
                                const total = s.count || 1;
                                return (
                                    <div key={date} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-16 shrink-0">{date.slice(5)}</span>
                                        <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden flex">
                                            {['micro', 'short', 'medium', 'long', 'extended'].map(size => {
                                                const count = (s as Record<string, number>)[size] || 0;
                                                if (count === 0) return null;
                                                return <div key={size} style={{ width: `${(count / total) * 100}%`, backgroundColor: SIZE_COLORS[size] }} className="h-full" title={`${size}: ${count}`} />;
                                            })}
                                        </div>
                                        <span className="text-xs text-gray-600 w-8 text-right">{s.count}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Legend */}
                        <div className="flex gap-3 mt-3 flex-wrap">
                            {Object.entries(SIZE_COLORS).map(([k, c]) => (
                                <div key={k} className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: c }} /><span className="text-[10px] text-gray-500 capitalize">{k}</span></div>
                            ))}
                        </div>
                    </div>

                    {/* Right: recent classified breaks */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Recent Classified Breaks</h4>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                            {d.breaks.slice(-10).reverse().map((b, i) => (
                                <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-gray-50">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: SIZE_COLORS[b.size] || '#94a3b8' }} />
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${TYPE_COLORS[b.type] || 'bg-gray-100 text-gray-600'}`}>{b.type}</span>
                                    <span className="text-gray-600 truncate flex-1">{b.before_app} → {b.after_app}</span>
                                    <span className="font-medium text-violet-600">{b.duration_minutes}m</span>
                                    <span className="text-gray-400 capitalize">{b.size}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// FOCUS PERIODS PANEL
// ============================================================

interface FocusPeriodData {
    periods: { start: string; duration_minutes: number; app_name: string; depth: string; distractions: number; quality_score: number }[];
    summary: { total_periods: number; avg_quality: number; longest_minutes: number; depth_distribution: Record<string, number> };
}

const DEPTH_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
    flow_state: { bg: 'bg-amber-100', text: 'text-amber-700', bar: '#f59e0b' },
    deep_work: { bg: 'bg-purple-100', text: 'text-purple-700', bar: '#8b5cf6' },
    focused: { bg: 'bg-indigo-100', text: 'text-indigo-700', bar: '#6366f1' },
    moderate: { bg: 'bg-blue-100', text: 'text-blue-700', bar: '#3b82f6' },
    shallow: { bg: 'bg-gray-100', text: 'text-gray-600', bar: '#9ca3af' },
};

function FocusPeriodsPanel() {
    const api = getAPIClient();
    const { data, isLoading } = useQuery<FocusPeriodData>({
        queryKey: ['productivity', 'focus-periods'],
        queryFn: () => api.get('/api/v1/analytics/productivity/focus-periods?days=7'),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) return <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse h-64" />;

    const d = data || { periods: [], summary: { total_periods: 0, avg_quality: 0, longest_minutes: 0, depth_distribution: {} } };
    const qualColor = d.summary.avg_quality >= 70 ? 'text-emerald-600' : d.summary.avg_quality >= 40 ? 'text-amber-600' : 'text-red-500';

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Focus Periods</h3>
                    <p className="text-xs text-gray-400">Focus depth analysis with distraction tracking (last 7 days)</p>
                </div>
            </div>

            {d.periods.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No focus periods detected yet</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div>
                        {/* Summary stats */}
                        <div className="grid grid-cols-3 gap-3 mb-5">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-800">{d.summary.total_periods}</div>
                                <div className="text-[10px] text-gray-400">Total Periods</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className={`text-2xl font-bold ${qualColor}`}>{d.summary.avg_quality}</div>
                                <div className="text-[10px] text-gray-400">Avg Quality</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-indigo-600">{Math.round(d.summary.longest_minutes)}m</div>
                                <div className="text-[10px] text-gray-400">Longest</div>
                            </div>
                        </div>

                        {/* Depth distribution */}
                        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Depth Distribution</h4>
                        <div className="space-y-2">
                            {Object.entries(d.summary.depth_distribution).sort((a, b) => b[1] - a[1]).map(([depth, count]) => {
                                const dc = DEPTH_COLORS[depth] || DEPTH_COLORS.shallow;
                                const pct = d.summary.total_periods > 0 ? (count / d.summary.total_periods) * 100 : 0;
                                return (
                                    <div key={depth} className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 w-20 shrink-0 capitalize">{depth.replace('_', ' ')}</span>
                                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: dc.bar }} />
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 w-8 text-right">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: recent focus periods */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Recent Focus Periods</h4>
                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                            {d.periods.slice(-12).reverse().map((p, i) => {
                                const dc = DEPTH_COLORS[p.depth] || DEPTH_COLORS.shallow;
                                return (
                                    <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-gray-50">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: dc.bar }} />
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${dc.bg} ${dc.text}`}>{p.depth.replace('_', ' ')}</span>
                                        <span className="text-gray-600 truncate flex-1">{p.app_name}</span>
                                        <span className="font-medium text-indigo-600">{p.duration_minutes}m</span>
                                        {p.distractions > 0 && <span className="text-red-400" title="Distractions">⚡{p.distractions}</span>}
                                        <span className="text-gray-400">Q{p.quality_score}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// SCREENSHOT TIMELINE PANEL
// ============================================================

interface ScreenshotMeta {
    screenshots: { id: string; timestamp: string; app_name: string; window_title: string; label: string; width?: number; height?: number; file_size_bytes?: number; encrypted: boolean; stored_locally: boolean }[];
    total: number;
    note: string;
}

function ScreenshotTimelinePanel() {
    const api = getAPIClient();
    const { data, isLoading } = useQuery<ScreenshotMeta>({
        queryKey: ['productivity', 'screenshots-meta'],
        queryFn: () => api.get('/api/v1/analytics/screenshots/meta?days=7&limit=50'),
        staleTime: 5 * 60 * 1000,
    });

    if (isLoading) return <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse h-48" />;

    const d = data || { screenshots: [], total: 0, note: '' };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                    <h3 className="text-base font-semibold text-gray-900">Screenshot Timeline</h3>
                    <p className="text-xs text-gray-400">On-demand screenshots — encrypted & stored locally</p>
                </div>
                <span className="ml-auto text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full font-medium">🔒 AES-256-GCM</span>
            </div>

            {d.total === 0 ? (
                <div className="text-center py-8">
                    <Camera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">No screenshots captured yet</p>
                    <p className="text-xs text-gray-300 mt-1">Use the desktop app to capture on-demand screenshots</p>
                </div>
            ) : (
                <div>
                    <div className="space-y-2 max-h-56 overflow-y-auto">
                        {d.screenshots.map(s => (
                            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                                    <Camera className="w-5 h-5 text-sky-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-800 truncate">{s.label || s.app_name}</div>
                                    <div className="text-xs text-gray-400 truncate">{s.window_title || 'No title'}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-xs text-gray-500">{new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className="text-[10px] text-gray-300">{new Date(s.timestamp).toLocaleDateString()}</div>
                                </div>
                                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">On Device</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-300 mt-3 text-center">{d.note}</p>
                </div>
            )}
        </div>
    );
}


export default function ProductivityPage() {
    const { isConnected, lastUpdate } = useWebSocket();
    const api = getAPIClient();
    const [isExporting, setIsExporting] = useState(false);

    const { data: prodData } = useQuery({
        queryKey: ['productivity', 'metrics'],
        queryFn: () => api.get<ProdMetrics>('/api/v1/analytics/productivity'),
        staleTime: 5 * 60 * 1000,
    });

    const { data: dailyData, isLoading: isLoadingDaily } = useQuery<{ metrics: DailyMetric[] }>({
        queryKey: ['productivity', 'daily-range'],
        queryFn: () => api.get('/api/v1/analytics/productivity/daily-range?days=30'),
        staleTime: 5 * 60 * 1000,
    });

    const timeAlloc = prodData?.time_allocation ?? {};
    const comparison = prodData?.comparison ?? {};
    const dailyMetrics = dailyData?.metrics ?? [];

    const handleExportJSON = async () => {
        setIsExporting(true);
        try {
            const result = await api.get<{ activities: object[]; total: number; format: string }>('/api/v1/analytics/export?format=json');
            const payload = result?.activities ?? result ?? [];
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `minime_productivity_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 100);
            toast.success(`Exported ${result?.total ?? (Array.isArray(payload) ? payload.length : 0)} activities!`);
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Export failed');
        } finally {
            setIsExporting(false);
        }
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Productivity Dashboard</h1>
                    <p className="text-gray-600 mt-1">Track your focus, deep work, and productivity metrics</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="text-sm text-gray-600">{isConnected ? 'Live' : 'Offline'}</span>
                        {lastUpdate && <span className="text-xs text-gray-400">Updated {lastUpdate.toLocaleTimeString()}</span>}
                    </div>
                    <button
                        onClick={() => {
                            const token = localStorage.getItem('minime_auth_token') || '';
                            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                            window.open(`${baseUrl}/api/v1/analytics/report?days=7&token=${token}`, '_blank');
                            toast.success('Generating productivity report…');
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        Report
                    </button>
                    <button
                        onClick={handleExportJSON}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exporting…' : 'Export'}
                    </button>
                </div>
            </div>

            {/* Metrics Overview */}
            <ProductivityMetrics />

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FocusScoreTrend />
                <MeetingLoad />
            </div>

            {/* Time Allocation + Comparative */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Time Allocation Donut */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Time Allocation</h3>
                    <TimeAllocationDonut allocation={timeAlloc} />
                </div>

                {/* Comparative Analytics */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">vs. Last Week</h3>
                    <p className="text-xs text-gray-400 mb-3">Changes in your key productivity indicators</p>
                    {Object.keys(comparison).length > 0 ? (
                        <div>
                            {Object.entries(comparison).map(([key, val]) => (
                                <ComparisonRow
                                    key={key}
                                    label={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    value={typeof val === 'number' ? Math.round(val * 10) / 10 : 0}
                                    unit={key.includes('hours') ? 'h' : key.includes('score') ? 'pts' : ''}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                            <p className="text-sm text-gray-400">No previous week data yet</p>
                            <p className="text-xs text-gray-300 mt-1">Keep tracking — comparisons appear after 2 active weeks</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 30-Day Trend + Daily Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 30-Day Focus Score Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">30-Day Focus Trend</h3>
                    <ThirtyDayTrend metrics={dailyMetrics} />
                </div>

                {/* Daily Breakdown Table */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-base font-semibold text-gray-900 mb-4">Daily Breakdown <span className="text-xs text-gray-400 font-normal">(last 7 days)</span></h3>
                    <DailyBreakdownTable metrics={dailyMetrics} />
                </div>
            </div>

            {/* ============================================ */}
            {/* DEEP WORK SESSIONS PANEL */}
            {/* ============================================ */}
            <DeepWorkPanel />

            {/* ============================================ */}
            {/* CONTEXT SWITCH ANALYSIS PANEL */}
            {/* ============================================ */}
            <ContextSwitchPanel />

            {/* ============================================ */}
            {/* BREAK PATTERNS PANEL */}
            {/* ============================================ */}
            <BreakPatternsPanel />

            {/* ============================================ */}
            {/* BREAK CLASSIFICATION PANEL */}
            {/* ============================================ */}
            <BreakClassificationPanel />

            {/* ============================================ */}
            {/* FOCUS PERIODS PANEL */}
            {/* ============================================ */}
            <FocusPeriodsPanel />

            {/* ============================================ */}
            {/* SCREENSHOT TIMELINE PANEL */}
            {/* ============================================ */}
            <ScreenshotTimelinePanel />

            {/* Forecast Panel */}
            <ProductivityForecastPanel />

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Productivity Tips</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Schedule deep work blocks in the morning when focus peaks</li>
                    <li>• Limit meetings to 25% of your day for optimal productivity</li>
                    <li>• Take regular breaks to maintain high focus scores</li>
                    <li>• Minimize context switches by batching similar tasks</li>
                </ul>
            </div>
        </div>
    );
}
