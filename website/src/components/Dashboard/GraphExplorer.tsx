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
        searchQuery?: string;
    };
    onSigmaReady?: (sigma: Sigma) => void;
}

// Color mapping for node types
const NODE_COLORS: Record<string, string> = {
    PERSON: '#3b82f6',
    PROJECT: '#8b5cf6',
    SKILL: '#10b981',
    ORGANIZATION: '#f59e0b',
    DOCUMENT: '#6b7280',
};

export function GraphExplorer({ onNodeClick, selectedNode, filters, onSigmaReady }: GraphExplorerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const sigmaRef = useRef<Sigma | null>(null);
    const graphRef = useRef<Graph | null>(null);
    const { data, isLoading, error } = useGraphData();
    const [isInitialized, setIsInitialized] = useState(false);

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

        // Add edges
        data.edges.forEach((edge: GraphEdge) => {
            if (graph.hasNode(edge.source) && graph.hasNode(edge.target)) {
                graph.addEdge(edge.source, edge.target, {
                    size: Math.max(1, edge.weight / 10),
                    color: '#e5e7eb',
                });
            }
        });

        // Apply layout if nodes don't have positions
        if (!data.nodes[0]?.x) {
            circular.assign(graph);
            forceAtlas2.assign(graph, {
                iterations: 50,
                settings: {
                    gravity: 1,
                    scalingRatio: 10,
                },
            });
        }

        // Create Sigma instance
        const sigma = new Sigma(graph, containerRef.current, {
            renderEdgeLabels: false,
            defaultNodeColor: '#6b7280',
            defaultEdgeColor: '#e5e7eb',
            labelSize: 12,
            labelColor: { color: '#374151' },
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

    // Apply filters
    useEffect(() => {
        if (!graphRef.current || !isInitialized) return;

        const graph = graphRef.current;

        graph.forEachNode((node) => {
            const nodeData = graph.getNodeAttributes(node);
            let visible = true;

            if (filters?.nodeTypes && filters.nodeTypes.length > 0) {
                visible = visible && filters.nodeTypes.includes(nodeData.nodeType);
            }

            if (filters?.searchQuery) {
                const query = filters.searchQuery.toLowerCase();
                visible = visible && nodeData.label.toLowerCase().includes(query);
            }

            graph.setNodeAttribute(node, 'hidden', !visible);
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

            {data && (
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
                    <p className="font-semibold text-gray-700">Graph Stats</p>
                    <p className="text-gray-600">{data.stats.node_count} nodes</p>
                    <p className="text-gray-600">{data.stats.edge_count} edges</p>
                    <p className="text-gray-600">Avg degree: {data.stats.avg_degree.toFixed(1)}</p>
                </div>
            )}
        </div>
    );
}
