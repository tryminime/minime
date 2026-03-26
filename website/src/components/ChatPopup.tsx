'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import {
    MessageSquare, X, Send, Loader2, Bot, User, Minimize2,
    Sparkles, BookOpen, ChevronDown, ExternalLink, RefreshCw,
} from 'lucide-react';
import { parseSSEChunk, Citation } from '@/lib/hooks/useAIChat';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────

interface PopupMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    streaming?: boolean;
    citations?: Citation[];
}

// ── Citation list (compact) ───────────────────────────────────────────────

function MiniCitationList({ citations }: { citations: Citation[] }) {
    const [open, setOpen] = useState(false);
    if (!citations.length) return null;
    return (
        <div className="mt-1">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-700 transition-colors"
            >
                <BookOpen className="w-2.5 h-2.5" />
                {citations.length} source{citations.length > 1 ? 's' : ''}
                <ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="mt-1 space-y-1">
                    {citations.map((c, i) => (
                        <div key={i} className="text-[10px] bg-indigo-50 rounded px-2 py-1">
                            <span className="font-medium text-indigo-700">[{i + 1}]</span> {c.source}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Suggested quick prompts ───────────────────────────────────────────────

const QUICK_PROMPTS = [
    'Summarize my activity today',
    'What documents do I have?',
    'How is my focus trending?',
];

// ── Main ChatPopup Component ──────────────────────────────────────────────

export function ChatPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<PopupMessage[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [unread, setUnread] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when popup opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            setUnread(0);
        }
    }, [isOpen]);

    // Restore conversation ID from session
    useEffect(() => {
        const storedId = sessionStorage.getItem('minime_popup_conv_id');
        if (storedId) setConversationId(storedId);
    }, []);

    // Welcome message on first open
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: 'Hi! I\'m your MiniMe AI assistant. Ask me about your activities, documents, or productivity insights.',
                timestamp: new Date(),
            }]);
        }
    }, [isOpen, messages.length]);

    const handleSubmit = async (e?: FormEvent | string) => {
        if (e && typeof e !== 'string' && 'preventDefault' in e) e.preventDefault();
        const text = typeof e === 'string' ? e : input.trim();
        if (!text || isStreaming) return;
        if (typeof e !== 'string') setInput('');

        const userMsg: PopupMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);

        const assistantId = `msg-${Date.now() + 1}`;
        setMessages(prev => [
            ...prev,
            { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), streaming: true },
        ]);

        try {
            const token = localStorage.getItem('minime_auth_token') || '';
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            
            const controller = new AbortController();
            const fetchTimeout = setTimeout(() => controller.abort(), 60000); // 60s max response time without chunks

            const resp = await fetch(`${apiBase}/api/v1/ai/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    message: text,
                    conversation_id: conversationId ?? undefined,
                    use_rag: true,
                    stream: true,
                }),
                signal: controller.signal,
            });
            clearTimeout(fetchTimeout);

            if (resp.ok) {
                const reader = resp.body?.getReader();
                const decoder = new TextDecoder();
                let rawBuffer = '';
                let streamCitations: Citation[] = [];

                let readTimeout: ReturnType<typeof setTimeout> | undefined;
                const resetTimeout = () => {
                    clearTimeout(readTimeout);
                    readTimeout = setTimeout(() => {
                        reader?.cancel();
                        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + "\n\n[Connection timed out waiting for response]", streaming: false } : m));
                        setIsStreaming(false);
                    }, 30000); // 30s timeout per chunk
                };
                resetTimeout();

                while (reader) {
                    const { done, value } = await reader.read();
                    resetTimeout();
                    if (done) {
                        clearTimeout(readTimeout);
                        break;
                    }
                    rawBuffer += decoder.decode(value, { stream: true });

                    const { chunks, done: sseEnd, conversationId: cid, citations: sseCitations } = parseSSEChunk(rawBuffer);
                    if (cid && !conversationId) {
                        setConversationId(cid);
                        sessionStorage.setItem('minime_popup_conv_id', cid);
                    }
                    if (chunks.length > 0) {
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === assistantId ? { ...m, content: m.content + chunks.join('') } : m
                            )
                        );
                        const lastNL = rawBuffer.lastIndexOf('\n');
                        rawBuffer = lastNL >= 0 ? rawBuffer.slice(lastNL + 1) : rawBuffer;
                    }
                    if (sseCitations && sseCitations.length > 0) {
                        streamCitations = sseCitations;
                    }
                    if (sseEnd) {
                        clearTimeout(readTimeout);
                        break;
                    }
                }

                setMessages(prev =>
                    prev.map(m => m.id === assistantId ? { ...m, streaming: false, citations: streamCitations } : m)
                );
            } else {
                const errMsg = resp.status === 403
                    ? 'Not authenticated. Please log in first.'
                    : `Error (HTTP ${resp.status})`;
                setMessages(prev =>
                    prev.map(m => m.id === assistantId ? { ...m, content: errMsg, streaming: false } : m)
                );
            }
        } catch (err) {
            const msg = err instanceof Error ? (err.name === 'AbortError' ? 'Request timed out' : err.message) : String(err);
            setMessages(prev =>
                prev.map(m => m.id === assistantId ? { ...m, content: `Connection error: ${msg}`, streaming: false } : m)
            );
        }

        setIsStreaming(false);
        if (!isOpen) setUnread(prev => prev + 1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center group"
                aria-label="Open AI Chat"
                id="chat-popup-fab"
            >
                <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                        {unread}
                    </span>
                )}
                {/* Pulse animation ring */}
                <span className="absolute inset-0 rounded-full bg-indigo-400 animate-ping opacity-20" />
            </button>
        );
    }

    return (
        <div
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">MiniMe AI</h3>
                        <p className="text-[10px] text-white/70">
                            {isStreaming ? 'Thinking...' : 'Ask about activities & documents'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <Link
                        href="/dashboard/chat"
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Open full chat"
                        title="Open full chat"
                    >
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                        onClick={() => {
                            setMessages([]);
                            setConversationId(null);
                            sessionStorage.removeItem('minime_popup_conv_id');
                        }}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="New chat"
                        title="New chat"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Minimize"
                    >
                        <Minimize2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gray-50">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-indigo-600 mt-0.5">
                                <Bot className="w-3 h-3 text-white" />
                            </div>
                        )}
                        <div className="max-w-[80%]">
                            <div
                                className="px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap"
                                style={{
                                    background: msg.role === 'user' ? '#4f46e5' : '#fff',
                                    color: msg.role === 'user' ? '#fff' : '#111827',
                                    border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                }}
                            >
                                {msg.content || (
                                    <span className="flex items-center gap-1.5 text-gray-400">
                                        <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                                    </span>
                                )}
                            </div>
                            {msg.role === 'assistant' && msg.citations && msg.citations.length > 0 && !msg.streaming && (
                                <MiniCitationList citations={msg.citations} />
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-200 mt-0.5">
                                <User className="w-3 h-3 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Quick prompts — only before first user message */}
                {messages.length <= 1 && !isStreaming && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                        {QUICK_PROMPTS.map(prompt => (
                            <button
                                key={prompt}
                                onClick={() => handleSubmit(prompt)}
                                className="text-[10px] px-2.5 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-2.5 bg-white border-t border-gray-200">
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything..."
                        rows={1}
                        className="flex-1 resize-none px-3 py-2 text-xs rounded-lg outline-none border border-gray-200 bg-gray-50 text-gray-900 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all"
                        style={{ maxHeight: '80px' }}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isStreaming}
                        className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                    >
                        {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </form>
                <p className="text-[9px] mt-1 text-center text-gray-400">
                    AI-powered · Activities & Knowledge Base
                </p>
            </div>
        </div>
    );
}
