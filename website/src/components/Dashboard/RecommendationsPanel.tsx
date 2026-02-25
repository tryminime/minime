'use client';

import { Lightbulb, ArrowRight, TrendingUp, Star, Users, Target } from 'lucide-react';
import { useWellnessScore } from '@/lib/hooks/useAIChat';
import Link from 'next/link';

interface RecommendationCard {
    icon: React.ReactNode;
    title: string;
    description: string;
    chatPrompt: string;
    accentColor: string;
}

const STATIC_RECOMMENDATIONS: RecommendationCard[] = [
    {
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Protect Your Morning Focus',
        description: 'Block 9–11 AM for deep work — your data shows highest cognitive performance in this window.',
        chatPrompt: 'How can I protect my morning focus sessions based on my activity patterns?',
        accentColor: 'indigo',
    },
    {
        icon: <Users className="w-4 h-4" />,
        title: 'Reduce Meeting Fragmentation',
        description: 'Clustering meetings in the afternoon could reclaim 2+ hours of uninterrupted coding time.',
        chatPrompt: 'What is the impact of my meeting schedule on productivity? How can I restructure it?',
        accentColor: 'blue',
    },
    {
        icon: <Star className="w-4 h-4" />,
        title: 'Skill Growth Opportunity',
        description: 'Your Rust and DevOps usage is trending up — invest time in formal learning to accelerate growth.',
        chatPrompt: 'Which skills should I focus on developing based on my recent activity?',
        accentColor: 'purple',
    },
    {
        icon: <Target className="w-4 h-4" />,
        title: 'Set a Weekly Focus Goal',
        description: 'You averaged 4.5h of deep work daily this week. Try setting a goal of 5h to push your output.',
        chatPrompt: 'Help me set a realistic deep work goal for next week based on my trends.',
        accentColor: 'emerald',
    },
];

const WELLNESS_RECS: string[] = [];

const COLOR_MAP: Record<string, { card: string; icon: string; badge: string }> = {
    indigo: { card: 'bg-indigo-50 border-indigo-100', icon: 'text-indigo-600 bg-indigo-100', badge: 'bg-indigo-600' },
    blue: { card: 'bg-blue-50 border-blue-100', icon: 'text-blue-600 bg-blue-100', badge: 'bg-blue-600' },
    purple: { card: 'bg-purple-50 border-purple-100', icon: 'text-purple-600 bg-purple-100', badge: 'bg-purple-600' },
    emerald: { card: 'bg-emerald-50 border-emerald-100', icon: 'text-emerald-600 bg-emerald-100', badge: 'bg-emerald-600' },
    amber: { card: 'bg-amber-50 border-amber-100', icon: 'text-amber-600 bg-amber-100', badge: 'bg-amber-600' },
};

export function RecommendationsPanel() {
    const { data: wellness } = useWellnessScore();

    // Only show recommendations when real data exists
    if (!wellness) {
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

    // Merge dynamic wellness recommendations into static list
    const dynamicRecs: RecommendationCard[] = (wellness?.recommendations ?? []).slice(0, 1).map((rec, i) => ({
        icon: <Lightbulb className="w-4 h-4" />,
        title: 'Wellness Recommendation',
        description: rec,
        chatPrompt: `Tell me more about this wellness tip: "${rec}"`,
        accentColor: ['amber', 'indigo', 'blue'][i % 3],
    }));

    const allRecs = [...dynamicRecs, ...STATIC_RECOMMENDATIONS].slice(0, 4);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-800">AI Recommendations</span>
            </div>

            {allRecs.map((rec, idx) => {
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
            })}
        </div>
    );
}
