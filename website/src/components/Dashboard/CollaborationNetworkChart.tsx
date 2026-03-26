'use client';

import { useCollaborationNetwork } from '@/lib/hooks/useCollaborationMetrics';
import { Network } from 'lucide-react';
import Link from 'next/link';

export function CollaborationNetworkChart() {
    const { data, isLoading, error } = useCollaborationNetwork();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Collaboration Network</h3>
                <div className="bg-gray-100 animate-pulse rounded flex-1 min-h-[16rem]" />
            </div>
        );
    }

    if (error || !data || data.nodes.length === 0) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Collaboration Network</h3>
                <div className="bg-gray-50 rounded p-8 text-center flex-1 flex flex-col items-center justify-center">
                    <p className="text-gray-500">No network data available</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Collaborate with more people to see your network
                    </p>
                </div>
            </div>
        );
    }

    // Group entities by type and count
    const typeCounts: Record<string, { count: number; names: string[] }> = {};
    for (const node of data.nodes) {
        if (!typeCounts[node.type]) {
            typeCounts[node.type] = { count: 0, names: [] };
        }
        typeCounts[node.type].count++;
        if (typeCounts[node.type].names.length < 3) {
            typeCounts[node.type].names.push(node.name);
        }
    }

    const typeColors: Record<string, string> = {
        person: '#3b82f6',
        project: '#8b5cf6',
        artifact: '#10b981',
        organization: '#f59e0b',
        concept: '#14b8a6',
        skill: '#6366f1',
        event: '#ef4444',
    };

    const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1].count - a[1].count);

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="flex items-center justify-between mb-1 flex-shrink-0">
                <h3 className="text-lg font-semibold">Collaboration Network</h3>
                <Link
                    href="/dashboard/graph"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                    <Network className="w-4 h-4" />
                    Full Graph →
                </Link>
            </div>
            <p className="text-sm text-gray-600 mb-5 flex-shrink-0">
                {data.nodes.length} entities across {sortedTypes.length} types with {data.edges.length} connections
            </p>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {sortedTypes.map(([type, info]) => {
                    const pct = Math.round((info.count / data.nodes.length) * 100);
                    const color = typeColors[type] || '#94a3b8';
                    return (
                        <div key={type}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                    <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                                </div>
                                <span className="text-sm text-gray-500">{info.count} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                                {info.names.join(', ')}{info.count > 3 ? ` +${info.count - 3} more` : ''}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
