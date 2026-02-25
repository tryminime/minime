/**
 * Analytics API Service
 * Wraps the APIClient to fetch analytics data from the FastAPI backend.
 * All methods return typed data or throw on failure.
 */

import { getAPIClient } from './api';

const API_PREFIX = '/api/v1/analytics';

// ─── Response Types ──────────────────────────────────────────────

export interface DashboardOverview {
    user_id: string;
    generated_at: string;
    kpis: Record<string, any>;
    quick_actions: Array<{ label: string; href: string }>;
}

export interface ProductivityMetrics {
    total_hours: number;
    productive_hours: number;
    productivity_ratio: number;
    deep_work_hours: number;
    context_switches: number;
    focus_score: number;
    top_apps: Array<{ name: string; hours: number; percentage: number }>;
    time_allocation: Record<string, any>;
    comparison: Record<string, any>;
}

export interface CollaborationMetrics {
    collaboration_score: number;
    unique_collaborators: number;
    meetings_count: number;
    communication_volume: number;
    network_size: number;
    top_collaborators: Array<Record<string, any>>;
    network_diversity: Record<string, any>;
    meeting_patterns: Record<string, any>;
}

export interface SkillMetrics {
    total_skills: number;
    active_skills: any[];
    learning_velocity: number;
    skill_usage: Record<string, number>;
    expertise_distribution: Record<string, number>;
    mastery_levels: Record<string, any>;
    growth_trajectories: any[];
}

export interface WellnessMetrics {
    overall_score: number;
    work_life_balance: Record<string, any>;
    burnout_risk: Record<string, any>;
    rest_recovery: Record<string, any>;
    energy_levels: Record<string, any>;
}

export interface WeeklySummary {
    week_start: string;
    week_end: string;
    total_hours: number;
    productivity_score: number;
    top_activities: Array<Record<string, any>>;
    highlights: string[];
    suggestions: string[];
    wellness_score: number;
    goals_summary: Record<string, any>;
}

// ─── API Functions ───────────────────────────────────────────────

export async function fetchDashboardOverview(): Promise<DashboardOverview> {
    const api = getAPIClient();
    return api.get<DashboardOverview>(`${API_PREFIX}/overview`);
}

export async function fetchProductivityMetrics(): Promise<ProductivityMetrics> {
    const api = getAPIClient();
    return api.get<ProductivityMetrics>(`${API_PREFIX}/productivity`);
}

export async function fetchCollaborationMetrics(): Promise<CollaborationMetrics> {
    const api = getAPIClient();
    return api.get<CollaborationMetrics>(`${API_PREFIX}/collaboration`);
}

export async function fetchSkillMetrics(): Promise<SkillMetrics> {
    const api = getAPIClient();
    return api.get<SkillMetrics>(`${API_PREFIX}/skills`);
}

export async function fetchWellnessMetrics(): Promise<WellnessMetrics> {
    const api = getAPIClient();
    return api.get<WellnessMetrics>(`${API_PREFIX}/wellness`);
}

export async function fetchWeeklySummary(weekOffset: number = 0): Promise<WeeklySummary> {
    const api = getAPIClient();
    return api.get<WeeklySummary>(`${API_PREFIX}/summary/weekly`, {
        params: { week_offset: weekOffset },
    });
}

export async function checkBackendAvailable(): Promise<boolean> {
    const api = getAPIClient();
    return api.checkHealth();
}
