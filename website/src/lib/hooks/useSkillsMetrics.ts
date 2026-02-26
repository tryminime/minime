'use client';

import { useQuery } from '@tanstack/react-query';
import { getAPIClient } from '../api';

export interface Skill {
    name: string;
    category: string;
    mastery: number; // 0-100
    time_invested_hours: number;
    last_used: string;
    growth_rate: number;
}

export interface SkillMetrics {
    total_skills: number;
    advanced_skills: number; // mastery > 70
    skill_diversity: number; // 0-100
    learning_velocity: number; // skills per month
    top_skills: Skill[];
    recommended_skills: {
        name: string;
        reason: string;
        estimated_time_hours: number;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
    }[];
    growth_history: {
        date: string;
        skill_name: string;
        mastery: number;
    }[];
}

export function useSkillsMetrics() {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['skills', 'metrics'],
        queryFn: () => api.get<SkillMetrics>('/api/v1/analytics/skills'),
        staleTime: 15 * 60 * 1000, // 15 minutes
        retry: 2,
    });
}

export function useSkillGrowthHistory(skillName?: string) {
    const api = getAPIClient();

    return useQuery({
        queryKey: ['skills', 'growth', skillName],
        queryFn: () => {
            const url = skillName
                ? `/api/v1/analytics/skills/growth?skill=${encodeURIComponent(skillName)}`
                : '/api/v1/analytics/skills/growth';
            return api.get<{ date: string; mastery: number }[]>(url);
        },
        enabled: Boolean(skillName),
        staleTime: 10 * 60 * 1000,
        retry: 2,
    });
}
