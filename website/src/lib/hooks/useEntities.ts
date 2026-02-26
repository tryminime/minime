import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';

// Matches the actual Entity.to_dict() response from the backend
export interface EntityItem {
    id: string;
    name: string;          // canonical name stored as `name` column
    entity_type: 'person' | 'organization' | 'skill' | 'concept' | 'artifact' | 'event' | 'project' | 'interaction';
    canonical_id?: string | null;
    confidence?: number;
    occurrence_count: number;
    first_seen?: string;
    last_seen?: string;
    metadata?: Record<string, unknown> | null;
    linked_activity_count?: number;
    // Derived for convenience in UI:
    canonical_name: string;  // alias for name
    aliases: string[];       // derived from metadata or empty
}

export interface EntityListResponse {
    entities: EntityItem[];
    total: number;
    limit: number;
    offset: number;
}

export interface EntityNeighbor {
    entity: EntityItem;
    co_occurrence_count: number;
    relationship_type?: string;
}

export interface EntityDuplicate {
    entity: EntityItem;
    confidence: number;
    match_reasons: string[];
}

/** Normalize the raw API entity response to our EntityItem shape */
function normalizeEntity(raw: Record<string, unknown>): EntityItem {
    return {
        id: raw.id as string,
        name: raw.name as string,
        canonical_name: raw.name as string,  // alias
        entity_type: raw.entity_type as EntityItem['entity_type'],
        canonical_id: raw.canonical_id as string | null,
        confidence: raw.confidence as number | undefined,
        occurrence_count: (raw.occurrence_count as number) ?? 0,
        first_seen: raw.first_seen as string | undefined,
        last_seen: raw.last_seen as string | undefined,
        metadata: raw.metadata as Record<string, unknown> | null,
        aliases: [],  // not in DB schema; derived elsewhere
        linked_activity_count: raw.linked_activity_count as number | undefined,
    };
}

// ── List entities with optional type filter ─────────────────────────────────
export function useEntities(
    type?: string,
    limit: number = 50,
    offset: number = 0
) {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['entities', type, limit, offset],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.set('limit', String(limit));
            params.set('offset', String(offset));
            if (type && type !== 'all') params.set('type', type);
            const raw = await api.get<{ entities: Record<string, unknown>[]; total: number; limit: number; offset: number }>(
                `/api/v1/entities/entities?${params.toString()}`
            );
            return {
                ...raw,
                entities: (raw.entities ?? []).map(normalizeEntity),
            } as EntityListResponse;
        },
        staleTime: 3 * 60 * 1000,
        retry: 2,
    });
}

// ── Single entity detail ─────────────────────────────────────────────────────
export function useEntity(entityId: string | null) {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['entity', entityId],
        queryFn: async () => {
            const raw = await api.get<Record<string, unknown>>(
                `/api/v1/entities/entities/${entityId}`
            );
            return normalizeEntity(raw);
        },
        enabled: !!entityId,
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });
}

// ── Duplicate detection ──────────────────────────────────────────────────────
export function useEntityDuplicates(
    entityId: string | null,
    threshold: number = 0.8
) {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['entity-duplicates', entityId, threshold],
        queryFn: async () => {
            const raw = await api.get<{
                duplicates: Array<{ entity: Record<string, unknown>; confidence: number; match_reasons?: string[] }>;
                entity: Record<string, unknown>;
            }>(`/api/v1/entities/entities/${entityId}/duplicates?threshold=${threshold}&limit=20`);
            return {
                entity: normalizeEntity(raw.entity),
                duplicates: (raw.duplicates ?? []).map(d => ({
                    entity: normalizeEntity(d.entity),
                    confidence: d.confidence,
                    match_reasons: d.match_reasons ?? [],
                })),
            };
        },
        enabled: !!entityId,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}

// ── Entity neighbors (knowledge graph) ──────────────────────────────────────
export function useEntityNeighbors(entityId: string | null, depth: number = 1) {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['entity-neighbors', entityId, depth],
        queryFn: async () => {
            const raw = await api.get<{
                center: Record<string, unknown>;
                neighbors: Array<{ entity: Record<string, unknown>; co_occurrence_count: number }>;
                edges: Array<{ source: string; target: string; weight: number }>;
            }>(`/api/v1/entities/entities/${entityId}/neighbors?depth=${depth}`);
            return {
                center: normalizeEntity(raw.center),
                neighbors: (raw.neighbors ?? []).map(n => ({
                    entity: normalizeEntity(n.entity),
                    co_occurrence_count: n.co_occurrence_count,
                })),
                edges: raw.edges ?? [],
            };
        },
        enabled: !!entityId,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}

// ── Merge mutation ────────────────────────────────────────────────────────────
export function useEntityMerge() {
    const api = getAPIClient();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            sourceId,
            targetId,
        }: {
            sourceId: string;
            targetId: string;
        }) =>
            api.post<EntityItem>('/api/v1/entities/entities/merge', {
                source_id: sourceId,
                target_id: targetId,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entities'] });
            queryClient.invalidateQueries({ queryKey: ['entity-duplicates'] });
        },
    });
}

// ── Enrichment aggregate stats ────────────────────────────────────────────────
export function useEnrichmentStats() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['enrichment-stats'],
        queryFn: async () => {
            const [allEntities, persons, orgs, skills, artifacts, concepts] =
                await Promise.all([
                    api.get<EntityListResponse>('/api/v1/entities/entities?limit=1').catch(() => ({ entities: [], total: 0 })),
                    api.get<EntityListResponse>('/api/v1/entities/entities?type=person&limit=1').catch(() => ({ entities: [], total: 0 })),
                    api.get<EntityListResponse>('/api/v1/entities/entities?type=organization&limit=1').catch(() => ({ entities: [], total: 0 })),
                    api.get<EntityListResponse>('/api/v1/entities/entities?type=skill&limit=1').catch(() => ({ entities: [], total: 0 })),
                    api.get<EntityListResponse>('/api/v1/entities/entities?type=artifact&limit=1').catch(() => ({ entities: [], total: 0 })),
                    api.get<EntityListResponse>('/api/v1/entities/entities?type=concept&limit=1').catch(() => ({ entities: [], total: 0 })),
                ]);

            return {
                total: (allEntities as EntityListResponse).total,
                byType: {
                    person: (persons as EntityListResponse).total,
                    organization: (orgs as EntityListResponse).total,
                    skill: (skills as EntityListResponse).total,
                    artifact: (artifacts as EntityListResponse).total,
                    concept: (concepts as EntityListResponse).total,
                },
            };
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}
