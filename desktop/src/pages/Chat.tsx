import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Trash2, Server, Cpu } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';
import { getOllamaService } from '../services/ollama';
import { getChatAPI } from '../services/chatAPI';
import { QuickPrompt } from '../types/chat';

const QUICK_PROMPTS: QuickPrompt[] = [
    {
        id: 'daily_summary',
        label: 'Daily Summary',
        prompt: 'Give me a summary of my research activity today',
        icon: '📊',
        category: 'insights',
    },
    {
        id: 'productivity_tips',
        label: 'Productivity Tips',
        prompt: 'Based on my recent activity, what can I do to be more productive?',
        icon: '⚡',
        category: 'productivity',
    },
    {
        id: 'research_progress',
        label: 'Research Progress',
        prompt: 'How is my research progressing this week?',
        icon: '📈',
        category: 'research',
    },
    {
        id: 'focus_analysis',
        label: 'Focus Analysis',
        prompt: 'Analyze my focus patterns and suggest improvements',
        icon: '🎯',
        category: 'productivity',
    },
    {
        id: 'paper_status',
        label: 'Paper Status',
        prompt: 'What\'s the status of my current papers?',
        icon: '📄',
        category: 'research',
    },
    {
        id: 'wellness_check',
        label: 'Wellness Check',
        prompt: 'Am I at risk of burnout? Check my work-life balance',
        icon: '💚',
        category: 'wellness',
    },
];

export default function Chat() {
    const {
        activeConversation,
        createConversation,
        addMessage,
        updateMessage,
        clearConversation,
        useBackendChat,
        setUseBackendChat,
        backendAvailable,
    } = useChat();

    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Check Ollama availability on mount
    useEffect(() => {
        const checkOllama = async () => {
            const service = getOllamaService();
            const available = await service.checkHealth();
            setOllamaAvailable(available);
        };
        checkOllama();
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeConversation?.messages]);

    // Create initial conversation if none exists
    useEffect(() => {
        if (!activeConversation) {
            createConversation();
        }
    }, [activeConversation, createConversation]);

    const handleSendMessage = async () => {
        if (!input.trim() || isGenerating) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        addMessage({
            role: 'user',
            content: userMessage,
        });

        // Generate AI response
        setIsGenerating(true);

        try {
            // Create placeholder for streaming and get its ID
            const assistantMessageId = addMessage({
                role: 'assistant',
                content: '',
                isStreaming: true,
            });

            // Prepare message history
            const allMessages = [
                ...(activeConversation?.messages || []),
                {
                    id: 'temp',
                    role: 'user' as const,
                    content: userMessage,
                    timestamp: new Date(),
                },
            ];

            // Use backend OR Ollama depending on settings
            if (useBackendChat && backendAvailable) {
                // BACKEND: Data-aware AI
                const chatAPI = getChatAPI();
                const response = await chatAPI.sendMessage(userMessage, activeConversation?.id);

                updateMessage(assistantMessageId, {
                    content: response.message,
                    isStreaming: false,
                });
            } else {
                // OLLAMA: Local AI with streaming
                const service = getOllamaService();
                let fullResponse = '';

                const response = await service.generateResponse(allMessages, (chunk) => {
                    fullResponse += chunk;
                    updateMessage(assistantMessageId, {
                        content: fullResponse,
                        isStreaming: true,
                    });
                });

                updateMessage(assistantMessageId, {
                    content: response,
                    isStreaming: false,
                });
            }
        } catch (error) {
            console.error('Failed to generate response:', error);
            const serviceName = useBackendChat && backendAvailable ? 'Backend' : 'Ollama';
            const troubleshoot = useBackendChat && backendAvailable
                ? 'Please check that the backend is running on http://localhost:8000'
                : 'Please make sure Ollama is running with: `ollama serve`';

            addMessage({
                role: 'assistant',
                content: `❌ Sorry, I encountered an error with ${serviceName}. ${troubleshoot}`,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleQuickPrompt = (prompt: QuickPrompt) => {
        setInput(prompt.prompt);
        inputRef.current?.focus();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleClearChat = () => {
        if (window.confirm('Are you sure you want to clear this conversation?')) {
            clearConversation();
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                                AI Chat Assistant
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {useBackendChat ? (
                                    backendAvailable ? (
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            Backend AI connected (data-aware)
                                        </span>
                                    ) : (
                                        <span className="text-amber-500">
                                            ⚠️ Backend unavailable - Using Ollama
                                        </span>
                                    )
                                ) : ollamaAvailable === null ? (
                                    'Checking Ollama...'
                                ) : ollamaAvailable ? (
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        Ollama connected (local)
                                    </span>
                                ) : (
                                    <span className="text-red-500">
                                        ⚠️ Ollama not running. Start it with: ollama serve
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Backend/Ollama Toggle Button */}
                        <button
                            onClick={() => setUseBackendChat(!useBackendChat)}
                            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${useBackendChat
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-2 border-blue-300 dark:border-blue-600'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600'
                                } hover:opacity-80`}
                            title={`Using: ${useBackendChat ? 'Backend AI (data-aware responses)' : 'Ollama (local LLM)'}`}
                        >
                            {useBackendChat ? (
                                <>
                                    <Server className="w-4 h-4" />
                                    <span className="font-semibold">Backend</span>
                                </>
                            ) : (
                                <>
                                    <Cpu className="w-4 h-4" />
                                    <span className="font-semibold">Ollama</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleClearChat}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                            Clear Chat
                        </button>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {!activeConversation?.messages.length ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                        <Sparkles className="w-16 h-16 text-blue-600 dark:text-blue-400 mb-4" />
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                            Welcome to AI Chat
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
                            Ask questions about your research, get productivity insights, or chat about
                            anything!
                        </p>

                        {/* Quick Prompts */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt.id}
                                    onClick={() => handleQuickPrompt(prompt)}
                                    className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors text-left group"
                                >
                                    <div className="text-2xl mb-2">{prompt.icon}</div>
                                    <div className="font-medium text-gray-900 dark:text-white mb-1">
                                        {prompt.label}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {prompt.prompt}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {activeConversation.messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                )}
                                <div
                                    className={`px-4 py-3 rounded-lg max-w-2xl ${message.role === 'user'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap break-words">
                                        {message.content}
                                        {message.isStreaming && (
                                            <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Ask me anything..."
                            disabled={isGenerating}
                            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                            rows={1}
                            style={{ minHeight: '48px', maxHeight: '200px' }}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isGenerating}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send
                                </>
                            )}
                        </button>
                    </div>

                    {/* Status indicator for which AI is active */}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                        {useBackendChat && backendAvailable && (
                            <span className="text-blue-600 dark:text-blue-400">
                                🌐 Using Backend AI - Data-aware responses with your actual activity data
                            </span>
                        )}
                        {useBackendChat && !backendAvailable && (
                            <span className="text-amber-600 dark:text-amber-400">
                                ⚠️ Backend unavailable - Falling back to Ollama (generic responses)
                            </span>
                        )}
                        {!useBackendChat && ollamaAvailable && (
                            <span className="text-gray-600 dark:text-gray-400">
                                💻 Using Ollama - Local AI with generic responses
                            </span>
                        )}
                        {!useBackendChat && !ollamaAvailable && (
                            <span className="text-red-600 dark:text-red-400">
                                ❌ Ollama not running - Please start with: ollama serve
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
