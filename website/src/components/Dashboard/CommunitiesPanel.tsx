'use client';

import { Users, TrendingUp, Lightbulb } from 'lucide-react';
import { useEntities } from '@/lib/hooks/useEntities';

const TYPE_COLORS: Record<string, string> = {
    artifact: '#10b981',
    organization: '#f59e0b',
    person: '#3b82f6',
    concept: '#14b8a6',
    skill: '#6366f1',
    event: '#ef4444',
    project: '#8b5cf6',
};

const TYPE_LABELS: Record<string, string> = {
    artifact: 'Tools & Apps',
    organization: 'Organizations',
    person: 'People',
    concept: 'Concepts',
    skill: 'Skills',
    event: 'Events',
    project: 'Projects',
};

export function CommunitiesPanel() {
    const { data, isLoading } = useEntities(undefined, 50);
    const entities = data?.entities ?? [];

    if (isLoading) {
        return (
            <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-24" />
                ))}
            </div>
        );
    }

    // Group entities by type
    const groups: Record<string, typeof entities> = {};
    for (const e of entities) {
        const t = e.entity_type ?? 'other';
        if (!groups[t]) groups[t] = [];
        groups[t].push(e);
    }

    const sortedGroups = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);

    return (
        <div className="p-5">
            <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">Entity Communities</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                    Your knowledge grouped by type — {entities.length} entities across {sortedGroups.length} communities
                </p>
            </div>

            <div className="space-y-3">
                {sortedGroups.map(([type, group]) => {
                    const color = TYPE_COLORS[type] ?? '#9ca3af';
                    const label = TYPE_LABELS[type] ?? type;
                    const topItems = group.slice(0, 4);
                    const totalOccurrences = group.reduce((s, e) => s + (e.occurrence_count ?? 0), 0);

                    return (
                        <div key={type} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="font-medium text-gray-800 text-sm">{label}</span>
                                    <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-full px-2 py-0.5">
                                        {group.length}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    {totalOccurrences}× total
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {topItems.map(e => (
                                    <span
                                        key={e.id}
                                        className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                                        style={{ backgroundColor: color }}
                                    >
                                        {e.name} {e.occurrence_count > 1 ? `(${e.occurrence_count}×)` : ''}
                                    </span>
                                ))}
                                {group.length > 4 && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                        +{group.length - 4} more
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {entities.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No communities yet — capture more activities to build your graph.</p>
                </div>
            )}
        </div>
    );
}
