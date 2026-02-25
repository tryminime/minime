/**
 * Helper function to send message using either backend or Ollama
 */
import { getChatAPI } from '../services/chatAPI';
import { getOllamaService } from '../services/ollama';
import { ChatMessage } from '../types/chat';

export async function sendChatMessage(
    userMessage: string,
    conversationId: string | undefined,
    useBackend: boolean,
    backendAvailable: boolean,
    allMessages: ChatMessage[],
    onStreamChunk?: (chunk: string) => void
): Promise<string> {
    if (useBackend && backendAvailable) {
        // Use backend API
        const chatAPI = getChatAPI();
        const response = await chatAPI.sendMessage(userMessage, conversationId);
        return response.message;
    } else {
        // Use Ollama
        const service = getOllamaService();
        let fullResponse = '';

        const response = await service.generateResponse(allMessages, (chunk) => {
            fullResponse += chunk;
            if (onStreamChunk) {
                onStreamChunk(fullResponse);
            }
        });

        return response;
    }
}
