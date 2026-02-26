'use client';

import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '../api';

export interface Collaborator {
    name: string;
    email?: string;
    interaction_count: number;
    avatar_url?: string;
}

export interface CollaborationMetrics {
    week_start: string;
    week_end: string;
    collaboration_index: number;
    top_collaborators: Collaborator[];
    meeting_count: number;
    communication_frequency: string;
    total_collaborators: number;
}

export interface CollaborationNetwork {
    nodes: Array<{
        id: string;
        name: string;
        type: string;
        size: number;
    }>;
    edges: Array<{
        source: string;
        target: string;
        weight: number;
    }>;
}

// Raw shape from /api/v1/analytics/collaboration
interface RawCollaboration {
    collaboration_score: number;
    unique_collaborators: number;
    meetings_count: number;
    communication_volume: number;
    network_size: number;
    top_collaborators: Collaborator[];
    network_diversity: Record<string, unknown>;
    meeting_patterns: Record<string, unknown>;
}

function mapToMetrics(raw: RawCollaboration): CollaborationMetrics {
    return {
        week_start: new Date(Date.now() - 7 * 864e5).toISOString(),
        week_end: new Date().toISOString(),
        collaboration_index: raw.collaboration_score ?? 0,
        top_collaborators: raw.top_collaborators ?? [],
        meeting_count: raw.meetings_count ?? 0,
        communication_frequency: raw.communication_volume > 20 ? 'High' : raw.communication_volume > 8 ? 'Medium' : 'Low',
        total_collaborators: raw.unique_collaborators ?? 0,
    };
}

export function useCollaborationWeekly() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['collaboration', 'weekly'],
        queryFn: async (): Promise<CollaborationMetrics> => {
            const raw = await api.get<RawCollaboration>('/api/v1/analytics/collaboration');
            return mapToMetrics(raw);
        },
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });
}

export function useCollaborationNetwork() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['collaboration', 'network'],
        queryFn: async (): Promise<CollaborationNetwork> => {
            // Build network from entity data — organizations = collaborators
            const entitiesResp = await api.get<{ entities: Array<{ id: string; name: string; entity_type: string; occurrence_count: number }> }>(
                '/api/v1/entities/entities?limit=30'
            );
            const entities = entitiesResp.entities ?? [];
            const nodes = entities.map(e => ({
                id: e.id,
                name: e.name,
                type: e.entity_type,
                size: Math.max(5, Math.min(20, e.occurrence_count * 1.5)),
            }));
            // Edges: connect orgs/people to artifacts they co-occur with
            const orgPerson = entities.filter(e => e.entity_type === 'organization' || e.entity_type === 'person');
            const artifacts = entities.filter(e => e.entity_type === 'artifact');
            const edges = orgPerson.flatMap(op =>
                artifacts.slice(0, 3).map(a => ({
                    source: op.id,
                    target: a.id,
                    weight: 1,
                }))
            );
            return { nodes, edges };
        },
        staleTime: 15 * 60 * 1000,
        retry: 1,
    });
}
