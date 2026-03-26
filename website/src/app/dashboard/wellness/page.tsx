'use client';

import { Heart, AlertTriangle, CheckCircle, Coffee, TrendingDown, TrendingUp, Minus, MessageSquare } from 'lucide-react';
import { useWellness } from '@/lib/hooks/useGoals';
import { FocusScoreTrend } from '@/components/Dashboard/FocusScoreTrend';
import Link from 'next/link';

function ScoreRing({ score, color, size = 120 }: { score: number; color: string; size?: number }) {
    const radius = (size - 16) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={color} strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
        </svg>
    );
}

export default function WellnessPage() {
    const { data: wellness, isLoading } = useWellness();

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-10 bg-gray-100 rounded animate-pulse w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    const score = wellness?.overall_score ?? 0;

    // No data at all — show empty state
    if (!isLoading && !wellness) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Heart className="w-6 h-6 text-emerald-500" /> Wellness
                    </h1>
                    <p className="text-gray-500 mt-1">Monitor your work-life balance, burnout risk, and recovery patterns</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No wellness data yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">Start tracking your activities to get wellness insights, burnout risk analysis, and work-life balance scores.</p>
                </div>
            </div>
        );
    }

    const balance = wellness?.work_life_balance ?? {};
    const burnout = (wellness?.burnout_risk ?? {}) as { level?: string; long_sessions?: number };
    const rest = wellness?.rest_recovery ?? {};
    const burnoutLevel = burnout.level ?? 'low';

    const burnoutColors: Record<string, string> = { low: 'text-emerald-700 bg-emerald-100', medium: 'text-amber-700 bg-amber-100', high: 'text-red-700 bg-red-100' };
    const ringColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';



    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Heart className="w-6 h-6 text-rose-500" /> Wellness & Energy
                    </h1>
                    <p className="text-gray-600 mt-1">Track your work-life balance and energy patterns</p>
                </div>
                <Link
                    href="/dashboard/chat?prompt=How+can+I+improve+my+wellness+based+on+my+activity+patterns%3F"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <MessageSquare className="w-4 h-4" /> Ask AI
                </Link>
            </div>

            {/* Overall Score */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex items-center gap-8">
                <div className="relative shrink-0">
                    <ScoreRing score={score} color={ringColor} size={130} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900">{score.toFixed(0)}</span>
                        <span className="text-xs text-gray-400">/ 100</span>
                    </div>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">Wellness Score</h2>
                    <p className="text-gray-500 mt-1 text-sm">
                        Based on your break habits, session lengths, and work patterns over the last 7 days.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                        {score >= 70 ? (
                            <span className="flex items-center gap-1 text-sm text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                                <CheckCircle className="w-3.5 h-3.5" /> Healthy
                            </span>
                        ) : score >= 40 ? (
                            <span className="flex items-center gap-1 text-sm text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                                <AlertTriangle className="w-3.5 h-3.5" /> Needs attention
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-sm text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                                <AlertTriangle className="w-3.5 h-3.5" /> At risk
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Work-Life Balance */}
                <div className="bg-white rounded-2xl border border-emerald-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Work-Life Balance</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-700 mb-1">
                        {((balance as { score?: number }).score ?? 0).toFixed(0)}
                        <span className="text-base font-normal text-gray-400">/100</span>
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                        <div
                            className="h-2 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.min(100, (balance as { score?: number }).score ?? 0)}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        Break ratio: {(((balance as { break_ratio?: number }).break_ratio ?? 0) * 100).toFixed(1)}%
                        <span className="ml-1 text-gray-400">(target: 20%)</span>
                    </p>
                </div>

                {/* Burnout Risk */}
                <div className={`bg-white rounded-2xl border p-5 ${burnoutLevel === 'high' ? 'border-red-200' : burnoutLevel === 'medium' ? 'border-amber-200' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${burnoutLevel === 'high' ? 'bg-red-100' : burnoutLevel === 'medium' ? 'bg-amber-100' : 'bg-emerald-100'}`}>
                                {burnoutLevel === 'low'
                                    ? <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    : <AlertTriangle className={`w-4 h-4 ${burnoutLevel === 'high' ? 'text-red-600' : 'text-amber-600'}`} />}
                            </div>
                            <span className="font-semibold text-gray-900 text-sm">Burnout Risk</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${burnoutColors[burnoutLevel]}`}>
                            {burnoutLevel.charAt(0).toUpperCase() + burnoutLevel.slice(1)}
                        </span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{((burnout as { long_sessions?: number }).long_sessions ?? 0)}</p>
                    <p className="text-xs text-gray-500">long sessions (&gt;2h) this week</p>
                    {burnoutLevel !== 'low' && (
                        <p className="text-xs text-amber-700 mt-2 bg-amber-50 rounded p-1.5">
                            💡 Take more frequent breaks to reduce burnout risk
                        </p>
                    )}
                </div>

                {/* Rest & Recovery */}
                <div className="bg-white rounded-2xl border border-blue-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Coffee className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Rest & Recovery</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700 mb-1">
                        {((rest as { break_count?: number }).break_count ?? 0)}
                        <span className="text-base font-normal text-gray-400 ml-1">breaks</span>
                    </p>
                    <p className="text-sm text-gray-500">
                        {((rest as { total_break_minutes?: number }).total_break_minutes ?? 0).toFixed(0)} min total break time
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Avg {((rest as { break_count?: number }).break_count ?? 0) > 0
                            ? (((rest as { total_break_minutes?: number }).total_break_minutes ?? 0) / ((rest as { break_count?: number }).break_count ?? 1)).toFixed(0)
                            : 0} min/break
                    </p>
                </div>
            </div>

            {/* Focus Trend with Range Dropdown */}
            <FocusScoreTrend />

            {/* Dynamic Tips */}
            {(() => {
                const tips: string[] = [];
                const balScore = (balance as { score?: number }).score ?? 0;
                const breaks = (rest as { break_count?: number }).break_count ?? 0;
                if (burnoutLevel === 'high') tips.push('⚠️ High burnout risk detected — take a 10-min break every 60 minutes and avoid sessions over 2 hours');
                else if (burnoutLevel === 'medium') tips.push('Moderate burnout risk — consider scheduling short breaks between long focus sessions');
                else tips.push('✅ Low burnout risk — keep up the great work-life habits!');
                if (balScore < 30) tips.push(`Work-life balance is ${balScore}/100 — try to increase break frequency (currently ${((balance as { break_ratio?: number }).break_ratio ?? 0) * 100 < 10 ? 'well below' : 'below'} the 20% target)`);
                else if (balScore >= 70) tips.push('Strong work-life balance — your break habits are sustainable');
                if (breaks < 10) tips.push(`Only ${breaks} breaks this week — aim for at least 3-4 breaks per work day`);
                else tips.push(`${breaks} breaks this week — good recovery pattern`);
                if (score < 40) tips.push('Your wellness score suggests you may be overworking — consider shorter sessions and more frequent rest');
                tips.push('Wednesday and Thursday afternoons tend to be highest-energy windows');
                return (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                        <h3 className="font-semibold text-rose-900 mb-2">💡 Wellness Tips</h3>
                        <ul className="text-sm text-rose-800 space-y-1">
                            {tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                        </ul>
                    </div>
                );
            })()}
        </div>
    );
}
