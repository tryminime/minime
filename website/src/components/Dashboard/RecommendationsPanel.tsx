'use client';

import { Lightbulb, ArrowRight, TrendingUp, Star, Users, Target } from 'lucide-react';
import { useFocusScore, useWellnessScore } from '@/lib/hooks/useAIChat';
import Link from 'next/link';

interface RecommendationCard {
    icon: React.ReactNode;
    title: string;
    description: string;
    chatPrompt: string;
    accentColor: string;
}

interface OverviewData {
    top_apps?: { app: string; hours: number; duration: string }[];
    deep_work_hours?: number;
    focus_score?: number;
    meetings_count?: number;
    breaks_count?: number;
}

const COLOR_MAP: Record<string, { card: string; icon: string; badge: string }> = {
    indigo: { card: 'bg-indigo-50 border-indigo-100', icon: 'text-indigo-600 bg-indigo-100', badge: 'bg-indigo-600' },
    blue: { card: 'bg-blue-50 border-blue-100', icon: 'text-blue-600 bg-blue-100', badge: 'bg-blue-600' },
    purple: { card: 'bg-purple-50 border-purple-100', icon: 'text-purple-600 bg-purple-100', badge: 'bg-purple-600' },
    emerald: { card: 'bg-emerald-50 border-emerald-100', icon: 'text-emerald-600 bg-emerald-100', badge: 'bg-emerald-600' },
    amber: { card: 'bg-amber-50 border-amber-100', icon: 'text-amber-600 bg-amber-100', badge: 'bg-amber-600' },
};

/** Build recommendations dynamically from real data */
function buildDynamicRecs(
    focus: { score: number; max_score: number; deep_work_hours: number; trend: string; change: number } | null,
    wellnessRecs: string[],
    overview: OverviewData | null,
): RecommendationCard[] {
    const recs: RecommendationCard[] = [];

    // 1. Wellness recommendation (from backend — fully dynamic)
    if (wellnessRecs.length > 0) {
        recs.push({
            icon: <Lightbulb className="w-4 h-4" />,
            title: 'Wellness Recommendation',
            description: wellnessRecs[0],
            chatPrompt: `Tell me more about this wellness tip: "${wellnessRecs[0]}"`,
            accentColor: 'amber',
        });
    }

    // 2. Focus / Deep Work recommendation based on real data
    if (focus) {
        const dwh = focus.deep_work_hours;
        const nextGoal = Math.ceil(dwh + 1);
        if (focus.trend === 'down') {
            recs.push({
                icon: <TrendingUp className="w-4 h-4" />,
                title: 'Recover Your Focus',
                description: `Your focus is trending down (${focus.change > 0 ? '+' : ''}${focus.change.toFixed(1)}) — try blocking 2h of uninterrupted time tomorrow morning.`,
                chatPrompt: 'How can I improve my declining focus score based on my activity patterns?',
                accentColor: 'indigo',
            });
        } else if (dwh > 0) {
            recs.push({
                icon: <Target className="w-4 h-4" />,
                title: 'Push Your Deep Work Goal',
                description: `You logged ${dwh}h of deep work today. Try setting a goal of ${nextGoal}h to push further.`,
                chatPrompt: `Help me set a realistic deep work goal based on my current ${dwh}h average.`,
                accentColor: 'emerald',
            });
        }
    }

    // 3. Top app insight — computed from real app usage
    if (overview?.top_apps && overview.top_apps.length > 0) {
        const topApp = overview.top_apps[0];
        recs.push({
            icon: <Star className="w-4 h-4" />,
            title: `Top App: ${topApp.app}`,
            description: `${topApp.app} was your most-used app at ${topApp.duration}. Consider whether this aligns with your goals.`,
            chatPrompt: `Analyze my ${topApp.app} usage patterns — is it productive or a distraction?`,
            accentColor: 'purple',
        });
    }

    // 4. Meeting load insight — from real data
    if (overview && overview.meetings_count !== undefined) {
        if (overview.meetings_count > 3) {
            recs.push({
                icon: <Users className="w-4 h-4" />,
                title: 'Reduce Meeting Load',
                description: `You have ${overview.meetings_count} meetings today. Try clustering them in one block to protect deep work time.`,
                chatPrompt: 'What is the impact of my meeting schedule on productivity? How can I restructure it?',
                accentColor: 'blue',
            });
        } else if (overview.breaks_count !== undefined && overview.breaks_count < 3) {
            recs.push({
                icon: <Users className="w-4 h-4" />,
                title: 'Take More Breaks',
                description: `Only ${overview.breaks_count} break${overview.breaks_count === 1 ? '' : 's'} today — schedule a 10-min break every 90 minutes.`,
                chatPrompt: 'How can I structure my break habits better based on my work patterns?',
                accentColor: 'blue',
            });
        }
    }

    return recs.slice(0, 4);
}

export function RecommendationsPanel({ overview }: { overview?: OverviewData | null }) {
    const { data: wellness } = useWellnessScore();
    const { data: focus } = useFocusScore();

    // Only show recommendations when real data exists
    if (!wellness && !focus) {
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-gray-800">AI Recommendations</span>
                </div>
                <div className="rounded-xl border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 p-5">
                    <p className="text-sm text-amber-800 mb-1">💡 No recommendations yet</p>
                    <p className="text-xs text-amber-600">Start tracking your daily activities and I&apos;ll provide personalized productivity tips, skill growth suggestions, and focus optimization strategies.</p>
                </div>
            </div>
        );
    }

    const allRecs = buildDynamicRecs(
        focus ?? null,
        wellness?.recommendations ?? [],
        overview ?? null,
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-800">AI Recommendations</span>
            </div>

            {allRecs.length === 0 ? (
                <div className="rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
                    <p className="text-sm text-emerald-800 mb-1">✨ Everything looks great!</p>
                    <p className="text-xs text-emerald-600">Your focus and wellness metrics are solid. Keep up the good work!</p>
                </div>
            ) : (
                allRecs.map((rec, idx) => {
                    const colors = COLOR_MAP[rec.accentColor] ?? COLOR_MAP.indigo;
                    return (
                        <div key={idx} className={`rounded-xl border p-4 ${colors.card}`}>
                            <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-lg shrink-0 ${colors.icon}`}>
                                    {rec.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{rec.description}</p>
                                    <Link
                                        href={`/dashboard/chat?prompt=${encodeURIComponent(rec.chatPrompt)}`}
                                        className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                                    >
                                        Ask AI about this <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
