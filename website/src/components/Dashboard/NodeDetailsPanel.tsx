'use client';

import { X, Calendar, Network, Clock, ChevronRight } from 'lucide-react';
import { useNodeDetails } from '@/lib/hooks/useGraphData';

interface NodeData {
    id: string;
    label: string;
    type: string;
    size?: number;
    metadata?: Record<string, unknown>;
}

interface NodeDetailsPanelProps {
    nodeId: string | null;
    nodeData?: NodeData | null;
    onClose: () => void;
}

const TYPE_COLORS: Record<string, string> = {
    PERSON: '#3b82f6',
    PROJECT: '#8b5cf6',
    SKILL: '#10b981',
    ORGANIZATION: '#f59e0b',
    DOCUMENT: '#6b7280',
    person: '#3b82f6',
    project: '#8b5cf6',
    artifact: '#10b981',
    organization: '#f59e0b',
    concept: '#14b8a6',
    skill: '#6366f1',
    event: '#ef4444',
};

function getRichDescription(nodeId: string, nodeType: string): string {
    if (nodeId === 'user') return 'Your central node in the knowledge graph.';
    if (nodeType === 'SKILL' || nodeType === 'artifact') return 'A tool or application you use regularly.';
    if (nodeType === 'DOCUMENT' || nodeType === 'domain') return 'A web domain or knowledge source you visit.';
    if (nodeType === 'PROJECT' || nodeType === 'meeting') return 'A meeting, project, or event you participated in.';
    return 'A node in your personal knowledge graph.';
}

export function NodeDetailsPanel({ nodeId, nodeData, onClose }: NodeDetailsPanelProps) {
    // Only fetch from Neo4j if nodeId is numeric (actual Neo4j id)
    const isNumericId = nodeId ? /^\d+$/.test(nodeId) : false;
    const { data: neo4jData, isLoading } = useNodeDetails(isNumericId ? nodeId : null);

    if (!nodeId) return null;

    // Use Neo4j data if available, fall back to local nodeData prop, then construct from nodeId
    const displayData = neo4jData ?? (nodeData ? {
        label: nodeData.label,
        type: nodeData.type,
        metadata: nodeData.metadata,
        connected_nodes: [],
    } : null);

    // Parse type from nodeId prefix if no other data available
    const inferredType = nodeId.startsWith('skill_') ? 'SKILL'
        : nodeId.startsWith('domain_') ? 'DOCUMENT'
            : nodeId.startsWith('project_') ? 'PROJECT'
                : nodeId === 'user' ? 'PERSON'
                    : nodeData?.type ?? 'Unknown';

    const displayLabel = displayData?.label
        ?? nodeData?.label
        ?? nodeId.replace(/^(skill_|domain_|project_)/, '').replace(/_/g, ' ');

    const displayType = displayData?.type ?? inferredType;
    const color = TYPE_COLORS[displayType] ?? '#6b7280';

    return (
        <div className="h-full bg-white border-l border-gray-200 overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Node Details</h3>
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                {isLoading && isNumericId ? (
                    <div className="space-y-3">
                        <div className="bg-gray-100 animate-pulse rounded h-6 w-3/4" />
                        <div className="bg-gray-100 animate-pulse rounded h-4 w-1/2" />
                        <div className="bg-gray-100 animate-pulse rounded h-20" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Title */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                    {displayType}
                                </span>
                            </div>
                            <h4 className="text-lg font-bold text-gray-900 capitalize">
                                {displayLabel}
                            </h4>
                        </div>

                        {/* Description */}
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-sm text-gray-600">
                                {getRichDescription(nodeId, displayType)}
                            </p>
                        </div>

                        {/* Size / weight info */}
                        {nodeData?.size && (
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Activity Weight</p>
                                    <p className="text-sm text-gray-700">{nodeData.size.toFixed(1)}h</p>
                                </div>
                            </div>
                        )}

                        {/* Connected Nodes from Neo4j */}
                        {displayData?.connected_nodes && displayData.connected_nodes.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <Network className="w-3.5 h-3.5" />
                                    Connected Nodes ({displayData.connected_nodes.length})
                                </label>
                                <div className="space-y-1.5">
                                    {(displayData.connected_nodes as Array<{ id: string; label: string; color?: string }>).slice(0, 6).map((node) => (
                                        <div key={node.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 hover:bg-gray-100">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color || '#6b7280' }} />
                                            <span className="text-sm text-gray-700 flex-1">{node.label}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                        </div>
                                    ))}
                                    {displayData.connected_nodes.length > 6 && (
                                        <p className="text-xs text-gray-500 text-center py-1">
                                            +{displayData.connected_nodes.length - 6} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Metadata dates */}
                        {displayData?.metadata?.created_at && (
                            <div className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs font-medium text-gray-500">First Seen</p>
                                    <p className="text-sm text-gray-700">
                                        {new Date(String(displayData.metadata.created_at)).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* View in enrichment link */}
                        <div className="pt-3 border-t border-gray-100">
                            <a
                                href="/dashboard/enrichment?tab=entities"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                                <Network className="w-4 h-4" />
                                View in Enrichment
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
