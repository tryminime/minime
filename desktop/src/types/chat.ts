// Chat type definitions
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    isStreaming?: boolean;
}

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ChatContext {
    includeActivities: boolean;
    includeProjects: boolean;
    includePapers: boolean;
    timeRange?: {
        start: Date;
        end: Date;
    };
}

export interface QuickPrompt {
    id: string;
    label: string;
    prompt: string;
    icon: string;
    category: 'insights' | 'productivity' | 'research' | 'wellness';
}
