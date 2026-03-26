'use client';

import { TrendingUp, TrendingDown, Minus, Brain, Heart, Zap, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useFocusScore, useWellnessScore } from '@/lib/hooks/useAIChat';
import Link from 'next/link';

/** Generate a contextual focus tip based on real data */
function getFocusTip(score: number, maxScore: number, deepWorkHours: number, trend: string): string {
    const pct = score / maxScore;
    if (pct >= 0.8) {
        return `Excellent focus today with ${deepWorkHours}h deep work — keep protecting these blocks!`;
    }
    if (pct >= 0.5) {
        if (trend === 'down') return `Your focus dipped — try batching similar tasks to reduce context switches`;
        return `${deepWorkHours}h deep work so far — use "Do Not Disturb" mode to push higher`;
    }
    if (deepWorkHours < 1) {
        return `Only ${deepWorkHours}h deep work today — try blocking a 2h uninterrupted session`;
    }
    return `Focus is below average — minimize meetings and notifications during your next work block`;
}

/** Generate contextual wellness tips based on real wellness factors */
function getWellnessTips(status: string, factors: Record<string, number>, score: number): string[] {
    const tips: string[] = [];

    if (status === 'alert') {
        if (factors.work_intensity !== undefined && factors.work_intensity < 40) {
            tips.push(`Work intensity is very high — consider reducing daily hours to prevent burnout`);
        }
        if (factors.work_life_balance !== undefined && factors.work_life_balance < 50) {
            tips.push(`Work-life balance score is ${Math.round(factors.work_life_balance)} — take breaks between long sessions`);
        }
        if (tips.length === 0) {
            tips.push(`Wellness score is ${score}/100 — prioritize breaks and shorter work blocks`);
            tips.push(`Consider async-first communication to reduce real-time pressure`);
        }
    } else if (status === 'warning') {
        if (factors.collaboration_stress !== undefined && factors.collaboration_stress > 50) {
            tips.push(`Meeting load is high (stress: ${Math.round(factors.collaboration_stress)}%) — try reducing by 1-2 per week`);
        }
        if (factors.work_life_balance !== undefined && factors.work_life_balance < 60) {
            tips.push(`Balance score is ${Math.round(factors.work_life_balance)} — schedule regular breaks`);
        }
        if (tips.length === 0) {
            tips.push(`Score is ${score}/100 — small improvements to break habits will help`);
        }
    } else {
        tips.push(`Great balance at ${score}/100 — keep maintaining this rhythm!`);
        if (factors.skill_utilization !== undefined && factors.skill_utilization > 60) {
            tips.push(`Good app variety (${Math.round(factors.skill_utilization)}%) — well-rounded workflow`);
        }
    }

    if (factors.break_ratio !== undefined) {
        if (factors.break_ratio < 15) {
            tips.push(`Break ratio is ${factors.break_ratio}% — aim for 15-20% to stay fresh`);
        } else {
            tips.push(`Great recovery pacing with a ${factors.break_ratio}% break ratio`);
        }
    }

    return tips.slice(0, 3);
}

function TrendIcon({ trend }: { trend: string }) {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        good: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        alert: 'bg-red-100 text-red-700',
    };
    const icons: Record<string, React.ReactNode> = {
        good: <CheckCircle className="w-3 h-3" />,
        warning: <AlertTriangle className="w-3 h-3" />,
        alert: <AlertTriangle className="w-3 h-3" />,
    };
    return (
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? styles.good}`}>
            {icons[status]}
            {String(status).charAt(0).toUpperCase() + String(status).slice(1)}
        </span>
    );
}

interface ProactiveInsightsPanelProps {
    overviewFocusScore?: number;
    overviewDeepWorkHours?: number;
}

export function ProactiveInsightsPanel({ overviewFocusScore, overviewDeepWorkHours }: ProactiveInsightsPanelProps = {}) {
    const hasOverrideData = overviewFocusScore !== undefined;
    const { data: apiFocus, isLoading: focusLoading } = useFocusScore();
    const { data: wellness, isLoading: wellnessLoading } = useWellnessScore();

    // When overview data is provided, use it instead of the AI endpoint
    const focus = hasOverrideData
        ? { score: overviewFocusScore, max_score: 100, deep_work_hours: overviewDeepWorkHours ?? 0, trend: 'stable' as const, change: 0 }
        : apiFocus;

    const isLoading = (!hasOverrideData && focusLoading) || wellnessLoading;

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-28" />
                ))}
            </div>
        );
    }

    const wellnessStatus = wellness?.status ?? 'good';
    const wellnessTips = getWellnessTips(wellnessStatus, wellness?.factors ?? {}, wellness?.score ?? 0);

    return (
        <div className="space-y-3">
            {/* Focus Score Card */}
            {focus ? (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-indigo-600" />
                            <span className="text-sm font-semibold text-indigo-900">Focus Score</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <TrendIcon trend={focus.trend} />
                            <span className={`text-xs font-medium ${focus.trend === 'up' ? 'text-emerald-600' : focus.trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                                {focus.change > 0 ? '+' : ''}{focus.change.toFixed(1)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-3xl font-bold text-indigo-700">{focus.score.toFixed(1)}</span>
                        <span className="text-sm text-indigo-400">/ {focus.max_score}</span>
                    </div>
                    <div className="w-full bg-indigo-200 rounded-full h-1.5 mb-3">
                        <div
                            className="h-1.5 rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${(focus.score / focus.max_score) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-indigo-700">
                        💡 {getFocusTip(focus.score, focus.max_score, focus.deep_work_hours, focus.trend)}
                    </p>
                    <p className="text-xs text-indigo-500 mt-1">{focus.deep_work_hours.toFixed(1)}h deep work today</p>
                </div>
            ) : (
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-900">Focus Score</span>
                    </div>
                    <p className="text-sm text-indigo-700 mb-1">📊 No focus data yet</p>
                    <p className="text-xs text-indigo-500">Start tracking your activities and I&apos;ll show your focus score, deep work hours, and trends here.</p>
                </div>
            )}

            {/* Wellness Card */}
            {wellness ? (
                <div className={`rounded-2xl border p-4 ${wellnessStatus === 'good' ? 'border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50' :
                    wellnessStatus === 'warning' ? 'border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50' :
                        'border-red-100 bg-gradient-to-r from-red-50 to-pink-50'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Heart className={`w-4 h-4 ${wellnessStatus === 'good' ? 'text-emerald-600' : wellnessStatus === 'warning' ? 'text-amber-600' : 'text-red-600'}`} />
                            <span className="text-sm font-semibold text-gray-900">Wellness</span>
                        </div>
                        <StatusBadge status={wellnessStatus} />
                    </div>
                    <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-3xl font-bold text-gray-900">{wellness.score}</span>
                        <span className="text-sm text-gray-400">/ {wellness.max_score}</span>
                    </div>
                    <ul className="space-y-1.5">
                        {wellnessTips.map((tip, i) => (
                            <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                <Zap className="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
                                {tip}
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-gray-900">Wellness</span>
                    </div>
                    <p className="text-sm text-emerald-700 mb-1">🌿 No wellness data yet</p>
                    <p className="text-xs text-emerald-600">Let me track your work patterns and I&apos;ll provide burnout risk analysis, work-life balance scores, and personalized wellness tips.</p>
                </div>
            )}

            {/* Ask AI CTA */}
            <Link
                href="/dashboard/chat?prompt=Analyze%20my%20focus%20and%20wellness%20patterns"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
            >
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">Ask AI for deeper analysis</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </Link>
        </div>
    );
}
