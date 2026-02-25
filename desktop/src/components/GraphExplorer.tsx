/**
 * GraphExplorer Component
 * Interactive knowledge graph visualization using SigmaJS
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SigmaContainer, useLoadGraph, useRegisterEvents, useSigma } from '@react-sigma/core';
import { LayoutForceAtlas2Control } from '@react-sigma/layout-forceatlas2';
import Graph from 'graphology';
import { Filter, Loader2, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { graphAPI, GraphNode, GraphRelationship, NodeDetail } from '../services/graphAPI';
import { NodeDetailsPanel } from '../components/NodeDetailsPanel';
import '@react-sigma/core/lib/react-sigma.min.css';

// Node type colors
const NODE_COLORS: Record<string, string> = {
    PERSON: '#3B82F6',      // Blue
    PAPER: '#10B981',       // Green
    TOPIC: '#F59E0B',       // Orange
    PROJECT: '#8B5CF6',     // Purple
    DATASET: '#EC4899',     // Pink
    INSTITUTION: '#6366F1', // Indigo
    TOOL: '#14B8A6',        // Teal
    VENUE: '#EF4444',       // Red
    DEFAULT: '#6B7280'      // Gray
};

interface GraphExplorerProps {
    initialNodeTypes?: string[];
    initialLimit?: number;
}

// Graph loader component
const LoadGraph: React.FC<{
    nodes: GraphNode[];
    relationships: GraphRelationship[];
    nodeTypeFilter: Set<string>;
    centralityThreshold: number;
}> = ({ nodes, relationships, nodeTypeFilter, centralityThreshold }) => {
    const loadGraph = useLoadGraph();

    useEffect(() => {
        const graph = new Graph();

        // Filter nodes
        const filteredNodes = nodes.filter(node => {
            // Filter by node type
            const nodeType = node.labels[0] || 'DEFAULT';
            if (nodeTypeFilter.size > 0 && !nodeTypeFilter.has(nodeType)) {
                return false;
            }

            // Filter by PageRank threshold
            const pagerank = node.properties.pagerank || node.metrics?.pagerank || 0;
            if (pagerank < centralityThreshold) {
                return false;
            }

            return true;
        });

        // Add nodes to graph
        filteredNodes.forEach(node => {
            const nodeType = node.labels[0] || 'DEFAULT';
            const nodeName = node.properties.canonical_name || node.properties.name || `Node ${node.id}`;
            const pagerank = node.properties.pagerank || node.metrics?.pagerank || 0;
            const communityId = node.properties.community_id || node.metrics?.community_id;

            // Calculate node size based on PageRank (min 5, max 25)
            const size = 5 + (pagerank * 100);

            graph.addNode(node.id.toString(), {
                label: nodeName,
                size: Math.min(Math.max(size, 5), 25),
                color: NODE_COLORS[nodeType] || NODE_COLORS.DEFAULT,
                x: Math.random() * 100,
                y: Math.random() * 100,
                nodeType,
                pagerank,
                communityId,
                originalData: node
            });
        });

        // Add edges (only if both nodes exist)
        const nodeIds = new Set(filteredNodes.map(n => n.id.toString()));
        relationships.forEach((rel) => {
            const sourceId = rel.source.toString();
            const targetId = rel.target.toString();

            if (nodeIds.has(sourceId) && nodeIds.has(targetId)) {
                try {
                    graph.addEdge(sourceId, targetId, {
                        size: 1,
                        color: '#E5E7EB',
                        type: 'arrow',
                        label: rel.type,
                        weight: rel.properties.weight || 1
                    });
                } catch (e) {
                    // Edge might already exist
                    console.warn(`Edge ${sourceId} -> ${targetId} already exists`);
                }
            }
        });

        loadGraph(graph);
    }, [loadGraph, nodes, relationships, nodeTypeFilter, centralityThreshold]);

    return null;
};

// Event handler component
const GraphEvents: React.FC<{
    onNodeClick: (nodeId: string) => void;
}> = ({ onNodeClick }) => {
    const registerEvents = useRegisterEvents();
    const sigma = useSigma();

    useEffect(() => {
        registerEvents({
            clickNode: (event) => {
                onNodeClick(event.node);
            },
            clickStage: () => {
                // Deselect node when clicking empty space
                sigma.getGraph().forEachNode((node) => {
                    sigma.getGraph().setNodeAttribute(node, 'highlighted', false);
                });
                sigma.refresh();
            }
        });
    }, [registerEvents, onNodeClick, sigma]);

    return null;
};

// Zoom controls component
const ZoomControls: React.FC = () => {
    const sigma = useSigma();

    const zoomIn = () => {
        const camera = sigma.getCamera();
        camera.animatedZoom({ duration: 300 });
    };

    const zoomOut = () => {
        const camera = sigma.getCamera();
        camera.animatedUnzoom({ duration: 300 });
    };

    const resetView = () => {
        const camera = sigma.getCamera();
        camera.animatedReset({ duration: 300 });
    };

    return (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <button
                onClick={zoomIn}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Zoom In"
            >
                <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={zoomOut}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Zoom Out"
            >
                <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <button
                onClick={resetView}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title="Reset View"
            >
                <Maximize2 className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
        </div>
    );
};

export const GraphExplorer: React.FC<GraphExplorerProps> = ({
    initialNodeTypes = [],
    initialLimit = 100
}) => {
    const [nodes, setNodes] = useState<GraphNode[]>([]);
    const [relationships, setRelationships] = useState<GraphRelationship[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [nodeTypeFilter, setNodeTypeFilter] = useState<Set<string>>(new Set());
    const [centralityThreshold, setCentralityThreshold] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // Selected node
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [selectedNodeDetail, setSelectedNodeDetail] = useState<NodeDetail | null>(null);
    const [loadingNodeDetail, setLoadingNodeDetail] = useState(false);

    // Available node types
    const availableNodeTypes = useMemo(() => {
        const types = new Set<string>();
        nodes.forEach(node => {
            const type = node.labels[0];
            if (type) types.add(type);
        });
        return Array.from(types).sort();
    }, [nodes]);

    // Load graph data
    useEffect(() => {
        const loadGraphData = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await graphAPI.exportGraph({
                    node_types: initialNodeTypes.length > 0 ? initialNodeTypes : undefined,
                    limit: initialLimit
                });

                setNodes(data.nodes);
                setRelationships(data.relationships);
            } catch (err: any) {
                console.error('Failed to load graph data:', err);
                setError(err.response?.data?.detail || 'Failed to load graph data');
            } finally {
                setLoading(false);
            }
        };

        loadGraphData();
    }, [initialNodeTypes, initialLimit]);

    // Load node details when selected
    useEffect(() => {
        if (!selectedNodeId) {
            setSelectedNodeDetail(null);
            return;
        }

        const loadNodeDetails = async () => {
            try {
                setLoadingNodeDetail(true);
                const detail = await graphAPI.getNodeDetails(parseInt(selectedNodeId));
                setSelectedNodeDetail(detail);
            } catch (err) {
                console.error('Failed to load node details:', err);
            } finally {
                setLoadingNodeDetail(false);
            }
        };

        loadNodeDetails();
    }, [selectedNodeId]);

    // Toggle node type filter
    const toggleNodeType = (type: string) => {
        const newFilter = new Set(nodeTypeFilter);
        if (newFilter.has(type)) {
            newFilter.delete(type);
        } else {
            newFilter.add(type);
        }
        setNodeTypeFilter(newFilter);
    };

    // Export graph as JSON
    const exportGraphData = () => {
        const dataStr = JSON.stringify({ nodes, relationships }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `knowledge-graph-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading knowledge graph...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Failed to Load Graph
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Knowledge Graph Explorer
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {nodes.length} nodes, {relationships.length} relationships
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${showFilters
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                        <button
                            onClick={exportGraphData}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Node Type Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Node Types
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {availableNodeTypes.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => toggleNodeType(type)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${nodeTypeFilter.size === 0 || nodeTypeFilter.has(type)
                                                ? 'text-white'
                                                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}
                                            style={{
                                                backgroundColor: nodeTypeFilter.size === 0 || nodeTypeFilter.has(type)
                                                    ? NODE_COLORS[type] || NODE_COLORS.DEFAULT
                                                    : undefined
                                            }}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Centrality Threshold */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    PageRank Threshold: {centralityThreshold.toFixed(3)}
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="0.1"
                                    step="0.001"
                                    value={centralityThreshold}
                                    onChange={(e) => setCentralityThreshold(parseFloat(e.target.value))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    <span>Show all</span>
                                    <span>High influence only</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Graph Container */}
            <div className="absolute top-[120px] left-0 right-0 bottom-0">
                <SigmaContainer
                    style={{ height: '100%', width: '100%' }}
                    settings={{
                        renderEdgeLabels: false,
                        defaultNodeColor: NODE_COLORS.DEFAULT,
                        defaultEdgeColor: '#E5E7EB',
                        labelFont: 'Inter, sans-serif',
                        labelSize: 12,
                        labelWeight: '500',
                        edgeLabelSize: 10
                    }}
                >
                    <LoadGraph
                        nodes={nodes}
                        relationships={relationships}
                        nodeTypeFilter={nodeTypeFilter}
                        centralityThreshold={centralityThreshold}
                    />
                    <GraphEvents onNodeClick={setSelectedNodeId} />
                    <LayoutForceAtlas2Control autoRunFor={2000} />
                    <ZoomControls />
                </SigmaContainer>
            </div>

            {/* Node Details Panel */}
            {selectedNodeDetail && (
                <NodeDetailsPanel
                    nodeDetail={selectedNodeDetail}
                    onClose={() => {
                        setSelectedNodeId(null);
                        setSelectedNodeDetail(null);
                    }}
                />
            )}

            {/* Loading Node Details Overlay */}
            {loadingNodeDetail && (
                <div className="fixed right-0 top-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex items-center justify-center z-50">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-10 max-w-xs">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Legend</h4>
                <div className="space-y-1">
                    {availableNodeTypes.map(type => (
                        <div key={type} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: NODE_COLORS[type] || NODE_COLORS.DEFAULT }}
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">{type}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Node size = PageRank influence
                    </p>
                </div>
            </div>
        </div>
    );
};
