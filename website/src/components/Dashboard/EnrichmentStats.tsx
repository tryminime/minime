'use client';

import { User, Building2, Wrench, Brain, MapPin, Tag, Cpu, Activity, TrendingUp, FolderGit2 } from 'lucide-react';
import { useEnrichmentStats } from '@/lib/hooks/useEntities';

const TYPE_CONFIG = [
    { type: 'person', label: 'People', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { type: 'organization', label: 'Orgs', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { type: 'artifact', label: 'Artifacts', icon: Wrench, color: 'text-green-600', bg: 'bg-green-50' },
    { type: 'skill', label: 'Skills', icon: Brain, color: 'text-orange-600', bg: 'bg-orange-50' },
    { type: 'concept', label: 'Concepts', icon: MapPin, color: 'text-teal-600', bg: 'bg-teal-50' },
    { type: 'project', label: 'Projects', icon: FolderGit2, color: 'text-rose-600', bg: 'bg-rose-50' },
] as const;

export function EnrichmentStats() {
    const { data, isLoading } = useEnrichmentStats();

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse h-24" />
                ))}
            </div>
        );
    }

    const total = data?.total ?? 0;
    const byType = data?.byType ?? {};

    return (
        <div className="space-y-6">
            {/* Total entities hero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-5 text-white">
                    <div className="flex items-center gap-2 mb-3">
                        <Cpu className="w-5 h-5 opacity-80" />
                        <span className="text-sm font-medium opacity-80">Total Entities Extracted</span>
                    </div>
                    <p className="text-4xl font-bold">{total.toLocaleString()}</p>
                    <p className="text-sm opacity-70 mt-1">across all activity types</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                        <Activity className="w-5 h-5" />
                        <span className="text-sm font-medium">NER Pipeline</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">5 stages</p>
                    <p className="text-sm text-gray-500 mt-1">NER → Normalize → Spell → Temporal → Resolve</p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-medium">Entity Types</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {Object.values(byType).filter(v => (v as number) > 0).length} active
                    </p>
                    <p className="text-sm text-gray-500 mt-1">out of 6 tracked types</p>
                </div>
            </div>

            {/* By-type breakdown */}
            <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Entities by Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {TYPE_CONFIG.map(({ type, label, icon: Icon, color, bg }) => {
                        const count = (byType[type as keyof typeof byType] ?? 0) as number;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <div key={type} className={`${bg} rounded-xl p-4`}>
                                <div className={`flex items-center gap-2 mb-2 ${color}`}>
                                    <Icon className="w-4 h-4" />
                                    <span className="text-xs font-medium">{label}</span>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{count}</p>
                                {total > 0 && count > 0 && (
                                    <div className="mt-2">
                                        <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${color.replace('text-', 'bg-')}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{pct}% of total</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Pipeline stages info */}
            {total === 0 && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <div className="flex items-start gap-3">
                        <Tag className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-orange-800">No entities extracted yet</p>
                            <p className="text-sm text-orange-700 mt-1">
                                The NER pipeline automatically processes new activities as they&apos;re captured.
                                Entities are extracted from titles, apps, URLs, and content using spaCy NLP + 100+ custom tech patterns.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
