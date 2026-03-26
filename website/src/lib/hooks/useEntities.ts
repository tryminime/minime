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
    // Organization-specific enrichment fields (from NER pipeline)
    org_type?: string | null;   // company|educational|government|open_source|media|cloud|developer_tools|social_media|community
    industry?: string | null;   // tech|finance|education|social|research|news|government|etc.
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
        // Org enrichment fields — present when entity_type === 'organization'
        org_type: (raw.org_type as string | null) ?? null,
        industry: (raw.industry as string | null) ?? null,
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
                `/api/v1/entities?${params.toString()}`
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
                `/api/v1/entities/${entityId}`
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
                entity_id: string;
                entity_name: string;
                entity_type: string;
                duplicates: Array<{ entity: Record<string, unknown>; confidence: number; match_reasons?: string[] }>;
                count: number;
                thresholds: { auto_merge: number; suggest: number };
            }>(`/api/v1/entities/${entityId}/duplicates?threshold=${threshold}&limit=20`);
            return {
                entity: normalizeEntity({ id: raw.entity_id, name: raw.entity_name, entity_type: raw.entity_type }),
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
            }>(`/api/v1/entities/${entityId}/neighbors?depth=${depth}`);
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
            api.post<EntityItem>('/api/v1/entities/merge', {
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
            const stats = await api.get<{ total: number; by_type: Record<string, number> }>(
                '/api/v1/entities/stats'
            );
            return {
                total: stats.total,
                byType: {
                    person: stats.by_type['person'] || 0,
                    organization: stats.by_type['organization'] || 0,
                    skill: stats.by_type['skill'] || 0,
                    artifact: stats.by_type['artifact'] || 0,
                    concept: stats.by_type['concept'] || 0,
                },
            };
        },
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });
}

// ── Full deduplication scan types ─────────────────────────────────────────────

export interface DedupMember {
    id: string;
    name: string;
    entity_type: string;
    occurrence_count: number;
    first_seen: string | null;
    last_seen:  string | null;
    confidence: number | null;
    metadata:   Record<string, unknown> | null;
}

export interface DedupCluster {
    cluster_id:     string;
    members:        DedupMember[];
    canonical_id:   string;
    canonical_name: string;
    entity_type:    string;
    max_confidence: number;
    avg_confidence: number;
    match_reasons:  string[];
    recommendation: 'auto_merge' | 'suggest' | 'review';
    size:           number;
}

export interface DedupScanResult {
    entities_scanned:  number;
    duplicate_pairs:   number;
    clusters:          DedupCluster[];
    auto_merge_count:  number;
    stats:             { by_type: Record<string, number> };
}

// ── Full deduplication scan hook ──────────────────────────────────────────────

/**
 * GET /api/v1/entities/dedup-scan
 * Fetches all duplicate clusters for the authenticated user.
 * The scan runs on-demand and is NOT auto-fetched on mount — call refetch() to trigger.
 */
export function useDeduplicationScan() {
    const api = getAPIClient();
    return useQuery<DedupScanResult>({
        queryKey: ['dedup-scan'],
        queryFn: () => api.get<DedupScanResult>('/api/v1/entities/dedup-scan'),
        enabled: false,            // manual trigger only
        staleTime: 0,              // always fresh on refetch
        retry: 1,
    });
}

// ── Cluster merge mutation ────────────────────────────────────────────────────

export function useClusterMerge() {
    const api = getAPIClient();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            entityIds,
            canonicalId,
        }: {
            entityIds:   string[];
            canonicalId?: string;
        }) =>
            api.post('/api/v1/entities/dedup-merge-cluster', {
                entity_ids:   entityIds,
                canonical_id: canonicalId ?? null,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['entities'] });
            queryClient.invalidateQueries({ queryKey: ['dedup-scan'] });
            queryClient.invalidateQueries({ queryKey: ['enrichment-stats'] });
        },
    });
}

// ── Graph Intelligence Types ─────────────────────────────────────────────────

export interface ExpertiseProfile {
    skills: Record<string, { score: number; raw_score: number; frequency: number; category: string }>;
    top_skills: string[];
    categories: Record<string, number>;
    primary_category: string;
    total_skills: number;
    skill_diversity: number;
    rankings: Array<{
        entity: string; label: string; expertise_score: number;
        level: string; frequency: number; category: string;
    }>;
    timeline: Array<{
        period_start: string; period_end: string;
        new_skills: string[]; cumulative_skill_count: number;
    }>;
    entity_count: number;
}

export interface LearningPath {
    category: string;
    category_label: string;
    current_score: number;
    priority: 'high' | 'medium' | 'low';
    known_count: number;
    missing_count: number;
    weak_count: number;
    steps: Array<{ skill: string; action: string; reason: string }>;
    estimated_effort: string;
}

export interface LearningPathsResult {
    paths: LearningPath[];
    total_paths: number;
    current_skill_count: number;
    primary_category: string;
}

export interface Collaborator {
    entity_a: { id: string; name: string };
    entity_b: { id: string; name: string };
    shared_activities: number;
    strength: number;
}

export interface CollaborationResult {
    collaborators: Collaborator[];
    total_persons: number;
    total_pairs: number;
    collaboration_score: number;
    patterns: string[];
}

export interface CrossDomainResult {
    active_domains: string[];
    domain_count: number;
    bridge_entities: Array<{ entity: string; domains: string[]; domain_count: number }>;
    bridge_count: number;
    category_distribution: Record<string, number>;
    diversity_score: number;
    specialization: string;
    cross_type_connections: Array<{
        entity_a: { id: string; name: string; type: string };
        entity_b: { id: string; name: string; type: string };
        co_occurrences: number;
    }>;
}

export interface PageRankResult {
    rankings: Array<{
        id: string; name: string; entity_type: string;
        pagerank: number; occurrence_count: number; connections: number;
    }>;
    total: number;
    stats: {
        max_pagerank: number; avg_pagerank: number;
        total_entities: number; connected_entities: number;
    };
}

// ── Graph Intelligence Hooks ─────────────────────────────────────────────────

export function useExpertiseProfile() {
    const api = getAPIClient();
    return useQuery<ExpertiseProfile>({
        queryKey: ['graph-expertise'],
        queryFn: () => api.get<ExpertiseProfile>('/api/v1/graph/intelligence/expertise'),
        enabled: false,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useLearningPaths() {
    const api = getAPIClient();
    return useQuery<LearningPathsResult>({
        queryKey: ['graph-learning-paths'],
        queryFn: () => api.get<LearningPathsResult>('/api/v1/graph/intelligence/learning-paths'),
        enabled: false,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useCollaborationPatterns() {
    const api = getAPIClient();
    return useQuery<CollaborationResult>({
        queryKey: ['graph-collaboration'],
        queryFn: () => api.get<CollaborationResult>('/api/v1/graph/intelligence/collaboration'),
        enabled: false,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useCrossDomainConnections() {
    const api = getAPIClient();
    return useQuery<CrossDomainResult>({
        queryKey: ['graph-cross-domain'],
        queryFn: () => api.get<CrossDomainResult>('/api/v1/graph/intelligence/cross-domain'),
        enabled: false,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function usePageRank() {
    const api = getAPIClient();
    return useQuery<PageRankResult>({
        queryKey: ['graph-pagerank'],
        queryFn: () => api.get<PageRankResult>('/api/v1/graph/intelligence/pagerank'),
        enabled: false,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}
