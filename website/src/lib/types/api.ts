// API Response Types

export interface ProductivityMetrics {
    focus_score: number;
    productivity_score: number;
    deep_work_sessions: number;
    meeting_load_hours: number;
    context_switches: number;
    date: string;
}

export interface CollaborationMetrics {
    collaboration_index: number;
    top_collaborators: Array<{
        name: string;
        interaction_count: number;
        email?: string;
    }>;
    meeting_count: number;
    communication_frequency: string;
}

export interface SkillMetrics {
    skill_diversity: number;
    top_skills: Array<{
        name: string;
        mastery: number;
        hours: number;
    }>;
    learning_velocity: number;
}

export interface WeeklySummary {
    week_start: string;
    week_end: string;
    summary_text: string;
    report_html: string;
    productivity_avg: number;
    top_collaborators: string[];
    skills_learned: string[];
}

export interface GraphNode {
    id: string;
    label: string;
    type: 'PERSON' | 'PAPER' | 'TOPIC' | 'SKILL' | 'PROJECT' | 'ORGANIZATION' | 'TOOL' | 'CONCEPT';
    centrality?: number;
    properties?: Record<string, any>;
}

export interface GraphEdge {
    source: string;
    target: string;
    type: string;
    weight?: number;
    properties?: Record<string, any>;
}

export interface GraphVisualization {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export interface Activity {
    id: string;
    window_title: string;
    application_name: string;
    url?: string;
    duration_seconds: number;
    occurred_at: string;
    category?: string;
}
