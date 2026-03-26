'use client';

import { useEffect, useRef, useState } from 'react';
import Graph from 'graphology';
import Sigma from 'sigma';
import { circular } from 'graphology-layout';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { useGraphData, GraphNode, GraphEdge } from '@/lib/hooks/useGraphData';

interface GraphExplorerProps {
    onNodeClick?: (nodeId: string, nodeData?: { id: string; label: string; type: string; size: number }) => void;
    selectedNode?: string | null;
    filters?: {
        nodeTypes?: string[];
        relationshipTypes?: string[];
        searchQuery?: string;
    };
    onSigmaReady?: (sigma: Sigma) => void;
}

// Color mapping for node types — matches backend NodeType enum
const NODE_COLORS: Record<string, string> = {
    PERSON:       '#3b82f6',  // blue
    PROJECT:      '#8b5cf6',  // purple
    TOPIC:        '#10b981',  // emerald
    ORGANIZATION: '#f59e0b',  // amber
    INSTITUTION:  '#6366f1',  // indigo
    TOOL:         '#06b6d4',  // cyan
    PAPER:        '#6b7280',  // gray
    DATASET:      '#84cc16',  // lime
    VENUE:        '#f43f5e',  // rose
    // Legacy fallbacks
    SKILL:        '#10b981',
    DOCUMENT:     '#6b7280',
};

// Color legend shown in the graph canvas
const LEGEND = [
    { label: 'People',        color: '#3b82f6' },
    { label: 'Organizations', color: '#f59e0b' },
    { label: 'Projects',      color: '#8b5cf6' },
    { label: 'Topics',        color: '#10b981' },
    { label: 'Institutions',  color: '#6366f1' },
    { label: 'Tools',         color: '#06b6d4' },
    { label: 'Papers',        color: '#6b7280' },
];

export function GraphExplorer({ onNodeClick, selectedNode, filters, onSigmaReady }: GraphExplorerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sigmaRef = useRef<Sigma | null>(null);
    const graphRef = useRef<Graph | null>(null);
    const { data, isLoading, error } = useGraphData();
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLegendOpen, setIsLegendOpen] = useState(false);

    useEffect(() => {
        if (!containerRef.current || !data || isLoading) return;

        // Create graph
        const graph = new Graph();
        graphRef.current = graph;

        // Add nodes
        data.nodes.forEach((node: GraphNode) => {
            graph.addNode(node.id, {
                label: node.label,
                size: Math.max(5, Math.min(20, node.size)),
                color: NODE_COLORS[node.type] || '#6b7280',
                nodeType: node.type,
                nodeSize: node.size,
                x: node.x || Math.random(),
                y: node.y || Math.random(),
            });
        });

        // Add edges — guard against duplicates (Simple graph doesn't allow them)
        data.edges.forEach((edge: GraphEdge) => {
            if (graph.hasNode(edge.source) && graph.hasNode(edge.target) && !graph.hasEdge(edge.source, edge.target)) {
                graph.addEdge(edge.source, edge.target, {
                    size: Math.max(1, edge.weight / 10),
                    color: '#e5e7eb',
                    relType: edge.rel_type ?? '',  // store for relationship type filtering
                });
            }
        });

        // Apply layout if nodes don't have positions
        if (!data.nodes[0]?.x) {
            circular.assign(graph);
            forceAtlas2.assign(graph, {
                iterations: 100,
                settings: {
                    gravity: 0.2,
                    scalingRatio: 40,
                    barnesHutOptimize: true,
                    strongGravityMode: false,
                },
            });
        }

        // Create Sigma instance
        const sigma = new Sigma(graph, containerRef.current, {
            renderEdgeLabels: false,
            defaultNodeColor: '#6b7280',
            defaultEdgeColor: '#e5e7eb',
            labelSize: 11,
            labelColor: { color: '#374151' },
            labelRenderedSizeThreshold: 8,
            labelDensity: 0.07,
            labelGridCellSize: 60,
            zIndex: true,
        });

        sigmaRef.current = sigma;

        // Expose sigma to parent (for zoom controls)
        if (onSigmaReady) onSigmaReady(sigma);

        // Add click handler
        sigma.on('clickNode', ({ node }) => {
            if (onNodeClick) {
                const attrs = graph.getNodeAttributes(node);
                onNodeClick(node, {
                    id: node,
                    label: attrs.label,
                    type: attrs.nodeType,
                    size: attrs.nodeSize,
                });
            }
        });

        // Add hover effect
        sigma.on('enterNode', ({ node }) => {
            graph.setNodeAttribute(node, 'highlighted', true);
            sigma.refresh();
        });

        sigma.on('leaveNode', ({ node }) => {
            graph.setNodeAttribute(node, 'highlighted', false);
            sigma.refresh();
        });

        setIsInitialized(true);

        // Cleanup
        return () => {
            sigma.kill();
            graphRef.current = null;
            sigmaRef.current = null;
            setIsInitialized(false);
        };
    }, [data, isLoading]);

    // Apply filters (node types, relationship types, search)
    useEffect(() => {
        if (!graphRef.current || !isInitialized) return;

        const graph = graphRef.current;
        const activeNodeTypes = filters?.nodeTypes ?? [];
        const activeRelTypes = filters?.relationshipTypes ?? [];
        const query = (filters?.searchQuery ?? '').toLowerCase();

        graph.forEachNode((node) => {
            const nodeData = graph.getNodeAttributes(node);
            let visible = true;

            if (activeNodeTypes.length > 0) {
                visible = visible && activeNodeTypes.includes(nodeData.nodeType);
            }
            if (query) {
                visible = visible && nodeData.label.toLowerCase().includes(query);
            }

            graph.setNodeAttribute(node, 'hidden', !visible);
        });

        // Filter edges by relationship type
        graph.forEachEdge((edge) => {
            const edgeData = graph.getEdgeAttributes(edge);
            const relType: string = edgeData.relType ?? '';
            const edgeVisible = activeRelTypes.length === 0 || activeRelTypes.includes(relType);
            graph.setEdgeAttribute(edge, 'hidden', !edgeVisible);
        });

        sigmaRef.current?.refresh();
    }, [filters, isInitialized]);

    // Highlight selected node
    useEffect(() => {
        if (!graphRef.current || !isInitialized) return;

        const graph = graphRef.current;

        graph.forEachNode((node) => {
            const isSelected = node === selectedNode;
            graph.setNodeAttribute(node, 'highlighted', isSelected);
            if (isSelected) {
                graph.setNodeAttribute(node, 'size', 25);
            } else {
                const originalSize = data?.nodes.find(n => n.id === node)?.size || 10;
                graph.setNodeAttribute(node, 'size', Math.max(5, Math.min(20, originalSize)));
            }
        });

        sigmaRef.current?.refresh();
    }, [selectedNode, isInitialized, data]);

    if (isLoading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading graph...</p>
                    <p className="text-sm text-gray-400">This may take a moment for large graphs</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-red-50">
                <div className="text-center">
                    <p className="text-red-600 font-semibold">Failed to load graph</p>
                    <p className="text-sm text-red-500 mt-2">Please try refreshing the page</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full">
            <div ref={containerRef} className="w-full h-full bg-white" />

            {/* Node type color legend */}
            <div className="absolute bottom-4 left-4 flex flex-col items-start gap-2">
                <button
                    onClick={() => setIsLegendOpen(!isLegendOpen)}
                    className="flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 text-xs font-semibold text-gray-700 border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                    Legend
                    <svg className={`w-3 h-3 transition-transform ${isLegendOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                
                {isLegendOpen && (
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-3 text-xs space-y-1.5 border border-gray-100 min-w-[140px] animate-in fade-in slide-in-from-bottom-2">
                        {LEGEND.map(({ label, color }) => (
                            <div key={label} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-gray-600">{label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {data && (
                <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-xs">
                    <p className="font-semibold text-gray-700">Visible Graph State</p>
                    <p className="text-gray-600">{data.stats.node_count} top active nodes</p>
                    <p className="text-gray-600">{data.stats.edge_count} relationships</p>
                    <p className="text-gray-600">Avg degree: {data.stats.avg_degree.toFixed(1)}</p>
                </div>
            )}
        </div>
    );
}
