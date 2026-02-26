import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    fetchDashboardOverview,
    fetchProductivityMetrics,
    fetchWellnessMetrics,
    fetchWeeklySummary,
    fetchCollaborationMetrics,
    fetchSkillMetrics,
    checkBackendAvailable,
} from '../../services/analyticsAPI'
import { getAPIClient } from '../../services/api'

// ─── React Query Hooks — Real API data ONLY ──────────────────────

export function useBackendHealth() {
    return useQuery({
        queryKey: ['backend', 'health'],
        queryFn: checkBackendAvailable,
        refetchInterval: 30000,
        retry: 1,
    })
}

export function useDashboardSummary() {
    return useQuery({
        queryKey: ['dashboard', 'summary'],
        queryFn: fetchDashboardOverview,
        refetchInterval: 10000,
    })
}

export function useActivityTimeline(_period: string = 'week') {
    return useQuery({
        queryKey: ['activity', 'timeline', _period],
        queryFn: async () => {
            const summary = await fetchWeeklySummary()
            return summary
        },
        refetchInterval: 30000,
    })
}

export function useProductivityMetrics() {
    return useQuery({
        queryKey: ['productivity', 'metrics'],
        queryFn: fetchProductivityMetrics,
        refetchInterval: 30000,
    })
}

export function useCollaborationMetrics() {
    return useQuery({
        queryKey: ['collaboration', 'metrics'],
        queryFn: fetchCollaborationMetrics,
        refetchInterval: 60000,
    })
}

export function useSkillMetrics() {
    return useQuery({
        queryKey: ['skills', 'metrics'],
        queryFn: fetchSkillMetrics,
        refetchInterval: 60000,
    })
}

export function useWellnessMetrics() {
    return useQuery({
        queryKey: ['wellness', 'metrics'],
        queryFn: fetchWellnessMetrics,
        refetchInterval: 300000,
    })
}

export function useWeeklySummary(weekOffset: number = 0) {
    return useQuery({
        queryKey: ['weekly', 'summary', weekOffset],
        queryFn: () => fetchWeeklySummary(weekOffset),
        staleTime: 300000,
    })
}

export function useInsights() {
    return useQuery({
        queryKey: ['insights'],
        queryFn: async () => {
            const summary = await fetchWeeklySummary()
            const insights: Array<{ id: string; type: string; title: string; description: string; impact: string }> = []

            if (summary.highlights) {
                summary.highlights.forEach((h: string, i: number) => {
                    insights.push({
                        id: `highlight-${i}`,
                        type: 'productivity',
                        title: 'Weekly Highlight',
                        description: h,
                        impact: 'This week',
                    })
                })
            }
            if (summary.suggestions) {
                summary.suggestions.forEach((s: string, i: number) => {
                    insights.push({
                        id: `suggestion-${i}`,
                        type: 'technical',
                        title: 'AI Suggestion',
                        description: s,
                        impact: 'Recommended',
                    })
                })
            }

            return insights
        },
        staleTime: 3600000,
    })
}

export function useKnowledgeGraph() {
    return useQuery({
        queryKey: ['knowledge', 'graph'],
        queryFn: async () => {
            const api = getAPIClient()
            return await api.get('/api/v1/entities/entities?limit=50')
        },
        staleTime: 60000,
    })
}

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const api = getAPIClient()
            return await api.get('/api/v1/activities/?limit=20')
        },
        refetchInterval: 30000,
    })
}

export function useTodaySchedule() {
    return useQuery({
        queryKey: ['schedule', 'today'],
        queryFn: async () => {
            const api = getAPIClient()
            return await api.get('/api/v1/activities/?limit=10')
        },
        refetchInterval: 60000,
    })
}

export function usePapers() {
    return useQuery({
        queryKey: ['papers'],
        queryFn: async () => {
            const api = getAPIClient()
            return await api.get('/api/v1/entities/entities?limit=20')
        },
        refetchInterval: 60000,
    })
}

export function useToggleTracking() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async () => {
            const api = getAPIClient()
            return api.post('/api/v1/activities/sync')
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboard'] })
            queryClient.invalidateQueries({ queryKey: ['activity'] })
        },
    })
}

export function useSyncNow() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async () => {
            const api = getAPIClient()
            return api.post('/api/v1/activities/sync')
        },
        onSuccess: () => {
            queryClient.invalidateQueries()
        },
    })
}
