'use client';

import { TrendingUp, TrendingDown, Minus, Brain, Heart, Zap, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useFocusScore, useWellnessScore } from '@/lib/hooks/useAIChat';
import Link from 'next/link';

const FOCUS_INSIGHTS = [
    'Schedule deep work during your peak productive hours',
    'Take 5-min breaks every 90 minutes to sustain focus',
    'Minimize context switches — batch similar tasks together',
    'Use "Do Not Disturb" mode during your focus blocks',
];

const WELLNESS_TIPS: Record<string, string[]> = {
    good: [
        'Maintaining great balance — keep it up!',
        'Consider mentoring someone to share your workflow',
    ],
    warning: [
        'Take Friday afternoon off to recharge',
        'Reduce meeting load by 1-2 per week',
    ],
    alert: [
        'You\'re showing burnout risk signals — prioritize breaks',
        'Consider a shorter work week or async-first approach',
    ],
};

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

export function ProactiveInsightsPanel() {
    const { data: focus, isLoading: focusLoading } = useFocusScore();
    const { data: wellness, isLoading: wellnessLoading } = useWellnessScore();

    const isLoading = focusLoading || wellnessLoading;

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
    const wellnessTips = WELLNESS_TIPS[wellnessStatus] ?? WELLNESS_TIPS.good;

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
                        💡 {FOCUS_INSIGHTS[Math.floor((focus.score / focus.max_score) * FOCUS_INSIGHTS.length)]}
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
