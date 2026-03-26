'use client';

import { useState, useRef, useEffect, FormEvent, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    Send, Bot, User, Loader2, Sparkles, RefreshCw, Copy, Check,
    Plus, Trash2, MessageSquare, Download, Search, X, ChevronDown,
    Cpu, Zap, BookOpen, Puzzle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
    useConversations, useConversation, useDeleteConversation,
    useExportConversation, useModelInfo, useAISearch, parseSSEChunk,
    useProactiveInsights, useMilestones,
    ConversationSummary, Citation, ProactiveInsight, Milestone,
} from '@/lib/hooks/useAIChat';
import { Trophy, Lightbulb, ChevronRight, Award } from 'lucide-react';
import { getAPIClient } from '@/lib/api';
import { VoiceInputButton, SpeakButton, PluginGallery } from '@/components/FeaturePanels';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LocalMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    streaming?: boolean;
    citations?: Citation[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ModelBadge() {
    const { data: model } = useModelInfo();
    if (!model) return null;
    const providerColors: Record<string, string> = {
        ollama: 'bg-emerald-100 text-emerald-700',
        openai: 'bg-blue-100 text-blue-700',
        demo: 'bg-gray-100 text-gray-600',
    };
    const icons: Record<string, React.ReactNode> = {
        ollama: <Cpu className="w-3 h-3" />,
        openai: <Zap className="w-3 h-3" />,
        demo: <BookOpen className="w-3 h-3" />,
    };
    return (
        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${providerColors[model.provider] ?? 'bg-gray-100 text-gray-600'}`}>
            {icons[model.provider]}
            {model.model} ({model.provider})
        </span>
    );
}

function CitationList({ citations }: { citations: Citation[] }) {
    const [open, setOpen] = useState(false);
    if (!citations.length) return null;
    return (
        <div className="mt-2">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
            >
                <BookOpen className="w-3 h-3" />
                {citations.length} source{citations.length > 1 ? 's' : ''}
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div className="mt-1.5 space-y-1.5">
                    {citations.map((c, i) => (
                        <div key={i} className="text-xs bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                            <p className="font-semibold text-indigo-700">[{i + 1}] {c.source}</p>
                            {c.excerpt && <p className="text-gray-600 mt-0.5 line-clamp-2">{c.excerpt}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ConversationItem({
    conv, isActive, onClick, onDelete,
}: {
    conv: ConversationSummary;
    isActive: boolean;
    onClick: () => void;
    onDelete: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`group w-full text-left px-3 py-2.5 rounded-lg transition-all flex items-start justify-between gap-2 ${isActive ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'
                }`}
        >
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>
                    {conv.title || 'New Chat'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{conv.message_count} messages</p>
            </div>
            <div
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onDelete(); } }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all shrink-0 cursor-pointer"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </div>
        </button>
    );
}

const SUGGESTED_PROMPTS = [
    'What are my peak productive hours?',
    'Summarize my activity this week',
    'Which skills am I building most?',
    'How is my focus score trending?',
];

// ── Insights Banner ───────────────────────────────────────────────────────────

function InsightsBanner() {
    const { data } = useProactiveInsights();
    const [expanded, setExpanded] = useState(false);
    const insights = data?.insights ?? [];
    if (!insights.length) return null;

    const severityColors: Record<string, string> = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        alert: 'bg-red-50 border-red-200 text-red-800',
    };

    return (
        <div className="border-b border-gray-100 bg-white">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center gap-2 px-5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
                <Lightbulb className="w-3.5 h-3.5 text-blue-500" />
                <span>{insights.length} Insight{insights.length > 1 ? 's' : ''} available</span>
                <ChevronDown className={`w-3 h-3 ml-auto text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="px-4 pb-3 space-y-2">
                    {insights.slice(0, 5).map(insight => (
                        <div
                            key={insight.id}
                            className={`flex items-start gap-2 px-3 py-2 rounded-lg border text-xs ${severityColors[insight.dismissed ? 'info' : (insight.priority > 0.7 ? 'warning' : 'info')]}`}
                        >
                            <span className="text-base flex-shrink-0">{insight.category_icon}</span>
                            <div className="min-w-0">
                                <p className="font-semibold">{insight.title}</p>
                                <p className="opacity-80 mt-0.5 line-clamp-2">{insight.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Milestones Banner ─────────────────────────────────────────────────────────

function MilestonesBanner() {
    const { data } = useMilestones();
    const [expanded, setExpanded] = useState(false);
    const unlocked = data?.unlocked ?? [];
    const all = data?.milestones ?? [];
    if (!all.length) return null;

    return (
        <div className="border-b border-gray-100 bg-white">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center gap-2 px-5 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>{unlocked.length}/{all.length} Milestones Unlocked</span>
                <ChevronDown className={`w-3 h-3 ml-auto text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            {expanded && (
                <div className="px-4 pb-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {all.map(m => (
                            <div
                                key={m.id}
                                className={`flex-shrink-0 w-44 px-3 py-2 rounded-lg border text-xs ${
                                    m.unlocked
                                        ? 'bg-amber-50 border-amber-200'
                                        : 'bg-gray-50 border-gray-200 opacity-60'
                                }`}
                            >
                                <div className="flex items-center gap-1.5">
                                    <span className="text-base">{m.emoji}</span>
                                    <span className={`font-semibold truncate ${m.unlocked ? 'text-amber-800' : 'text-gray-600'}`}>
                                        {m.title}
                                    </span>
                                </div>
                                <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            m.unlocked ? 'bg-amber-500' : 'bg-gray-400'
                                        }`}
                                        style={{ width: `${Math.min(m.progress, 100)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] mt-1 text-gray-500">
                                    {m.current_value}/{m.threshold} ({m.progress.toFixed(0)}%)
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Search Panel ──────────────────────────────────────────────────────────────

function SearchPanel({ onClose }: { onClose: () => void }) {
    const [query, setQuery] = useState('');
    const { data, isLoading } = useAISearch(query);

    return (
        <div className="absolute inset-0 z-10 flex flex-col bg-white rounded-xl border border-gray-200 shadow-xl">
            <div className="flex items-center gap-2 p-4 border-b border-gray-100">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search across your knowledge base..."
                    className="flex-1 text-sm outline-none text-gray-900"
                />
                <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
                {isLoading && (
                    <div className="flex items-center justify-center py-8 text-gray-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Searching...
                    </div>
                )}
                {data?.results.map((r, i) => (
                    <div key={i} className="p-3 mb-2 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-sm text-gray-800">{r.content}</p>
                        {r.source && <p className="text-xs text-gray-400 mt-1">{r.source}</p>}
                    </div>
                ))}
                {data && data.results.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No results found. Try a different query.</p>
                )}
                {!query && !isLoading && (
                    <p className="text-sm text-gray-400 text-center py-8">Type at least 3 characters to search.</p>
                )}
            </div>
        </div>
    );
}

// ── Main Chat Component ───────────────────────────────────────────────────────

function ChatPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    const [conversationId, setConversationId] = useState<string | null>(
        searchParams.get('id')
    );
    const [messages, setMessages] = useState<LocalMessage[]>([]);
    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const [showPlugins, setShowPlugins] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Hooks
    const { data: conversationsData, refetch: refetchConversations } = useConversations();
    const { data: activeConv } = useConversation(conversationId);
    const deleteConv = useDeleteConversation();
    const exportConv = useExportConversation();

    const conversations = conversationsData?.conversations ?? [];

    // Load conversation on select / URL change
    useEffect(() => {
        if (activeConv?.messages) {
            setMessages(
                activeConv.messages.map(m => ({
                    id: m.id ?? `msg-${Math.random()}`,
                    role: m.role,
                    content: m.content,
                    timestamp: new Date(m.timestamp),
                    citations: m.citations,
                }))
            );
        } else if (!conversationId) {
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: 'Hi! I\'m your MiniMe AI assistant. I can help you understand your activity patterns, insights, and productivity. What would you like to know?',
                timestamp: new Date(),
            }]);
        }
    }, [activeConv, conversationId]);

    // Pre-fill prompt from URL ?prompt= (e.g. "Ask AI about this" links)
    const promptParam = searchParams.get('prompt');
    const promptSubmittedRef = useRef(false);
    useEffect(() => {
        if (promptParam && !promptSubmittedRef.current && !isStreaming) {
            promptSubmittedRef.current = true;
            setInput(promptParam);
            // Optional: focus the input when pre-filled
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [promptParam]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll to bottom (container-only — avoids scrolling the whole page)
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages]);

    const startNewChat = () => {
        setConversationId(null);
        setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: 'Hi! I\'m your MiniMe AI assistant. Start a new conversation — ask me anything about your activity data.',
            timestamp: new Date(),
        }]);
        router.replace('/dashboard/chat');
    };

    const handleDeleteConversation = async (id: string) => {
        await deleteConv.mutateAsync(id);
        if (id === conversationId) startNewChat();
    };

    const handleExport = async () => {
        if (!conversationId) return;
        try {
            const result = await exportConv.mutateAsync({ conversationId, format: 'markdown' });
            const blob = new Blob([result.content ?? JSON.stringify(result)], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-${conversationId.slice(0, 8)}.md`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            // ignore
        }
    };

    const handleSubmit = async (e: FormEvent | React.MouseEvent | string) => {
        if (typeof e !== 'string') {
            if ('preventDefault' in e) (e as FormEvent).preventDefault();
        }
        const text = typeof e === 'string' ? e : input.trim();
        if (!text || isStreaming) return;
        if (typeof e !== 'string') setInput('');

        const userMessage: LocalMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: text,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsStreaming(true);

        const assistantId = `msg-${Date.now() + 1}`;
        setMessages(prev => [
            ...prev,
            { id: assistantId, role: 'assistant', content: '', timestamp: new Date(), streaming: true },
        ]);

        const api = getAPIClient();
        let newConvId = conversationId;

        try {
            // Get the auth token from the API client storage
            const token = localStorage.getItem('minime_auth_token') || '';
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

            const resp = await fetch(`${apiBase}/api/ai/chat/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    message: text,
                    conversation_id: conversationId ?? undefined,
                    use_rag: true,
                    stream: true,
                }),
            });

            if (resp.ok) {
                const reader = resp.body?.getReader();
                const decoder = new TextDecoder();
                let rawBuffer = '';
                let citations: Citation[] = [];

                while (reader) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    rawBuffer += decoder.decode(value, { stream: true });

                    // Parse SSE lines from the buffer
                    const { chunks, done: sseEnd, conversationId: cid, citations: sseCitations } = parseSSEChunk(rawBuffer);
                    if (cid && !newConvId) {
                        newConvId = cid;
                        setConversationId(cid);
                        router.replace(`/dashboard/chat?id=${cid}`, { scroll: false });
                    }
                    if (chunks.length > 0) {
                        setMessages(prev =>
                            prev.map(m =>
                                m.id === assistantId
                                    ? { ...m, content: m.content + chunks.join('') }
                                    : m
                            )
                        );
                        // Clear consumed lines from buffer (keep partial last line)
                        const lastNL = rawBuffer.lastIndexOf('\n');
                        rawBuffer = lastNL >= 0 ? rawBuffer.slice(lastNL + 1) : rawBuffer;
                    }
                    if (sseCitations && sseCitations.length > 0) {
                        citations = sseCitations;
                    }
                    if (sseEnd) break;
                }

                setMessages(prev =>
                    prev.map(m =>
                        m.id === assistantId ? { ...m, streaming: false, citations } : m
                    )
                );
            } else {
                // Real error from backend — show it, don't fake a response
                const errText = await resp.text().catch(() => '');
                let errMsg = `Chat request failed (HTTP ${resp.status})${resp.status === 403 ? ': Not authenticated. Please refresh the page.' : ''
                    }`;
                if (errText && resp.status !== 403) {
                    try { errMsg = JSON.parse(errText).detail || errMsg; } catch { /* ignore */ }
                }
                setMessages(prev => prev.map(m =>
                    m.id === assistantId ? { ...m, content: errMsg, streaming: false } : m
                ));
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: `Connection error: ${msg}`, streaming: false } : m
            ));
        }

        setIsStreaming(false);
        // Refresh conversation list
        refetchConversations();
        queryClient.invalidateQueries({ queryKey: ['ai-conversation', newConvId] });
        queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    };


    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as unknown as FormEvent);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
            {/* ── Left Sidebar: Conversation History ──────────────────── */}
            <aside className="w-60 flex-none border-r border-gray-200 bg-white flex flex-col overflow-hidden">
                <div className="flex-none p-3 border-b border-gray-100">
                    <button
                        onClick={startNewChat}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                            <p className="text-xs">No conversations yet</p>
                        </div>
                    ) : (
                        conversations.map(conv => (
                            <ConversationItem
                                key={conv.id}
                                conv={conv}
                                isActive={conv.id === conversationId}
                                onClick={() => {
                                    setConversationId(conv.id);
                                    router.replace(`/dashboard/chat?id=${conv.id}`, { scroll: false });
                                }}
                                onDelete={() => handleDeleteConversation(conv.id)}
                            />
                        ))
                    )}
                </div>
            </aside>

            {/* ── Main Chat Area ───────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Search overlay */}
                {showSearch && <SearchPanel onClose={() => setShowSearch(false)} />}

                {/* Header */}
                <div className="flex-none flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">MiniMe AI</h3>
                            <p className="text-xs text-gray-400">{isStreaming ? 'Thinking...' : 'Online'}</p>
                        </div>
                        <ModelBadge />
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowSearch(true)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Search knowledge base"
                        >
                            <Search className="w-4 h-4 text-gray-500" />
                        </button>
                        {conversationId && (
                            <button
                                onClick={handleExport}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Export conversation"
                            >
                                <Download className="w-4 h-4 text-gray-500" />
                            </button>
                        )}
                        <button
                            onClick={() => setShowPlugins(v => !v)}
                            className={`p-2 rounded-lg transition-colors ${showPlugins ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-500'}`}
                            title="AI Plugins"
                        >
                            <Puzzle className="w-4 h-4" />
                        </button>
                        <button
                            onClick={startNewChat}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="New conversation"
                        >
                            <RefreshCw className="w-4 h-4 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Insights & Milestones Banners */}
                <InsightsBanner />
                <MilestonesBanner />

                {/* Messages */}
                <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-6 bg-gray-50">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-indigo-600">
                                    <Bot className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div className="max-w-[75%] group relative">
                                <div
                                    className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                                    style={{
                                        background: msg.role === 'user' ? '#4f46e5' : '#fff',
                                        color: msg.role === 'user' ? '#fff' : '#111827',
                                        border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                                        borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    }}
                                >
                                    {msg.content || (
                                        <span className="flex items-center gap-2 text-gray-400">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
                                        </span>
                                    )}
                                </div>
                                {msg.role === 'assistant' && msg.content && !msg.streaming && (
                                    <>
                                        <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleCopy(msg.content, msg.id)}
                                                className="text-xs flex items-center gap-1 px-2 py-0.5 rounded text-gray-400 hover:text-gray-700"
                                            >
                                                {copiedId === msg.id ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                            </button>
                                            <SpeakButton text={msg.content} />
                                        </div>
                                        {msg.citations && msg.citations.length > 0 && (
                                            <CitationList citations={msg.citations} />
                                        )}
                                    </>
                                )}
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-200">
                                    <User className="w-4 h-4 text-gray-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Suggested prompts — only when no user messages yet */}
                    {messages.length <= 1 && !isStreaming && (
                        <div className="flex flex-wrap gap-2 justify-center pt-4">
                            {SUGGESTED_PROMPTS.map(prompt => (
                                <button
                                    key={prompt}
                                    onClick={() => handleSubmit(prompt)}
                                    className="text-xs px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="flex-none px-5 py-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSubmit} className="flex items-end gap-3">
                        <div className="flex-1 relative">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask about your activity patterns, productivity, or anything..."
                                rows={1}
                                className="w-full resize-none px-4 py-3 text-sm rounded-xl outline-none border border-gray-200 bg-gray-50 text-gray-900 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                style={{ maxHeight: '120px' }}
                            />
                        </div>
                        <VoiceInputButton onTranscript={(text) => { setInput(prev => prev ? prev + ' ' + text : text); }} />
                        <button
                            type="submit"
                            disabled={!input.trim() || isStreaming}
                            className="p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </form>
                    <p className="text-xs mt-2 text-center text-gray-400">
                        AI responses are generated from your activity data · Your data stays private
                    </p>
                </div>
            </div>

            {/* ── Plugin Sidebar ────────────────────────────── */}
            {showPlugins && (
                <aside className="w-64 flex-none border-l border-gray-200 bg-white p-4 overflow-y-auto">
                    <PluginGallery />
                </aside>
            )}
        </div>
    );
}


// ── Page wrapper ──────────────────────────────────────────────────────────────

export default function ChatPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>}>
            <ChatPageInner />
        </Suspense>
    );
}
