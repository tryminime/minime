import { ChatMessage } from '../types/chat';

const OLLAMA_API_URL = 'http://localhost:11434';

interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    context?: number[];
}

interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
}

export class OllamaService {
    private model: string;
    private context: number[] = [];

    constructor(model: string = 'llama2') {
        this.model = model;
    }

    async checkHealth(): Promise<boolean> {
        try {
            const response = await fetch(`${OLLAMA_API_URL}/api/tags`);
            return response.ok;
        } catch (error) {
            console.error('Ollama health check failed:', error);
            return false;
        }
    }

    async generateResponse(
        messages: ChatMessage[],
        onStream?: (chunk: string) => void
    ): Promise<string> {
        try {
            // Build prompt from message history
            const prompt = this.buildPrompt(messages);

            if (onStream) {
                return await this.streamResponse(prompt, onStream);
            } else {
                return await this.generateNonStreaming(prompt);
            }
        } catch (error) {
            console.error('Ollama generation failed:', error);
            throw new Error('Failed to generate response. Make sure Ollama is running.');
        }
    }

    private buildPrompt(messages: ChatMessage[]): string {
        // Build a conversational prompt from message history
        let prompt = 'You are MiniMe AI, a helpful research assistant for PhD students and researchers. You help analyze activities, provide insights, and answer questions about their research progress.\n\n';

        // Add conversation history
        messages.forEach((msg) => {
            if (msg.role === 'user') {
                prompt += `User: ${msg.content}\n`;
            } else if (msg.role === 'assistant') {
                prompt += `Assistant: ${msg.content}\n`;
            }
        });

        // Add final prompt for assistant response
        prompt += 'Assistant: ';

        return prompt;
    }

    private async generateNonStreaming(prompt: string): Promise<string> {
        const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: false,
                context: this.context,
            } as OllamaGenerateRequest),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data: OllamaGenerateResponse = await response.json();

        // Save context for conversation continuity
        if (data.context) {
            this.context = data.context;
        }

        return data.response;
    }

    private async streamResponse(
        prompt: string,
        onStream: (chunk: string) => void
    ): Promise<string> {
        const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.model,
                prompt,
                stream: true,
                context: this.context,
            } as OllamaGenerateRequest),
        });

        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter((line) => line.trim());

            for (const line of lines) {
                try {
                    const data: OllamaGenerateResponse = JSON.parse(line);
                    if (data.response) {
                        fullResponse += data.response;
                        onStream(data.response);
                    }
                    if (data.done && data.context) {
                        this.context = data.context;
                    }
                } catch (error) {
                    console.error('Failed to parse streaming response:', error);
                }
            }
        }

        return fullResponse;
    }

    resetContext() {
        this.context = [];
    }

    setModel(model: string) {
        this.model = model;
        this.resetContext();
    }
}

// Singleton instance
let ollamaService: OllamaService | null = null;

export function getOllamaService(): OllamaService {
    if (!ollamaService) {
        // Get model from settings (default to llama2)
        const settings = localStorage.getItem('minime_settings');
        let model = 'llama2';

        if (settings) {
            try {
                const parsed = JSON.parse(settings);
                // Assuming we have OLLAMA_MODEL in settings
                model = parsed.ollamaModel || 'llama2';
            } catch (error) {
                console.error('Failed to parse settings:', error);
            }
        }

        ollamaService = new OllamaService(model);
    }
    return ollamaService;
}
