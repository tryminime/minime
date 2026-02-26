import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAPIClient } from '@/lib/api';

export interface Goal {
    id: string;
    title: string;
    category: 'focus' | 'productivity' | 'learning' | 'wellness' | 'custom';
    target_value: number;
    current_value: number;
    unit: string;
    deadline?: string;
    status: 'active' | 'completed' | 'paused';
    streak_count: number;
    created_at: string;
}

export interface GoalCreate {
    title: string;
    category: string;
    target_value: number;
    unit: string;
    deadline?: string;
}

export interface WellnessData {
    overall_score: number;
    work_life_balance: { score: number; break_ratio: number };
    burnout_risk: { level: string; long_sessions: number };
    rest_recovery: { break_count: number; total_break_minutes: number };
    energy_levels: Record<string, unknown>;
}

export interface CareerData {
    growth_trajectory: string;
    career_phase: string;
    skill_gaps: string[];
    recommended_next_steps: string[];
    best_fit_role: Record<string, unknown>;
    milestone: Record<string, unknown>;
}

export function useGoals() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['goals'],
        queryFn: () => api.get<Goal[]>('/api/v1/analytics/goals'),
        staleTime: 60 * 1000,
        retry: 1,
    });
}

export function useCreateGoal() {
    const api = getAPIClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: GoalCreate) => api.post<Goal>('/api/v1/analytics/goals', data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
    });
}

export function useDeleteGoal() {
    const api = getAPIClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete<{ deleted: boolean }>(`/api/v1/analytics/goals/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
    });
}

export function useUpdateGoal() {
    const api = getAPIClient();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: string; status?: string; current_value?: number }) =>
            api.put<Goal>(`/api/v1/analytics/goals/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
    });
}

export function useWellness() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['wellness'],
        queryFn: () => api.get<WellnessData>('/api/v1/analytics/wellness'),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}

export function useCareer() {
    const api = getAPIClient();
    return useQuery({
        queryKey: ['career'],
        queryFn: () => api.get<CareerData>('/api/v1/analytics/career'),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });
}
