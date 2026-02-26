'use client';

import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '../api';

export interface GraphNode {
    id: string;
    label: string;
    type: 'PERSON' | 'PROJECT' | 'SKILL' | 'ORGANIZATION' | 'DOCUMENT';
    x?: number;
    y?: number;
    size: number;
    color?: string;
    metadata?: {
        created_at?: string;
        updated_at?: string;
        description?: string;
        [key: string]: any;
    };
}

export interface GraphEdge {
    source: string;
    target: string;
    weight: number;
    label?: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
    stats: {
        node_count: number;
        edge_count: number;
        avg_degree: number;
    };
}

export function useGraphData() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['graph', 'visualization'],
        queryFn: () => api.get<GraphData>('/api/v1/graph/visualization'),
        staleTime: 30 * 60 * 1000, // 30 minutes (graph data changes slowly)
        retry: 2,
    });
}

export function useNodeDetails(nodeId: string | null) {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['graph', 'node', nodeId],
        queryFn: () => api.get(`/api/v1/graph/nodes/${nodeId}`),
        enabled: Boolean(nodeId),
        staleTime: 10 * 60 * 1000,
        retry: 2,
    });
}
