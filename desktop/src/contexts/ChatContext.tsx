import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Conversation, ChatMessage } from '../types/chat';
import { getChatAPI } from '../services/chatAPI';

interface ChatContextType {
    conversations: Conversation[];
    activeConversationId: string | null;
    activeConversation: Conversation | null;
    createConversation: () => string;
    deleteConversation: (id: string) => void;
    setActiveConversation: (id: string) => void;
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
    updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
    clearConversation: () => void;
    isLoading: boolean;
    // Backend integration
    useBackendChat: boolean;
    setUseBackendChat: (use: boolean) => void;
    backendAvailable: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Backend chat integration
    const chatAPI = getChatAPI();
    const [useBackendChat, setUseBackendChat] = useState(
        import.meta.env.VITE_USE_BACKEND_CHAT === 'true'
    );
    const [backendAvailable, setBackendAvailable] = useState(false);

    // Check backend availability on mount
    useEffect(() => {
        const checkBackend = async () => {
            const available = await chatAPI.checkBackend();
            setBackendAvailable(available);

            if (available) {
                console.log('✅ Backend chat available');
            } else {
                console.log('⚠️ Backend chat unavailable - Ollama can be used instead');
            }
        };
        checkBackend();
    }, []);

    // Load conversations from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('minime_conversations');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Convert date strings back to Date objects
                const conversationsWithDates = parsed.map((conv: any) => ({
                    ...conv,
                    createdAt: new Date(conv.createdAt),
                    updatedAt: new Date(conv.updatedAt),
                    messages: conv.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp),
                    })),
                }));
                setConversations(conversationsWithDates);
            } catch (error) {
                console.error('Failed to load conversations:', error);
            }
        }
    }, []);

    // Save conversations to localStorage
    useEffect(() => {
        if (conversations.length > 0) {
            localStorage.setItem('minime_conversations', JSON.stringify(conversations));
        }
    }, [conversations]);

    const createConversation = (): string => {
        const newConv: Conversation = {
            id: `conv_${Date.now()}`,
            title: 'New Conversation',
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setConversations([newConv, ...conversations]);
        setActiveConversationId(newConv.id);
        return newConv.id;
    };

    const deleteConversation = (id: string) => {
        setConversations(conversations.filter((c) => c.id !== id));
        if (activeConversationId === id) {
            setActiveConversationId(null);
        }
    };

    const setActiveConversation = (id: string) => {
        setActiveConversationId(id);
    };

    const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>): string => {
        if (!activeConversationId) {
            const newId = createConversation();
            setActiveConversationId(newId);
        }

        const newMessage: ChatMessage = {
            ...message,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
        };

        setConversations((prevConversations) =>
            prevConversations.map((conv) => {
                if (conv.id === activeConversationId) {
                    const updatedMessages = [...conv.messages, newMessage];
                    // Auto-generate title from first user message
                    const title =
                        conv.messages.length === 0 && message.role === 'user'
                            ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                            : conv.title;

                    return {
                        ...conv,
                        messages: updatedMessages,
                        title,
                        updatedAt: new Date(),
                    };
                }
                return conv;
            })
        );

        return newMessage.id;
    };

    const updateMessage = (messageId: string, updates: Partial<ChatMessage>) => {
        setConversations((prevConversations) =>
            prevConversations.map((conv) => {
                if (conv.id === activeConversationId) {
                    return {
                        ...conv,
                        messages: conv.messages.map((msg) =>
                            msg.id === messageId ? { ...msg, ...updates } : msg
                        ),
                        updatedAt: new Date(),
                    };
                }
                return conv;
            })
        );
    };

    const clearConversation = () => {
        if (activeConversationId) {
            setConversations((prevConversations) =>
                prevConversations.map((conv) =>
                    conv.id === activeConversationId
                        ? { ...conv, messages: [], updatedAt: new Date() }
                        : conv
                )
            );
        }
    };

    const activeConversation =
        conversations.find((c) => c.id === activeConversationId) || null;

    return (
        <ChatContext.Provider
            value={{
                conversations,
                activeConversationId,
                activeConversation,
                createConversation,
                deleteConversation,
                setActiveConversation,
                addMessage,
                updateMessage,
                clearConversation,
                isLoading,
                useBackendChat,
                setUseBackendChat,
                backendAvailable,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within ChatProvider');
    }
    return context;
}
