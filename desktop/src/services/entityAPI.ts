/**
 * Entity API Service
 * 
 * Handles all entity-related API calls for the desktop app.
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface ListEntitiesParams {
    type?: string;
    limit?: number;
    offset?: number;
}

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class EntityAPIService {
    async getAuthToken(): Promise<string | null> {
        // In a real app, this would get the token from auth context
        return localStorage.getItem('authToken');
    }

    async request(endpoint: string, options: RequestOptions = {}): Promise<any> {
        const token = await this.getAuthToken();

        const defaultOptions: RequestOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            }
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(error.detail || `API error: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * List entities with filtering and pagination
     */
    async listEntities(params: ListEntitiesParams = {}): Promise<any> {
        const queryParams = new URLSearchParams();

        if (params.type) queryParams.append('type', params.type);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());

        const query = queryParams.toString();
        return this.request(`/v1/entities${query ? `?${query}` : ''}`);
    }

    /**
     * Get single entity by ID
     */
    async getEntity(entityId: string): Promise<any> {
        return this.request(`/v1/entities/${entityId}`);
    }

    /**
     * Find duplicate entities
     */
    async findDuplicates(entityId: string, threshold = 0.80, limit = 20): Promise<any> {
        const params = new URLSearchParams({
            threshold: threshold.toString(),
            limit: limit.toString()
        });

        return this.request(`/v1/entities/${entityId}/duplicates?${params}`);
    }

    /**
     * Merge two entities
     */
    async mergeEntities(sourceId: string, targetId: string): Promise<any> {
        return this.request('/v1/entities/merge', {
            method: 'POST',
            body: JSON.stringify({
                source_id: sourceId,
                target_id: targetId
            })
        });
    }

    /**
     * Get entity neighbors in knowledge graph
     */
    async getNeighbors(entityId: string, depth = 1, relationshipType: string | null = null): Promise<any> {
        const params = new URLSearchParams({ depth: depth.toString() });
        if (relationshipType) {
            params.append('relationship_type', relationshipType);
        }

        return this.request(`/v1/entities/${entityId}/neighbors?${params}`);
    }

    /**
     * Search entities
     */
    async searchEntities(query: string, type: string | null = null, limit = 50): Promise<any> {
        const params = new URLSearchParams({ limit: limit.toString() });
        if (type) params.append('type', type);
        if (query) params.append('q', query);

        return this.request(`/v1/entities?${params}`);
    }

    /**
     * Get entity types
     */
    async getEntityTypes(): Promise<any> {
        return this.request('/v1/entities/types');
    }
}

export const entityAPI = new EntityAPIService();
export default EntityAPIService;
