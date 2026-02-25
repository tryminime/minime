import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Paperclip, X, Minimize2, Bot, User as UserIcon, BarChart, FileText, Settings as SettingsIcon, TrendingUp } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: { label: string; onClick: () => void }[];
}

interface AIChatAssistantProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const AIChatAssistant: React.FC<AIChatAssistantProps> = ({ isOpen = true, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm MiniMe AI. How can I help you today?",
            timestamp: new Date(),
            actions: [
                { label: '📊 View Summary', onClick: () => handleQuickAction('summary') },
                { label: '📈 Show Insights', onClick: () => handleQuickAction('insights') },
                { label: '📋 Generate Report', onClick: () => handleQuickAction('report') },
            ],
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleQuickAction = (action: string) => {
        const actionMessages: { [key: string]: string } = {
            summary: "What's my focus score?",
            insights: "Show my productivity insights",
            report: "Generate weekly report",
        };
        handleSendMessage(actionMessages[action]);
    };

    const handleSendMessage = async (text?: string) => {
        const messageText = text || inputValue.trim();
        if (!messageText) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Call real backend AI chat endpoint
            const { getAPIClient } = await import('../services/api');
            const api = getAPIClient();
            const response = await api.post<{ response?: string; message?: string }>('/api/ai/chat', {
                message: messageText,
            });

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.response || response.message || 'No response received.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error: any) {
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Sorry, I couldn't process your request. ${error?.message || 'Backend may be unavailable.'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMessage]);
        } finally {
            setIsTyping(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed right-6 bottom-6 w-96 h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-navy-600 to-teal-600 text-white rounded-t-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-semibold">MiniMe AI Assistant</h2>
                        <div className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            <span>Online</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title="Minimize"
                    >
                        <Minimize2 className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                            ? 'bg-navy-600 text-white'
                            : 'bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400'
                            }`}>
                            {message.role === 'user' ? <UserIcon className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                        </div>

                        {/* Message Content */}
                        <div className={`flex-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                            <div
                                className={`inline-block px-4 py-2 rounded-lg max-w-[80%] ${message.role === 'user'
                                    ? 'bg-navy-600 text-white rounded-br-none'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>

                            {/* Quick Actions */}
                            {message.actions && message.actions.length > 0 && (
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    {message.actions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={action.onClick}
                                            className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg rounded-bl-none">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestions (if no messages yet) */}
            {messages.length === 1 && (
                <div className="px-4 pb-2">
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { icon: BarChart, text: 'Daily Summary', action: () => handleQuickAction('summary') },
                            { icon: FileText, text: 'Generate Report', action: () => handleQuickAction('report') },
                            { icon: TrendingUp, text: 'Show Insights', action: () => handleQuickAction('insights') },
                            { icon: SettingsIcon, text: 'Settings Help', action: () => handleSendMessage('How do I change settings?') },
                        ].map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={idx}
                                    onClick={item.action}
                                    className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                >
                                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    <span className="text-gray-700 dark:text-gray-300">{item.text}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-navy-600 focus:border-transparent outline-none"
                    />
                    <button
                        onClick={() => handleSendMessage()}
                        disabled={!inputValue.trim()}
                        className="p-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex gap-2 mt-2">
                    <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                        <Paperclip className="w-4 h-4" />
                        Attach
                    </button>
                    <button className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                        <Mic className="w-4 h-4" />
                        Voice
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatAssistant;
