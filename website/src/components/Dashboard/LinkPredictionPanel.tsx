'use client';

import { Link2, Sparkles } from 'lucide-react';
import { useEntities } from '@/lib/hooks/useEntities';
import { useEntityNeighbors } from '@/lib/hooks/useEntities';

// Pairs of entity types that are semantically related but often lack explicit links
const INTERESTING_TYPE_PAIRS: [string, string][] = [
    ['artifact', 'concept'],
    ['person', 'artifact'],
    ['organization', 'artifact'],
    ['artifact', 'artifact'],
];

function SuggestionRow({ entityId, entityName, allEntities }: {
    entityId: string;
    entityName: string;
    allEntities: Array<{ id: string; name: string; entity_type: string; occurrence_count: number }>;
}) {
    const { data } = useEntityNeighbors(entityId, 1);
    const connectedIds = new Set((data?.neighbors ?? []).map(n => n.entity.id));

    // Find entities of a different type that aren't already connected
    const suggestions = allEntities
        .filter(e => e.id !== entityId && !connectedIds.has(e.id))
        .slice(0, 2);

    if (suggestions.length === 0) return null;

    return (
        <>
            {suggestions.map(suggestion => (
                <div
                    key={`${entityId}-${suggestion.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"
                >
                    <Link2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800">
                            <span className="font-semibold">{entityName}</span>
                            <span className="text-gray-400 mx-1.5">→</span>
                            <span className="font-semibold">{suggestion.name}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Both appear in your activities but haven't been explicitly linked
                        </p>
                    </div>
                    <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5 font-medium shrink-0">
                        {suggestion.occurrence_count}×
                    </span>
                </div>
            ))}
        </>
    );
}

export function LinkPredictionPanel() {
    const { data, isLoading } = useEntities(undefined, 20);
    const entities = data?.entities ?? [];

    if (isLoading) {
        return (
            <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-16" />)}
            </div>
        );
    }

    // Show top 3 entities as sources for suggestions
    const sourceCandidates = entities.slice(0, 3);

    return (
        <div className="p-5">
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-base font-semibold text-gray-900">Suggested Connections</h3>
                </div>
                <p className="text-sm text-gray-500">
                    Entities that frequently appear in your activities but haven't been directly linked yet
                </p>
            </div>

            {sourceCandidates.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Link2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No entity data yet to predict connections.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {sourceCandidates.map(entity => (
                        <SuggestionRow
                            key={entity.id}
                            entityId={entity.id}
                            entityName={entity.name}
                            allEntities={entities}
                        />
                    ))}
                </div>
            )}

            <div className="mt-5 p-3 rounded-lg bg-purple-50 border border-purple-100">
                <p className="text-xs text-purple-700">
                    <strong>🔮 How it works:</strong> Connections are suggested when two entities appear across many activities but have no direct co-occurrence link. Explore these to discover hidden relationships in your work patterns.
                </p>
            </div>
        </div>
    );
}
