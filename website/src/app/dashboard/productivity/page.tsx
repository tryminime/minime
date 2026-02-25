'use client';

import { ProductivityMetrics } from '@/components/Dashboard/ProductivityMetrics';
import { FocusScoreTrend } from '@/components/Dashboard/FocusScoreTrend';
import { MeetingLoad } from '@/components/Dashboard/MeetingLoad';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';
import { TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';
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
                        const hours = ((m.total_seconds || 0) / 3600).toFixed(1);
                        const deepH = (m.deep_work_sessions * 0.75).toFixed(1);
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
            const payload = result.activities ?? result;
            const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `minime_productivity_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success(`Exported ${result.total ?? 0} activities!`);
        } catch {
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
