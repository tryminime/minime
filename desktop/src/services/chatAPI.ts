import { getAPIClient, APIError } from './api';
import { ChatMessage } from '../types/chat';

/**
 * Chat API Types
 */
export interface ChatRequest {
    message: string;
    conversation_id?: string;
    context?: Record<string, any>;
}

export interface ChatResponse {
    message: string;
    conversation_id: string;
    timestamp: string;
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
    status: 'excellent' | 'good' | 'fair' | 'poor';
    factors: {
        work_intensity: number;
        collaboration_stress: number;
        work_life_balance: number;
        skill_utilization: number;
        growth_opportunity: number;
    };
    recommendations: string[];
}

export interface WeeklyReport {
    period: string;
    total_hours: number;
    days_active: number;
    avg_focus_score: number;
    breakdown: {
        deep_work: number;
        meetings: number;
        research: number;
        admin: number;
        other: number;
    };
    trends: {
        deep_work_change: number;
        meeting_change: number;
        focus_change: number;
    };
}

/**
 * Chat API service for backend-powered AI chat
 */
class ChatAPIService {
    private client = getAPIClient();
    private isBackendAvailable = false;

    /**
     * Check if backend is available
     */
    async checkBackend(): Promise<boolean> {
        try {
            this.isBackendAvailable = await this.client.checkHealth();
            return this.isBackendAvailable;
        } catch (error) {
            this.isBackendAvailable = false;
            return false;
        }
    }

    /**
     * Send message to AI and get data-aware response
     */
    async sendMessage(
        message: string,
        conversationId?: string,
        context?: Record<string, any>
    ): Promise<ChatResponse> {
        try {
            const request: ChatRequest = {
                message,
                conversation_id: conversationId,
                context,
            };

            return await this.client.post<ChatResponse>('/api/ai/chat', request);
        } catch (error) {
            throw this.handleError('Failed to send message', error);
        }
    }

    /**
     * Get conversation history
     */
    async getConversation(conversationId: string): Promise<{ conversation_id: string; messages: ChatMessage[] }> {
        try {
            return await this.client.get(`/api/ai/conversations/${conversationId}`);
        } catch (error) {
            throw this.handleError('Failed to fetch conversation', error);
        }
    }

    /**
     * Get all conversations
     */
    async getAllConversations(): Promise<Array<{ conversation_id: string; messages: ChatMessage[] }>> {
        try {
            return await this.client.get('/api/ai/conversations');
        } catch (error) {
            throw this.handleError('Failed to fetch conversations', error);
        }
    }

    /**
     * Get user's focus score
     */
    async getFocusScore(): Promise<FocusScore> {
        try {
            return await this.client.get<FocusScore>('/api/ai/analytics/focus-score');
        } catch (error) {
            throw this.handleError('Failed to fetch focus score', error);
        }
    }

    /**
     * Get user's wellness score
     */
    async getWellnessScore(): Promise<WellnessScore> {
        try {
            return await this.client.get<WellnessScore>('/api/ai/analytics/wellness');
        } catch (error) {
            throw this.handleError('Failed to fetch wellness score', error);
        }
    }

    /**
     * Generate weekly report
     */
    async generateWeeklyReport(): Promise<WeeklyReport> {
        try {
            return await this.client.post<WeeklyReport>('/api/ai/reports/weekly');
        } catch (error) {
            throw this.handleError('Failed to generate weekly report', error);
        }
    }

    /**
     * Get data-aware response for a quick prompt
     */
    async getQuickPromptResponse(promptId: string): Promise<string> {
        try {
            const prompts: Record<string, () => Promise<string>> = {
                daily_summary: async () => {
                    const report = await this.generateWeeklyReport();
                    return `📊 Today's Summary:\n\nTotal Hours: ${report.total_hours}h\nFocus Score: ${report.avg_focus_score}/10\nDeep Work: ${report.breakdown.deep_work}h\nMeetings: ${report.breakdown.meetings}h`;
                },

                productivity_tips: async () => {
                    const focus = await this.getFocusScore();
                    return `⚡ Productivity Tips:\n\nCurrent focus score: ${focus.score}/10 (${focus.trend})\nYou've had ${focus.deep_work_hours}h of deep work.\n\nTip: Schedule important tasks during your peak hours!`;
                },

                wellness_check: async () => {
                    const wellness = await this.getWellnessScore();
                    return `💚 Wellness Check:\n\nScore: ${wellness.score}/100 (${wellness.status.toUpperCase()})\n\nRecommendations:\n${wellness.recommendations.map(r => `• ${r}`).join('\n')}`;
                },

                focus_analysis: async () => {
                    const focus = await this.getFocusScore();
                    return `🎯 Focus Analysis:\n\nScore: ${focus.score}/10\nTrend: ${focus.trend === 'up' ? '📈 Improving' : focus.trend === 'down' ? '📉 Declining' : '➡️ Stable'}\nChange: ${focus.change > 0 ? '+' : ''}${focus.change}\nDeep Work: ${focus.deep_work_hours}h today`;
                },
            };

            const handler = prompts[promptId];
            if (handler) {
                return await handler();
            }

            // Fall back to generic message
            const response = await this.sendMessage(`Quick prompt: ${promptId}`);
            return response.message;
        } catch (error) {
            throw this.handleError('Failed to get quick prompt response', error);
        }
    }

    /**
     * Check if backend chat is available and configured
     */
    isAvailable(): boolean {
        return this.isBackendAvailable;
    }

    /**
     * Handle errors
     */
    private handleError(message: string, error: any): Error {
        const apiError = error as APIError;
        const errorMessage = apiError?.message || message;
        console.error(message, error);
        return new Error(errorMessage);
    }
}

// Singleton instance
let chatAPIInstance: ChatAPIService | null = null;

/**
 * Get chat API service singleton
 */
export function getChatAPI(): ChatAPIService {
    if (!chatAPIInstance) {
        chatAPIInstance = new ChatAPIService();
    }
    return chatAPIInstance;
}

export default getChatAPI;
