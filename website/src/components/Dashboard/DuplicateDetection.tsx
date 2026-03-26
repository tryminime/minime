'use client';

import { useState } from 'react';
import {
    GitMerge, ScanLine, CheckCircle2, AlertTriangle,
    Loader2, ChevronDown, ChevronUp, Eye, SkipForward,
    Layers, Zap, Users, BarChart3,
} from 'lucide-react';
import {
    useDeduplicationScan,
    useClusterMerge,
    type DedupCluster,
    type DedupMember,
} from '@/lib/hooks/useEntities';

// ─────────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────────

function pct(n: number) { return Math.round(n * 100); }

const REASON_LABELS: Record<string, string> = {
    external_id: 'Exact ID',
    fuzzy_name:  'Fuzzy Name',
    token_set:   'Token Match',
    alias_match: 'Alias',
    embedding:   'Semantic',
};

const REC_COLORS = {
    auto_merge: 'bg-red-50 border-red-200',
    suggest:    'bg-orange-50 border-orange-200',
    review:     'bg-yellow-50 border-yellow-200',
};

const REC_BADGE = {
    auto_merge: 'bg-red-100 text-red-700',
    suggest:    'bg-orange-100 text-orange-700',
    review:     'bg-yellow-100 text-yellow-700',
};

const REC_LABELS = {
    auto_merge: 'Auto-merge',
    suggest:    'Review Suggested',
    review:     'Low Confidence',
};

// ─────────────────────────────────────────────────────────────────
// Confidence bar
// ─────────────────────────────────────────────────────────────────

function ConfidenceBar({ value }: { value: number }) {
    const p = pct(value);
    const color =
        p >= 97 ? 'bg-red-500' :
        p >= 80 ? 'bg-orange-500' :
                  'bg-yellow-500';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${p}%` }} />
            </div>
            <span className="text-xs font-bold text-gray-700 w-9 text-right">{p}%</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Member card (one entity inside a cluster)
// ─────────────────────────────────────────────────────────────────

function MemberCard({
    member,
    isCanonical,
    onSetCanonical,
}: {
    member: DedupMember;
    isCanonical: boolean;
    onSetCanonical: () => void;
}) {
    return (
        <div
            className={`rounded-xl border p-3 text-sm transition-all cursor-pointer select-none
                ${isCanonical ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
            onClick={onSetCanonical}
            title="Click to set as canonical (kept) entity"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{member.entity_type}</p>
                </div>
                {isCanonical && (
                    <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded-full uppercase tracking-wide">
                        keep
                    </span>
                )}
            </div>
            <div className="mt-2 flex gap-3 text-xs text-gray-500">
                <span title="Occurrences">
                    <span className="font-medium text-gray-700">{member.occurrence_count}</span> seen
                </span>
                {member.last_seen && (
                    <span>
                        last&nbsp;
                        <span className="font-medium text-gray-700">
                            {new Date(member.last_seen).toLocaleDateString()}
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Cluster card
// ─────────────────────────────────────────────────────────────────

function ClusterCard({
    cluster,
    onMerge,
    onSkip,
    isMerging,
}: {
    cluster: DedupCluster;
    onMerge: (entityIds: string[], canonicalId: string) => void;
    onSkip: () => void;
    isMerging: boolean;
}) {
    const [expanded, setExpanded]   = useState(false);
    const [canonical, setCanonical] = useState(cluster.canonical_id);

    return (
        <div className={`rounded-2xl border ${REC_COLORS[cluster.recommendation]} overflow-hidden`}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3">
                {/* Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${REC_BADGE[cluster.recommendation]}`}>
                    {REC_LABELS[cluster.recommendation]}
                </span>

                {/* Entity type + name */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                        {cluster.canonical_name}
                        <span className="ml-1.5 text-gray-400 font-normal text-xs">
                            ({cluster.entity_type})
                        </span>
                    </p>
                    <div className="text-xs text-gray-500 flex items-center gap-1.5">
                        <span>{cluster.size} duplicates ·</span> <ConfidenceBar value={cluster.max_confidence} />
                    </div>
                </div>

                {/* Expand/collapse */}
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60"
                >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Body */}
            {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-inherit">
                    {/* Confidence detail */}
                    <div className="pt-3 space-y-1">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Max confidence</span>
                            <ConfidenceBar value={cluster.max_confidence} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Avg confidence</span>
                            <ConfidenceBar value={cluster.avg_confidence} />
                        </div>
                    </div>

                    {/* Match reasons */}
                    {cluster.match_reasons.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {cluster.match_reasons.map(r => (
                                <span key={r} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/80 border border-gray-200 text-gray-600">
                                    {REASON_LABELS[r] ?? r}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Members grid — click to set canonical */}
                    <div>
                        <p className="text-xs text-gray-500 mb-2">
                            Click an entity to set it as the one to <strong>keep</strong>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cluster.members.map(m => (
                                <MemberCard
                                    key={m.id}
                                    member={m}
                                    isCanonical={canonical === m.id}
                                    onSetCanonical={() => setCanonical(m.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => onMerge(cluster.members.map(m => m.id), canonical)}
                            disabled={isMerging}
                            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {isMerging ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <GitMerge className="w-3.5 h-3.5" />
                            )}
                            Merge all into canonical
                        </button>
                        <button
                            onClick={onSkip}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-xl hover:bg-white/60 transition-colors"
                        >
                            <SkipForward className="w-3.5 h-3.5" />
                            Skip
                        </button>
                    </div>
                </div>
            )}

            {/* Quick-action row when collapsed */}
            {!expanded && cluster.recommendation === 'auto_merge' && (
                <div className="flex gap-2 px-4 pb-3">
                    <button
                        onClick={() => onMerge(cluster.members.map(m => m.id), canonical)}
                        disabled={isMerging}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {isMerging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Quick merge
                    </button>
                    <button
                        onClick={() => setExpanded(true)}
                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                        <Eye className="w-3 h-3" /> Review
                    </button>
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Stats banner
// ─────────────────────────────────────────────────────────────────

function StatsBanner({
    entitiesScanned,
    duplicatePairs,
    clusterCount,
    autoMergeCount,
}: {
    entitiesScanned: number;
    duplicatePairs:  number;
    clusterCount:    number;
    autoMergeCount:  number;
}) {
    const tiles = [
        { icon: <Layers className="w-4 h-4 text-blue-500" />,   label: 'Entities Scanned',  value: entitiesScanned },
        { icon: <Users  className="w-4 h-4 text-orange-500" />, label: 'Duplicate Pairs',  value: duplicatePairs },
        { icon: <GitMerge className="w-4 h-4 text-purple-500" />, label: 'Clusters Found', value: clusterCount },
        { icon: <Zap    className="w-4 h-4 text-red-500" />,    label: 'Auto-merge Ready', value: autoMergeCount },
    ];
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {tiles.map(t => (
                <div key={t.label} className="bg-gray-50 rounded-xl px-3 py-3 flex items-center gap-2.5">
                    <div className="flex-shrink-0 p-1.5 bg-white rounded-lg shadow-sm">
                        {t.icon}
                    </div>
                    <div>
                        <p className="text-lg font-bold text-gray-900 leading-none">{t.value}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{t.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────

export function DuplicateDetection() {
    const scan      = useDeduplicationScan();
    const merge     = useClusterMerge();
    const [skipped, setSkipped] = useState<Set<string>>(new Set());

    const result   = scan.data;
    const clusters = (result?.clusters ?? []).filter(c => !skipped.has(c.cluster_id));
    const autoMerge = clusters.filter(c => c.recommendation === 'auto_merge');
    const suggest   = clusters.filter(c => c.recommendation === 'suggest');
    const review    = clusters.filter(c => c.recommendation === 'review');

    const handleMerge = (cluster: DedupCluster, entityIds: string[], canonicalId: string) => {
        merge.mutate({ entityIds, canonicalId }, {
            onSuccess: () => setSkipped(s => new Set([...s, cluster.cluster_id])),
        });
    };

    const handleSkip = (clusterId: string) => {
        setSkipped(s => new Set([...s, clusterId]));
    };

    // Merge all auto suggestions with one click
    const mergeAllAuto = () => {
        autoMerge.forEach(c =>
            merge.mutate(
                { entityIds: c.members.map(m => m.id), canonicalId: c.canonical_id },
                { onSuccess: () => setSkipped(s => new Set([...s, c.cluster_id])) }
            )
        );
    };

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center gap-3 flex-wrap">
                <button
                    onClick={() => {
                        setSkipped(new Set());
                        scan.refetch();
                    }}
                    disabled={scan.isFetching}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
                >
                    {scan.isFetching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <ScanLine className="w-4 h-4" />
                    )}
                    {scan.isFetching ? 'Scanning…' : result ? 'Re-scan' : 'Run Deduplication Scan'}
                </button>

                {autoMerge.length > 0 && (
                    <button
                        onClick={mergeAllAuto}
                        disabled={merge.isPending}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-60 transition-colors shadow-sm"
                    >
                        <Zap className="w-4 h-4" />
                        Merge all auto ({autoMerge.length})
                    </button>
                )}

                {result && (
                    <span className="text-xs text-gray-400 ml-auto">
                        Last scan: {result.entities_scanned} entities
                    </span>
                )}
            </div>

            {/* Scanning state */}
            {scan.isFetching && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-medium">Running multi-signal scan across all your entities…</p>
                    <p className="text-xs">Levenshtein · Token-set · Alias · Semantic · External ID</p>
                </div>
            )}

            {/* Error */}
            {scan.isError && !scan.isFetching && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                    Scan failed — please check that the backend is running and try again.
                </div>
            )}

            {/* Initial state (before first scan) */}
            {!scan.isFetching && !result && !scan.isError && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
                    <BarChart3 className="w-12 h-12 opacity-20" />
                    <p className="font-medium text-gray-500">Run a scan to detect duplicate entities</p>
                    <p className="text-xs text-center max-w-sm">
                        Uses fuzzy name matching, alias comparison, semantic embeddings and external IDs
                        to find near-identical entities — then clusters them transitively.
                    </p>
                </div>
            )}

            {/* Results */}
            {!scan.isFetching && result && (
                <div className="space-y-6">
                    {/* Stats */}
                    <StatsBanner
                        entitiesScanned={result.entities_scanned}
                        duplicatePairs={result.duplicate_pairs}
                        clusterCount={result.clusters.length}
                        autoMergeCount={result.auto_merge_count}
                    />

                    {/* All clean */}
                    {clusters.length === 0 && (
                        <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
                            <CheckCircle2 className="w-12 h-12 text-green-400" />
                            <p className="font-medium text-gray-600">No duplicates found</p>
                            <p className="text-sm">All {result.entities_scanned} entities appear unique.</p>
                        </div>
                    )}

                    {/* Auto-merge queue */}
                    {autoMerge.length > 0 && (
                        <section className="space-y-3">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700">
                                <Zap className="w-4 h-4" />
                                Auto-merge ({autoMerge.length})
                                <span className="text-xs font-normal text-gray-400 ml-1">≥ 97% confidence</span>
                            </h3>
                            {autoMerge.map(c => (
                                <ClusterCard
                                    key={c.cluster_id}
                                    cluster={c}
                                    onMerge={(ids, cid) => handleMerge(c, ids, cid)}
                                    onSkip={() => handleSkip(c.cluster_id)}
                                    isMerging={merge.isPending}
                                />
                            ))}
                        </section>
                    )}

                    {/* Suggested review */}
                    {suggest.length > 0 && (
                        <section className="space-y-3">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-700">
                                <AlertTriangle className="w-4 h-4" />
                                Review Suggested ({suggest.length})
                                <span className="text-xs font-normal text-gray-400 ml-1">80–97% confidence</span>
                            </h3>
                            {suggest.map(c => (
                                <ClusterCard
                                    key={c.cluster_id}
                                    cluster={c}
                                    onMerge={(ids, cid) => handleMerge(c, ids, cid)}
                                    onSkip={() => handleSkip(c.cluster_id)}
                                    isMerging={merge.isPending}
                                />
                            ))}
                        </section>
                    )}

                    {/* Low-confidence */}
                    {review.length > 0 && (
                        <section className="space-y-3">
                            <h3 className="flex items-center gap-2 text-sm font-semibold text-yellow-700">
                                <Eye className="w-4 h-4" />
                                Low Confidence ({review.length})
                                <span className="text-xs font-normal text-gray-400 ml-1">75–80% confidence</span>
                            </h3>
                            {review.map(c => (
                                <ClusterCard
                                    key={c.cluster_id}
                                    cluster={c}
                                    onMerge={(ids, cid) => handleMerge(c, ids, cid)}
                                    onSkip={() => handleSkip(c.cluster_id)}
                                    isMerging={merge.isPending}
                                />
                            ))}
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}
