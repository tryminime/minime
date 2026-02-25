/**
 * NodeDetailsPanel Component
 * Displays detailed information about a selected node
 */

import React from 'react';
import { X, User, FileText, Tag, Network, TrendingUp } from 'lucide-react';
import { NodeDetail } from '../services/graphAPI';

interface NodeDetailsPanelProps {
    nodeDetail: NodeDetail | null;
    onClose: () => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ nodeDetail, onClose }) => {
    if (!nodeDetail) return null;

    const { node_id, labels, properties, metrics, neighbor_count } = nodeDetail;

    // Get node type icon
    const getNodeIcon = (labels: string[]) => {
        const primaryLabel = labels[0];
        switch (primaryLabel) {
            case 'PERSON':
                return <User className="w-5 h-5" />;
            case 'PAPER':
                return <FileText className="w-5 h-5" />;
            case 'TOPIC':
                return <Tag className="w-5 h-5" />;
            default:
                return <Network className="w-5 h-5" />;
        }
    };

    // Format metric value
    const formatMetric = (value?: number) => {
        if (value === undefined || value === null) return 'N/A';
        return value.toFixed(4);
    };

    // Get node name
    const nodeName = properties.canonical_name || properties.name || `Node ${node_id}`;

    return (
        <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 overflow-y-auto z-50 animate-slide-in-right">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
                        {getNodeIcon(labels)}
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Node Details
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {labels.join(', ')}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
                {/* Basic Info */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <Network className="w-4 h-4" />
                        Basic Information
                    </h3>
                    <div className="space-y-2">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {nodeName}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Node ID</p>
                            <p className="text-sm font-mono text-gray-900 dark:text-white">
                                {node_id}
                            </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Neighbors</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {neighbor_count}
                            </p>
                        </div>
                        {metrics.community_id !== undefined && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Community</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    #{metrics.community_id}
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Centrality Metrics */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Centrality Metrics
                    </h3>
                    <div className="space-y-3">
                        {/* PageRank */}
                        {metrics.pagerank !== undefined && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">PageRank</span>
                                    <span className="text-xs font-mono text-gray-900 dark:text-white">
                                        {formatMetric(metrics.pagerank)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(metrics.pagerank * 100).toFixed(1)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Degree Centrality */}
                        {metrics.degree_centrality !== undefined && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Degree</span>
                                    <span className="text-xs font-mono text-gray-900 dark:text-white">
                                        {formatMetric(metrics.degree_centrality)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(metrics.degree_centrality * 100).toFixed(1)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Betweenness Centrality */}
                        {metrics.betweenness_centrality !== undefined && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Betweenness</span>
                                    <span className="text-xs font-mono text-gray-900 dark:text-white">
                                        {formatMetric(metrics.betweenness_centrality)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-purple-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(metrics.betweenness_centrality * 100).toFixed(1)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Closeness Centrality */}
                        {metrics.closeness_centrality !== undefined && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Closeness</span>
                                    <span className="text-xs font-mono text-gray-900 dark:text-white">
                                        {formatMetric(metrics.closeness_centrality)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-orange-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(metrics.closeness_centrality * 100).toFixed(1)}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Eigenvector Centrality */}
                        {metrics.eigenvector_centrality !== undefined && (
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Eigenvector</span>
                                    <span className="text-xs font-mono text-gray-900 dark:text-white">
                                        {formatMetric(metrics.eigenvector_centrality)}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-pink-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(metrics.eigenvector_centrality * 100).toFixed(1)}%` }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Properties */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                        Properties
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(properties).map(([key, value]) => {
                            // Skip internal properties
                            if (key === 'user_id' || key === 'embedding_reduced') return null;

                            return (
                                <div key={key} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 capitalize">
                                        {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-white break-words">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
};
