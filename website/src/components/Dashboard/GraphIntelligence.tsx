'use client';

import { useState, useEffect } from 'react';
import {
    Brain, BookOpen, Users, Globe, TrendingUp,
    ChevronRight, Loader2, BarChart3, Star, AlertCircle,
    ArrowUpRight, Target, Zap,
} from 'lucide-react';
import {
    useExpertiseProfile, useLearningPaths, useCollaborationPatterns,
    useCrossDomainConnections, usePageRank,
    ExpertiseProfile, LearningPathsResult, CollaborationResult,
    CrossDomainResult, PageRankResult,
} from '@/lib/hooks/useEntities';

// ── Sub-tab definitions ──────────────────────────────────────────────────────

type SubTab = 'expertise' | 'learning' | 'collaboration' | 'crossDomain' | 'pagerank';

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'expertise',     label: 'Expertise',      icon: <Brain className="w-3.5 h-3.5" /> },
    { id: 'learning',      label: 'Learning Paths',  icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'collaboration', label: 'Collaboration',   icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'crossDomain',   label: 'Cross-Domain',    icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'pagerank',      label: 'PageRank',        icon: <TrendingUp className="w-3.5 h-3.5" /> },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const levelColor: Record<string, string> = {
    expert:       'bg-emerald-100 text-emerald-800',
    proficient:   'bg-blue-100 text-blue-800',
    intermediate: 'bg-amber-100 text-amber-800',
    beginner:     'bg-gray-100 text-gray-600',
};

const prioColor: Record<string, string> = {
    high:   'bg-rose-100 text-rose-700',
    medium: 'bg-amber-100 text-amber-700',
    low:    'bg-gray-100 text-gray-600',
};

// ── Main Component ───────────────────────────────────────────────────────────

export function GraphIntelligence() {
    const [sub, setSub] = useState<SubTab>('expertise');

    // All hooks — enabled:false so they only fire on refetch()
    const expertise     = useExpertiseProfile();
    const learning      = useLearningPaths();
    const collaboration = useCollaborationPatterns();
    const crossDomain   = useCrossDomainConnections();
    const pagerank      = usePageRank();

    // Fetch handler for the active sub-tab
    const handleLoad = () => {
        if (sub === 'expertise')     expertise.refetch();
        if (sub === 'learning')      learning.refetch();
        if (sub === 'collaboration') collaboration.refetch();
        if (sub === 'crossDomain')   crossDomain.refetch();
        if (sub === 'pagerank')      pagerank.refetch();
    };

    const hasDataForSub = () => {
        if (sub === 'expertise')     return !!expertise.data;
        if (sub === 'learning')      return !!learning.data;
        if (sub === 'collaboration') return !!collaboration.data;
        if (sub === 'crossDomain')   return !!crossDomain.data;
        if (sub === 'pagerank')      return !!pagerank.data;
        return false;
    };

    // Auto-trigger on load or tab change if data is missing
    useEffect(() => {
        if (!hasDataForSub()) {
            handleLoad();
        }
    }, [sub]);

    const isLoading = {
        expertise:     expertise.isFetching,
        learning:      learning.isFetching,
        collaboration: collaboration.isFetching,
        crossDomain:   crossDomain.isFetching,
        pagerank:      pagerank.isFetching,
    }[sub];

    const hasData = {
        expertise:     !!expertise.data,
        learning:      !!learning.data,
        collaboration: !!collaboration.data,
        crossDomain:   !!crossDomain.data,
        pagerank:      !!pagerank.data,
    }[sub];

    return (
        <div className="flex flex-col h-full">
            {/* ── Sub-tab bar + load button ─── */}
            <div className="flex items-center justify-between gap-4 px-4 py-2 border-b border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
                    {SUB_TABS.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSub(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                                sub === t.id
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {t.icon}
                            {t.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleLoad}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                    {isLoading ? 'Analyzing...' : 'Analyze'}
                </button>
            </div>

            {/* ── Tab content ─── */}
            <div className="flex-1 overflow-y-auto p-4">
                {!hasData && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">
                        <Brain className="w-10 h-10 mb-3 text-gray-300" />
                        <p>Click <strong>Analyze</strong> to run {SUB_TABS.find(t => t.id === sub)?.label} analysis</p>
                    </div>
                )}
                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                )}

                {sub === 'expertise'     && expertise.data     && <ExpertiseView d={expertise.data} />}
                {sub === 'learning'      && learning.data      && <LearningView d={learning.data} />}
                {sub === 'collaboration' && collaboration.data && <CollaborationView d={collaboration.data} />}
                {sub === 'crossDomain'   && crossDomain.data   && <CrossDomainView d={crossDomain.data} />}
                {sub === 'pagerank'      && pagerank.data      && <PageRankView d={pagerank.data} />}
            </div>
        </div>
    );
}


// ── Expertise Sub-view ───────────────────────────────────────────────────────

function ExpertiseView({ d }: { d: ExpertiseProfile }) {
    return (
        <div className="space-y-4">
            {/* Stats strip */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: 'Total Skills', value: d.total_skills, icon: <Star className="w-4 h-4 text-amber-500" /> },
                    { label: 'Categories', value: d.skill_diversity, icon: <Globe className="w-4 h-4 text-blue-500" /> },
                    { label: 'Entities', value: d.entity_count, icon: <BarChart3 className="w-4 h-4 text-indigo-500" /> },
                    { label: 'Primary', value: d.primary_category?.replace(/_/g, ' '), icon: <Target className="w-4 h-4 text-emerald-500" /> },
                ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 px-3 py-2">
                        {s.icon}
                        <div>
                            <div className="text-xs text-gray-400">{s.label}</div>
                            <div className="text-sm font-semibold text-gray-800 capitalize">{s.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Skills */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Top Skills</h3>
                <div className="space-y-1.5">
                    {d.rankings.slice(0, 12).map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                            <span className="w-5 text-right text-gray-400 text-xs">{i + 1}.</span>
                            <span className="flex-1 font-medium text-gray-800 truncate capitalize">{r.entity}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${levelColor[r.level] || 'bg-gray-100 text-gray-600'}`}>
                                {r.level}
                            </span>
                            <div className="w-20 bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, r.expertise_score * 30)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Categories radar (simplified bar) */}
            {Object.keys(d.categories).length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Category Scores</h3>
                    <div className="grid grid-cols-2 gap-1">
                        {Object.entries(d.categories)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, score]) => (
                                <div key={cat} className="flex items-center gap-2 text-xs">
                                    <span className="w-28 truncate text-gray-600 capitalize">{cat.replace(/_/g, ' ')}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${score}%` }} />
                                    </div>
                                    <span className="w-8 text-right text-gray-400">{Math.round(score)}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}


// ── Learning Paths Sub-view ──────────────────────────────────────────────────

function LearningView({ d }: { d: LearningPathsResult }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
                <BookOpen className="w-4 h-4" />
                {d.total_paths} learning paths • {d.current_skill_count} skills tracked
            </div>
            {d.paths.length === 0 && (
                <p className="text-sm text-gray-400 italic">No skill gaps detected — great job!</p>
            )}
            {d.paths.map((p, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-100 p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-800">{p.category_label}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${prioColor[p.priority]}`}>
                            {p.priority}
                        </span>
                    </div>
                    <div className="flex gap-3 text-xs text-gray-500 mb-2">
                        <span>{p.known_count} known</span>
                        <span className="text-amber-600">{p.weak_count} weak</span>
                        <span className="text-rose-600">{p.missing_count} missing</span>
                        <span className="ml-auto text-gray-400">{p.estimated_effort}</span>
                    </div>
                    <div className="space-y-1">
                        {p.steps.map((s, j) => (
                            <div key={j} className="flex items-center gap-2 text-xs">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                    s.action === 'deepen' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'
                                }`}>
                                    {s.action === 'deepen' ? '↑ DEEPEN' : '+ LEARN'}
                                </span>
                                <span className="font-medium text-gray-700 capitalize">{s.skill}</span>
                                <span className="text-gray-400 truncate">{s.reason}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}


// ── Collaboration Sub-view ───────────────────────────────────────────────────

function CollaborationView({ d }: { d: CollaborationResult }) {
    return (
        <div className="space-y-3">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'Score', value: `${d.collaboration_score}/10` },
                    { label: 'Persons', value: d.total_persons },
                    { label: 'Active Pairs', value: d.total_pairs },
                ].map((s, i) => (
                    <div key={i} className="text-center bg-white rounded-lg border border-gray-100 px-3 py-2">
                        <div className="text-lg font-bold text-indigo-600">{s.value}</div>
                        <div className="text-[10px] text-gray-400 uppercase">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Patterns */}
            {d.patterns.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {d.patterns.map((p, i) => (
                        <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                            {p}
                        </span>
                    ))}
                </div>
            )}

            {/* Collaborator list */}
            {d.collaborators.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No collaboration co-occurrences detected yet.</p>
            ) : (
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Co-occurrence Pairs</h3>
                    <div className="space-y-1.5">
                        {d.collaborators.slice(0, 15).map((c, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm bg-white rounded-lg border border-gray-50 px-3 py-1.5">
                                <span className="font-medium text-gray-800 truncate">{c.entity_a.name}</span>
                                <ArrowUpRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                <span className="font-medium text-gray-800 truncate">{c.entity_b.name}</span>
                                <span className="ml-auto text-xs text-indigo-600 font-semibold whitespace-nowrap">
                                    {c.shared_activities} shared
                                </span>
                                <div className="w-16 bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${c.strength * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


// ── Cross-Domain Sub-view ────────────────────────────────────────────────────

function CrossDomainView({ d }: { d: CrossDomainResult }) {
    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { label: 'Domains', value: d.domain_count },
                    { label: 'Bridge Entities', value: d.bridge_count },
                    { label: 'Diversity', value: `${d.diversity_score}/100` },
                ].map((s, i) => (
                    <div key={i} className="text-center bg-white rounded-lg border border-gray-100 px-3 py-2">
                        <div className="text-lg font-bold text-emerald-600">{s.value}</div>
                        <div className="text-[10px] text-gray-400 uppercase">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Specialization:</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    d.specialization === 'generalist' ? 'bg-emerald-100 text-emerald-700' :
                    d.specialization === 'balanced' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                }`}>
                    {d.specialization}
                </span>
            </div>

            {/* Category Distribution */}
            {Object.keys(d.category_distribution).length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Category Distribution</h3>
                    <div className="grid grid-cols-2 gap-1">
                        {Object.entries(d.category_distribution)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, count]) => (
                                <div key={cat} className="flex items-center gap-2 text-xs">
                                    <span className="w-28 truncate text-gray-600 capitalize">{cat.replace(/_/g, ' ')}</span>
                                    <span className="text-gray-800 font-medium">{count}</span>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Cross-type connections */}
            {d.cross_type_connections.length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Cross-Type Connections</h3>
                    <div className="space-y-1">
                        {d.cross_type_connections.slice(0, 10).map((c, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs bg-white rounded border border-gray-50 px-2 py-1.5">
                                <span className="font-medium text-gray-700">{c.entity_a.name}</span>
                                <span className="px-1 py-0.5 bg-gray-100 rounded text-[9px] text-gray-500">{c.entity_a.type}</span>
                                <ChevronRight className="w-3 h-3 text-gray-300" />
                                <span className="font-medium text-gray-700">{c.entity_b.name}</span>
                                <span className="px-1 py-0.5 bg-gray-100 rounded text-[9px] text-gray-500">{c.entity_b.type}</span>
                                <span className="ml-auto text-indigo-600 font-semibold">{c.co_occurrences}×</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


// ── PageRank Sub-view ────────────────────────────────────────────────────────

function PageRankView({ d }: { d: PageRankResult }) {
    const maxPR = d.stats.max_pagerank || 1;

    return (
        <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-2">
                {[
                    { label: 'Total Entities', value: d.stats.total_entities },
                    { label: 'Connected', value: d.stats.connected_entities },
                    { label: 'Max PR', value: (d.stats.max_pagerank * 100).toFixed(2) + '%' },
                    { label: 'Avg PR', value: (d.stats.avg_pagerank * 100).toFixed(2) + '%' },
                ].map((s, i) => (
                    <div key={i} className="text-center bg-white rounded-lg border border-gray-100 px-3 py-2">
                        <div className="text-sm font-bold text-gray-800">{s.value}</div>
                        <div className="text-[10px] text-gray-400 uppercase">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Rankings */}
            <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Entity Rankings (by PageRank)</h3>
                <div className="space-y-1">
                    {d.rankings.slice(0, 25).map((r, i) => (
                        <div key={r.id} className="flex items-center gap-2 text-sm">
                            <span className="w-5 text-right text-gray-400 text-xs">{i + 1}.</span>
                            <span className="flex-1 font-medium text-gray-800 truncate">{r.name}</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-500 capitalize">{r.entity_type}</span>
                            <span className="text-xs text-gray-400">{r.connections} links</span>
                            <div className="w-24 bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${(r.pagerank / maxPR) * 100}%` }}
                                />
                            </div>
                            <span className="w-14 text-right text-xs font-mono text-indigo-600">
                                {(r.pagerank * 100).toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
