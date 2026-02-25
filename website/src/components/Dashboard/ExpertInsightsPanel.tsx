'use client';

import { Award, Star } from 'lucide-react';
import { useEntities } from '@/lib/hooks/useEntities';

const DOMAIN_MAP: Record<string, string> = {
    'VS Code': 'Software Engineering',
    Chrome: 'Research & Web',
    Python: 'Python Development',
    Terminal: 'DevOps & Systems',
    Figma: 'UI/UX Design',
    Slack: 'Team Communication',
    Zoom: 'Remote Collaboration',
    Notion: 'Documentation',
    SQLAlchemy: 'Database Engineering',
    asyncio: 'Async Programming',
    GitHub: 'Open Source & DevOps',
    'Google Meet': 'Meeting Facilitation',
};

const EXPERTISE_THRESHOLDS = [
    { min: 10, label: 'Expert', star: 5, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
    { min: 6, label: 'Proficient', star: 4, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { min: 3, label: 'Intermediate', star: 3, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { min: 1, label: 'Beginner', star: 2, color: 'text-gray-600 bg-gray-50 border-gray-200' },
];

function getExpertiseLevel(occurrenceCount: number) {
    return EXPERTISE_THRESHOLDS.find(t => occurrenceCount >= t.min) ?? EXPERTISE_THRESHOLDS[EXPERTISE_THRESHOLDS.length - 1];
}

export function ExpertInsightsPanel() {
    const { data, isLoading } = useEntities(undefined, 30);
    const entities = data?.entities ?? [];

    if (isLoading) {
        return (
            <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-16" />)}
            </div>
        );
    }

    // Sort by occurrence count descending, show all
    const ranked = [...entities]
        .sort((a, b) => (b.occurrence_count ?? 0) - (a.occurrence_count ?? 0))
        .slice(0, 8);

    const maxOccurrences = ranked[0]?.occurrence_count ?? 1;

    return (
        <div className="p-5">
            <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">Expert Insights</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                    Your expertise rankings based on tool usage and activity frequency
                </p>
            </div>

            {ranked.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Award className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No expertise data yet. Start capturing activities!</p>
                </div>
            ) : (
                <>
                    {/* Top expert badge */}
                    {ranked[0] && (
                        <div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Award className="w-5 h-5 text-amber-600" />
                                <span className="text-sm font-bold text-amber-800">Top Expertise Area</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900">{ranked[0].name}</p>
                            <p className="text-sm text-gray-600">
                                {DOMAIN_MAP[ranked[0].name] ?? ranked[0].entity_type} — {ranked[0].occurrence_count}× interactions
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        {ranked.map((entity, idx) => {
                            const level = getExpertiseLevel(entity.occurrence_count ?? 0);
                            const pct = Math.round(((entity.occurrence_count ?? 0) / maxOccurrences) * 100);

                            return (
                                <div key={entity.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="w-6 text-center">
                                        <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-sm text-gray-900 truncate">{entity.name}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ml-2 shrink-0 ${level.color}`}>
                                                {level.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-500 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <div className="flex shrink-0">
                                                {[...Array(5)].map((_, si) => (
                                                    <Star
                                                        key={si}
                                                        className={`w-3 h-3 ${si < level.star ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-0.5">{DOMAIN_MAP[entity.name] ?? entity.entity_type}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
