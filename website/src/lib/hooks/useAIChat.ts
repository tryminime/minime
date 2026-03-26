import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Citation {
    source: string;
    excerpt?: string;
    relevance_score?: number;
}

export interface AIMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    model?: string;
    citations?: Citation[];
}

export interface ConversationSummary {
    id: string;
    title: string;
    message_count: number;
    last_message_at: string;
    archived: boolean;
}

export interface ConversationDetail {
    id: string;
    title: string;
    messages: AIMessage[];
    message_count: number;
    created_at: string;
}

export interface ConversationListResponse {
    conversations: ConversationSummary[];
    total: number;
    limit: number;
    offset: number;
}

export interface ModelInfo {
    model: string;
    provider: 'openai' | 'ollama' | 'demo';
    supports_streaming: boolean;
    supports_rag: boolean;
    ollama_available: boolean;
    openai_available: boolean;
}

export interface FocusScore {
    score: number;
    max_score: number;
    deep_work_hours: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
}

export interface WellnessScore {
    score: number;
    max_score: number;
    status: 'good' | 'warning' | 'alert';
    factors: Record<string, number>;
    recommendations: string[];
}

export interface SearchResult {
    id: string;
    content: string;
    score: number;
    source?: string;
    metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversations
// ─────────────────────────────────────────────────────────────────────────────

export function useConversations(includeArchived = false) {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-conversations', includeArchived],
        queryFn: () =>
            api.get<ConversationListResponse>(
                `/api/ai/conversations?include_archived=${includeArchived}&limit=50`
            ),
        staleTime: 30 * 1000,
        retry: 1,
    });
}

export function useConversation(conversationId: string | null) {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-conversation', conversationId],
        queryFn: () =>
            api.get<ConversationDetail>(`/api/ai/conversations/${conversationId}`),
        enabled: !!conversationId,
        staleTime: 10 * 1000,
        retry: 1,
    });
}

export function useDeleteConversation() {
    const api = getAPIClient();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conversationId: string) =>
            api.delete<{ deleted: boolean }>(`/api/ai/conversations/${conversationId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
        },
    });
}

export function useArchiveConversation() {
    const api = getAPIClient();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conversationId: string) =>
            api.post(`/api/ai/conversations/${conversationId}/archive`, {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
        },
    });
}

export function useExportConversation() {
    const api = getAPIClient();
    return useMutation({
        mutationFn: ({ conversationId, format }: { conversationId: string; format: string }) =>
            api.post<{ content: string; filename: string; format: string }>(
                `/api/ai/conversations/${conversationId}/export`,
                { format }
            ),
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Info
// ─────────────────────────────────────────────────────────────────────────────

export function useModelInfo() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-model-info'],
        queryFn: () => api.get<ModelInfo>('/api/ai/model/info'),
        staleTime: 10 * 1000,  // 10s — refresh quickly after model switch
        retry: 1,
    });
}

export interface AvailableModel {
    name: string;
    size_gb: number;
}

export interface AvailableModelsResponse {
    models: AvailableModel[];
    active_model: string;
    provider: string;
}

export function useAvailableModels() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-available-models'],
        queryFn: () => api.get<AvailableModelsResponse>('/api/ai/models/available'),
        staleTime: 60 * 1000,
        retry: 1,
    });
}

export function useSetModel() {
    const api = getAPIClient();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (model: string) =>
            api.put<{ accepted: boolean; active_model: string; provider: string }>(
                '/api/ai/model',
                { model }
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-model-info'] });
            queryClient.invalidateQueries({ queryKey: ['ai-available-models'] });
        },
    });
}


// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

export function useFocusScore() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-focus-score'],
        queryFn: () => api.get<FocusScore>('/api/ai/analytics/focus-score'),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useWellnessScore() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-wellness'],
        queryFn: () => api.get<WellnessScore>('/api/ai/analytics/wellness'),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Smart Search
// ─────────────────────────────────────────────────────────────────────────────

export function useAISearch(query: string) {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-search', query],
        queryFn: () =>
            api.get<{ results: SearchResult[]; query: string; total: number }>(
                `/api/ai/search?q=${encodeURIComponent(query)}&top_k=8`
            ),
        enabled: query.trim().length > 2,
        staleTime: 60 * 1000,
        retry: 1,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekly Report
// ─────────────────────────────────────────────────────────────────────────────

export function useWeeklyAIReport() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-weekly-report'],
        queryFn: () =>
            api.post<{
                period: string;
                total_hours: number;
                days_active: number;
                avg_focus_score: number;
                breakdown: Record<string, number>;
                trends: Record<string, number>;
            }>('/api/ai/reports/weekly', {}),
        staleTime: 30 * 60 * 1000,
        retry: 1,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Proactive Insights
// ─────────────────────────────────────────────────────────────────────────────

export interface ProactiveInsight {
    id: string;
    category: string;
    category_icon: string;
    category_label: string;
    title: string;
    description: string;
    priority: number;
    data: Record<string, unknown>;
    action?: { label: string; url: string };
    dismissed: boolean;
    source: string;
    created_at: string;
    expires_at: string;
}

export function useProactiveInsights() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-insights'],
        queryFn: () =>
            api.get<{ insights: ProactiveInsight[]; total: number }>(
                '/api/ai/insights'
            ),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Milestone Celebrations
// ─────────────────────────────────────────────────────────────────────────────

export interface Milestone {
    id: string;
    type: string;
    emoji: string;
    title: string;
    message: string;
    threshold: number;
    current_value: number;
    progress: number;
    unlocked: boolean;
}

export function useMilestones() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['ai-milestones'],
        queryFn: () =>
            api.get<{
                milestones: Milestone[];
                unlocked: Milestone[];
                total_unlocked: number;
                total_milestones: number;
                metrics: Record<string, number>;
            }>('/api/ai/milestones'),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE Parsing Utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a Server-Sent Events text blob into individual data payloads.
 * Backend sends: `data: {"chunk":"word ","conversation_id":"..."}\n\n`
 */
export function parseSSEChunk(rawText: string): { chunks: string[]; done: boolean; conversationId?: string; citations?: Citation[] } {
    const lines = rawText.split('\n');
    const chunks: string[] = [];
    let done = false;
    let conversationId: string | undefined;
    let citations: Citation[] | undefined;

    for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
            const payload = JSON.parse(line.slice(6));
            if (payload.chunk) chunks.push(payload.chunk);
            if (payload.done) {
                done = true;
                // Extract citations from the done event
                if (payload.citations && Array.isArray(payload.citations)) {
                    citations = payload.citations.map((c: Record<string, unknown>) => ({
                        source: (c.title as string) || (c.source as string) || 'Unknown source',
                        excerpt: (c.snippet as string) || (c.excerpt as string) || undefined,
                        relevance_score: (c.relevance_score as number) || undefined,
                    }));
                }
            }
            if (payload.conversation_id) conversationId = payload.conversation_id;
        } catch {
            // Ignore malformed lines
        }
    }

    return { chunks, done, conversationId, citations };
}
