/**
 * Graph API Service
 * Handles all API calls to the knowledge graph endpoints
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface NodeMetrics {
    degree_centrality?: number;
    betweenness_centrality?: number;
    closeness_centrality?: number;
    eigenvector_centrality?: number;
    pagerank?: number;
    community_id?: number;
    embedding_reduced?: number[];
}

export interface GraphNode {
    id: number;
    labels: string[];
    properties: Record<string, any>;
    metrics?: NodeMetrics;
}

export interface GraphRelationship {
    source: number;
    target: number;
    type: string;
    properties: Record<string, any>;
}

export interface GraphExportResponse {
    nodes: GraphNode[];
    relationships: GraphRelationship[];
    total_nodes: number;
    total_relationships: number;
    exported_at: string;
}

export interface NodeDetail {
    node_id: number;
    labels: string[];
    properties: Record<string, any>;
    metrics: NodeMetrics;
    neighbor_count: number;
}

export interface Expert {
    node_id: number;
    name: string;
    node_type: string;
    pagerank: number;
    h_index?: number;
    paper_count?: number;
    community_id?: number;
}

export interface Community {
    community_id: number;
    size: number;
    dominant_node_types: string[];
    sample_members: Array<{
        node_id: number;
        name: string;
        node_type: string;
    }>;
}

class GraphAPIService {
    private getAuthHeaders() {
        const token = localStorage.getItem('auth_token');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Export graph data for visualization
     */
    async exportGraph(params?: {
        node_types?: string[];
        limit?: number;
    }): Promise<GraphExportResponse> {
        const queryParams = new URLSearchParams();

        if (params?.node_types) {
            params.node_types.forEach(type => queryParams.append('node_types', type));
        }

        if (params?.limit) {
            queryParams.append('limit', params.limit.toString());
        }

        const response = await axios.get<GraphExportResponse>(
            `${API_BASE_URL}/graph/export?${queryParams.toString()}`,
            { headers: this.getAuthHeaders() }
        );

        return response.data;
    }

    /**
     * Get node details
     */
    async getNodeDetails(nodeId: number): Promise<NodeDetail> {
        const response = await axios.get<NodeDetail>(
            `${API_BASE_URL}/graph/nodes/${nodeId}`,
            { headers: this.getAuthHeaders() }
        );

        return response.data;
    }

    /**
     * Get node neighbors
     */
    async getNodeNeighbors(nodeId: number, relationshipTypes?: string[]) {
        const queryParams = new URLSearchParams();

        if (relationshipTypes) {
            relationshipTypes.forEach(type => queryParams.append('relationship_types', type));
        }

        const response = await axios.get(
            `${API_BASE_URL}/graph/nodes/${nodeId}/neighbors?${queryParams.toString()}`,
            { headers: this.getAuthHeaders() }
        );

        return response.data;
    }

    /**
     * Get experts
     */
    async getExperts(params?: {
        topic_id?: number;
        page?: number;
        page_size?: number;
    }) {
        const queryParams = new URLSearchParams();

        if (params?.topic_id) queryParams.append('topic_id', params.topic_id.toString());
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

        const response = await axios.get(
            `${API_BASE_URL}/graph/experts?${queryParams.toString()}`,
            { headers: this.getAuthHeaders() }
        );

        return response.data;
    }

    /**
     * Get communities
     */
    async getCommunities(params?: {
        min_size?: number;
        page?: number;
        page_size?: number;
    }) {
        const queryParams = new URLSearchParams();

        if (params?.min_size) queryParams.append('min_size', params.min_size.toString());
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

        const response = await axios.get(
            `${API_BASE_URL}/graph/communities?${queryParams.toString()}`,
            { headers: this.getAuthHeaders() }
        );

        return response.data;
    }

    /**
     * Search embeddings
     */
    async searchEmbeddings(params: {
        node_id?: number;
        embedding_vector?: number[];
        top_k?: number;
        min_similarity?: number;
    }) {
        const response = await axios.post(
            `${API_BASE_URL}/graph/embeddings/search`,
            params,
            { headers: this.getAuthHeaders() }
        );

        return response.data;
    }

    /**
     * Get collaborator recommendations
     */
    async getCollaboratorRecommendations(forNodeId: number, topK: number = 10) {
        const response = await axios.get(
            `${API_BASE_URL}/graph/collaborators/recommend?for_node_id=${forNodeId}&top_k=${topK}`,
            { headers: this.getAuthHeaders() }
        );

        return response.data;
    }

    /**
     * Get learning paths
     */
    async getLearningPaths(params: {
        source_topic_id: number;
        target_topic_id?: number;
        max_depth?: number;
    }) {
        const queryParams = new URLSearchParams();
        queryParams.append('source_topic_id', params.source_topic_id.toString());

        if (params.target_topic_id) {
            queryParams.append('target_topic_id', params.target_topic_id.toString());
        }

        if (params.max_depth) {
            queryParams.append('max_depth', params.max_depth.toString());
        }

        const response = await axios.get(
            `${API_BASE_URL}/graph/learning-paths?${queryParams.toString()}`,
            { headers: this.getAuthHeaders() }
        );

        return response.data;
    }
}

export const graphAPI = new GraphAPIService();
