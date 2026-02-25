'use client';

import { useState } from 'react';
import { GitMerge, Check, X, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useEntities, useEntityDuplicates, useEntityMerge, type EntityItem } from '@/lib/hooks/useEntities';

function ConfidenceBadge({ score }: { score: number }) {
    const pct = Math.round(score * 100);
    const color =
        pct >= 90 ? 'bg-red-100 text-red-700' :
            pct >= 70 ? 'bg-orange-100 text-orange-700' :
                'bg-yellow-100 text-yellow-700';
    return (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
            {pct}% match
        </span>
    );
}

function DuplicatePair({
    entity,
    candidate,
    onMerge,
    isLoading,
}: {
    entity: EntityItem;
    candidate: { entity: EntityItem; confidence: number; match_reasons: string[] };
    onMerge: (sourceId: string, targetId: string) => void;
    isLoading: boolean;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                <ConfidenceBadge score={candidate.confidence} />
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-2 text-sm">
                    <div className="truncate">
                        <span className="text-gray-400 text-xs block">Entity A</span>
                        <span className="font-medium text-gray-900">{entity.canonical_name}</span>
                    </div>
                    <div className="truncate">
                        <span className="text-gray-400 text-xs block">Entity B</span>
                        <span className="font-medium text-gray-900">{candidate.entity.canonical_name}</span>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Expanded detail */}
            {expanded && (
                <div className="px-4 pb-3 border-t border-gray-100 pt-3 space-y-3">
                    {/* Side-by-side aliases */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Aliases A</p>
                            <div className="flex flex-wrap gap-1">
                                {entity.aliases.length > 0
                                    ? entity.aliases.map(a => (
                                        <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{a}</span>
                                    ))
                                    : <span className="text-xs text-gray-400">none</span>}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Aliases B</p>
                            <div className="flex flex-wrap gap-1">
                                {candidate.entity.aliases.length > 0
                                    ? candidate.entity.aliases.map(a => (
                                        <span key={a} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{a}</span>
                                    ))
                                    : <span className="text-xs text-gray-400">none</span>}
                            </div>
                        </div>
                    </div>

                    {/* Match reasons */}
                    {candidate.match_reasons.length > 0 && (
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Match reasons</p>
                            <div className="flex flex-wrap gap-1">
                                {candidate.match_reasons.map(r => (
                                    <span key={r} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 px-4 pb-4">
                <button
                    onClick={() => onMerge(candidate.entity.id, entity.id)}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <GitMerge className="w-3.5 h-3.5" />}
                    Merge into A
                </button>
                <span className="text-xs text-gray-400 self-center">
                    (B will be deleted, A keeps all data)
                </span>
            </div>
        </div>
    );
}

export function DuplicateDetection() {
    // Fetch entities to check for duplicates
    const { data: topEntitiesData, isLoading: entitiesLoading } = useEntities(undefined, 50, 0);
    const topEntities = topEntitiesData?.entities ?? [];
    const [checkingEntityId, setCheckingEntityId] = useState<string | null>(
        topEntities[0]?.id ?? null
    );
    const { data: dupData, isLoading: dupLoading } = useEntityDuplicates(checkingEntityId, 0.75);
    const merge = useEntityMerge();

    const duplicates = dupData?.duplicates ?? [];
    const centerEntity = dupData?.entity ?? topEntities.find(e => e.id === checkingEntityId);

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center gap-3">
                <select
                    value={checkingEntityId ?? ''}
                    onChange={e => setCheckingEntityId(e.target.value || null)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Select an entity to check for duplicates…</option>
                    {topEntities.map(e => (
                        <option key={e.id} value={e.id}>
                            {e.canonical_name} ({e.entity_type})
                        </option>
                    ))}
                </select>
            </div>

            {/* Loading */}
            {(entitiesLoading || dupLoading) && (
                <div className="flex items-center justify-center py-10 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin" />
                </div>
            )}

            {/* No duplicates found */}
            {!dupLoading && checkingEntityId && duplicates.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    <Check className="w-10 h-10 mx-auto mb-3 text-green-400" />
                    <p className="font-medium text-gray-600">No duplicates found</p>
                    <p className="text-sm">
                        {centerEntity?.canonical_name
                            ? `"${centerEntity.canonical_name}" appears to be unique`
                            : 'This entity appears to be unique'}
                    </p>
                </div>
            )}

            {/* No entity selected */}
            {!checkingEntityId && !entitiesLoading && (
                <div className="text-center py-10 text-gray-400">
                    <GitMerge className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Select an entity above to check for duplicates</p>
                </div>
            )}

            {/* Duplicate list */}
            {!dupLoading && centerEntity && duplicates.length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                        Found <span className="font-semibold text-orange-600">{duplicates.length}</span> potential duplicate{duplicates.length !== 1 ? 's' : ''} for{' '}
                        <span className="font-semibold">{centerEntity.canonical_name}</span>
                    </p>
                    {duplicates.map(dup => (
                        <DuplicatePair
                            key={dup.entity.id}
                            entity={centerEntity}
                            candidate={dup}
                            onMerge={(sourceId, targetId) =>
                                merge.mutate({ sourceId, targetId })
                            }
                            isLoading={merge.isPending}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
