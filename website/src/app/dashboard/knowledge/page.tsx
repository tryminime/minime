'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, Upload, BookOpen, FileText, FileCode, Globe,
    Filter, X, ChevronDown, Loader2, Brain, Download,
    ExternalLink, Trash2, Clock, Tag, Lock
} from 'lucide-react';
import { useSubscription } from '@/lib/hooks/useBilling';
import { getAPIClient } from '@/lib/api';
import { UpgradeModal } from '@/components/UpgradeModal';
import { toast } from 'sonner';

// ── Types ────────────────────────────────────────────────────────────────────

interface ContentItem {
    id: string;
    title: string;
    url: string;
    doc_type: string;
    word_count: number;
    keyphrases: string[];
    topic?: { primary: string; confidence: number };
    created_at: string;
    text_snippet?: string;
}

interface SearchResult {
    content_id: string;
    score: number;
    title: string;
    url: string;
    doc_type: string;
    snippet: string;
    keyphrases: string[];
    topic?: { primary: string };
}

const DOC_TYPES = ['all', 'webpage', 'pdf', 'docx', 'xlsx', 'pptx', 'code', 'other'];
const KNOWN_TYPES = new Set(['webpage', 'pdf', 'docx', 'xlsx', 'pptx', 'code']);

const DOC_ICONS: Record<string, React.ReactNode> = {
    webpage: <Globe size={14} />,
    pdf: <FileText size={14} />,
    docx: <FileText size={14} />,
    xlsx: <FileText size={14} />,
    code: <FileCode size={14} />,
};

const TOPIC_COLORS: Record<string, string> = {
    'software engineering': 'bg-blue-100 text-blue-700 border-blue-200',
    'machine learning and AI': 'bg-purple-100 text-purple-700 border-purple-200',
    'DevOps and infrastructure': 'bg-orange-100 text-orange-700 border-orange-200',
    'data science': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'cybersecurity': 'bg-red-100 text-red-700 border-red-200',
    'finance and business': 'bg-green-100 text-green-700 border-green-200',
    'design and UX': 'bg-pink-100 text-pink-700 border-pink-200',
};

function topicClass(topic: string) {
    return TOPIC_COLORS[topic] || 'bg-gray-100 text-gray-600 border-gray-200';
}

// ── Content Card ──────────────────────────────────────────────────────────────

function ContentCard({
    item, onClick, onDelete
}: { item: ContentItem; onClick?: () => void; onDelete?: () => void }) {
    const domain = item.url ? (() => { try { return new URL(item.url).hostname; } catch { return ''; } })() : item.doc_type;
    const readTime = Math.max(1, Math.ceil((item.word_count || 0) / 200));

    return (
        <div
            onClick={onClick}
            className="group bg-white hover:bg-gray-50 border border-gray-200 hover:border-indigo-300 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md relative"
        >
            {/* Delete button */}
            {onDelete && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50"
                >
                    <Trash2 size={12} className="text-red-400" />
                </button>
            )}

            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-500 flex-shrink-0">
                    {DOC_ICONS[item.doc_type] || <Globe size={14} />}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                    <h3 className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                        {item.title || 'Untitled'}
                    </h3>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{domain}</p>
                </div>
            </div>

            {/* Text snippet preview */}
            {item.text_snippet && (
                <p className="mt-2 text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {item.text_snippet}
                </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {item.topic && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${topicClass(item.topic.primary)}`}>
                        {item.topic.primary}
                    </span>
                )}
                {(item.keyphrases || []).slice(0, 3).map(kp => (
                    <span key={kp} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                        {kp}
                    </span>
                ))}
            </div>

            <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">
                {item.word_count > 0 && <span>📝 {item.word_count.toLocaleString()} words</span>}
                <span>⏱ {readTime}m read</span>
                <span className="ml-auto">{new Date(item.created_at).toLocaleDateString()}</span>
            </div>
        </div>
    );
}

// ── Detail Drawer ────────────────────────────────────────────────────────────

function DetailDrawer({ item, onClose, onDelete }: {
    item: ContentItem; onClose: () => void; onDelete: () => void;
}) {
    const readTime = Math.max(1, Math.ceil((item.word_count || 0) / 200));
    const domain = item.url ? (() => { try { return new URL(item.url).hostname; } catch { return ''; } })() : '';

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-2 text-indigo-600">
                        {DOC_ICONS[item.doc_type] || <Globe size={16} />}
                        <span className="text-xs font-semibold uppercase tracking-wide">{item.doc_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink size={14} className="text-gray-400" />
                            </a>
                        )}
                        <button
                            onClick={() => { onDelete(); onClose(); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <Trash2 size={14} className="text-red-400" />
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <X size={14} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 leading-snug">{item.title || 'Untitled'}</h2>
                        {domain && <p className="text-xs text-gray-400 mt-1">{domain}</p>}
                    </div>

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Words</p>
                            <p className="text-sm font-bold text-gray-900">{item.word_count.toLocaleString()}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Read Time</p>
                            <p className="text-sm font-bold text-gray-900">{readTime} min</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Captured</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(item.created_at).toLocaleDateString()}</p>
                        </div>
                        {item.topic && (
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Topic</p>
                                <p className="text-sm font-bold text-gray-900 truncate">{item.topic.primary}</p>
                            </div>
                        )}
                    </div>

                    {/* Keyphrases */}
                    {item.keyphrases?.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Tag size={11} /> Keyphrases
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {item.keyphrases.map(kp => (
                                    <span key={kp} className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200">
                                        {kp}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Text preview */}
                    {item.text_snippet && (
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview</p>
                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-[12] bg-gray-50 rounded-xl p-3 border border-gray-200">
                                {item.text_snippet}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

// ── Document Uploader ──────────────────────────────────────────────────────────

function DocumentUploader({ onExtracted, disabled }: {
    onExtracted: (result: ContentItem) => void; disabled?: boolean;
}) {
    const api = getAPIClient();
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        if (disabled) return;
        setUploading(true);
        setLastResult(null);
        const form = new FormData();
        form.append('file', file);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/documents/extract`, {
                method: 'POST',
                body: form,
                headers: { Authorization: `Bearer ${localStorage.getItem('minime_auth_token') || ''}` },
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setLastResult(data);
            onExtracted(data);
        } catch (e: any) {
            setLastResult({ error: e.message });
        } finally {
            setUploading(false);
        }
    }, [onExtracted, disabled]);

    return (
        <div className="space-y-3">
            <div
                onDragOver={e => { e.preventDefault(); if (!disabled) setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => {
                    e.preventDefault(); setDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFile(f);
                }}
                onClick={() => !disabled && inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${disabled ? 'opacity-40 cursor-not-allowed border-gray-200'
                    : dragging ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
                        : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 cursor-pointer'
                    }`}
            >
                <input ref={inputRef} type="file"
                    accept=".pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt,.py,.js,.ts"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 size={24} className="text-indigo-500 animate-spin" />
                        <p className="text-sm text-gray-500">Extracting content…</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Upload size={24} className="text-gray-400" />
                        <p className="text-sm text-gray-700">Drop a file or click to upload</p>
                        <p className="text-xs text-gray-400">PDF, DOCX, XLSX, PPTX, code files</p>
                    </div>
                )}
            </div>

            {lastResult && !lastResult.error && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-green-700">✅ Extraction complete — {lastResult.word_count?.toLocaleString()} words</p>
                    <div className="flex flex-wrap gap-1">
                        {(lastResult.keyphrases || []).slice(0, 6).map((kp: string) => (
                            <span key={kp} className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-600 border border-green-200">{kp}</span>
                        ))}
                    </div>
                </div>
            )}
            {lastResult?.error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">⚠️ {lastResult.error}</p>
            )}
        </div>
    );
}

// ── Knowledge Freshness Panel ─────────────────────────────────────────────────

function KnowledgeFreshnessPanel() {
    const api = getAPIClient();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<any>('/api/v1/analytics/knowledge/decay?limit=50');
                setData(res);
            } catch { }
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="bg-white border border-gray-200 rounded-2xl p-6 mx-6"><Loader2 size={20} className="animate-spin text-indigo-500 mx-auto" /></div>;
    if (!data) return null;

    const statusColors: Record<string, string> = { fresh: '#22c55e', fading: '#eab308', stale: '#f97316', forgotten: '#ef4444' };
    const statusBg: Record<string, string> = { fresh: 'bg-green-50 border-green-200', fading: 'bg-yellow-50 border-yellow-200', stale: 'bg-orange-50 border-orange-200', forgotten: 'bg-red-50 border-red-200' };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mx-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-900">Knowledge Freshness</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    data.overall_health === 'healthy' ? 'bg-green-100 text-green-700'
                    : data.overall_health === 'needs_attention' ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>{data.overall_health}</span>
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                {Object.entries(data.status_breakdown || {}).map(([status, count]) => (
                    <div key={status} className={`rounded-xl p-3 border text-center ${statusBg[status] || 'bg-gray-50 border-gray-200'}`}>
                        <p className="text-lg font-bold" style={{ color: statusColors[status] }}>{count as number}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{status}</p>
                    </div>
                ))}
            </div>

            {/* Top stale entities */}
            {data.entities && data.entities.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Most Stale</p>
                    {data.entities.slice(0, 6).map((e: any) => (
                        <div key={e.id} className="flex items-center gap-3 py-1.5">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                            <span className="text-xs text-gray-700 flex-1 truncate">{e.name}</span>
                            <span className="text-[10px] text-gray-400">{e.days_since_last_seen}d ago</span>
                            <div className="w-12 h-1.5 rounded-full bg-gray-200">
                                <div className="h-1.5 rounded-full transition-all" style={{ width: `${e.freshness_score * 100}%`, backgroundColor: e.color }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Semantic Clusters Panel ───────────────────────────────────────────────────

function SemanticClustersPanel() {
    const api = getAPIClient();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<any>('/api/v1/analytics/knowledge/clusters');
                setData(res);
            } catch { }
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="bg-white border border-gray-200 rounded-2xl p-6 mx-6"><Loader2 size={20} className="animate-spin text-indigo-500 mx-auto" /></div>;
    if (!data || !data.clusters?.length) return null;

    const clusterColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#eab308', '#ef4444'];

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mx-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Brain size={16} className="text-purple-600" />
                    <h3 className="text-sm font-bold text-gray-900">Knowledge Clusters</h3>
                </div>
                <span className="text-xs text-gray-400">{data.total_clusters} clusters · {data.noise_count || 0} unclustered</span>
            </div>

            <div className="space-y-3">
                {data.clusters.slice(0, 6).map((c: any, i: number) => (
                    <div key={c.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: clusterColors[i % clusterColors.length] }} />
                                <span className="text-xs font-medium text-gray-800">{c.label}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">coherence: {c.coherence_score}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {c.entities.slice(0, 5).map((e: any) => (
                                <span key={e.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{e.name}</span>
                            ))}
                            {c.size > 5 && <span className="text-[10px] text-gray-400">+{c.size - 5} more</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────


export default function KnowledgePage() {
    const api = getAPIClient();
    const { data: subscription } = useSubscription();
    const isPro = subscription?.plan_type !== 'free';

    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [items, setItems] = useState<ContentItem[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [filteredTotal, setFilteredTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [docTypeFilter, setDocTypeFilter] = useState('all');
    const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
    const [showUploader, setShowUploader] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeFeature, setUpgradeFeature] = useState('');
    const [exporting, setExporting] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Fetch per-type counts
    const refreshCounts = useCallback(async () => {
        try {
            const data = await api.get<{ total_records: number; by_doc_type: Record<string, number> }>('/api/v1/content/stats/summary');
            setTypeCounts(data.by_doc_type || {});
            setTotalItems(data.total_records || 0);
        } catch { }
    }, []);

    // Load content with server-side doc_type filter
    const fetchItems = useCallback(async (docType: string, offset = 0, append = false) => {
        try {
            let url = `/api/v1/content/?limit=20&offset=${offset}`;
            if (docType === 'other') {
                // Use exclude_types to get non-standard types server-side
                url += `&exclude_types=${Array.from(KNOWN_TYPES).join(',')}`;
            } else if (docType !== 'all') {
                url += `&doc_type=${docType}`;
            }
            const data = await api.get<{ items: ContentItem[]; total: number }>(url);

            if (append) {
                setItems(prev => [...prev, ...(data.items || [])]);
            } else {
                setItems(data.items || []);
            }
            setFilteredTotal(data.total || 0);
        } catch { }
        setLoading(false);
        setLoadingMore(false);
    }, []);

    // Initial load
    useEffect(() => {
        refreshCounts();
        fetchItems('all');
    }, []);

    // When filter changes, re-fetch from server
    useEffect(() => {
        setLoading(true);
        setItems([]);
        fetchItems(docTypeFilter);
    }, [docTypeFilter]);

    const loadMore = () => {
        setLoadingMore(true);
        fetchItems(docTypeFilter, items.length, true);
    };

    // Debounced semantic search (authenticated)
    useEffect(() => {
        clearTimeout(searchTimer.current);
        if (!query.trim()) { setSearchResults([]); return; }
        searchTimer.current = setTimeout(async () => {
            setSearching(true);
            try {
                const data = await api.post<{ results: SearchResult[] }>('/api/v1/content/search', {
                    query,
                    doc_type_filter: docTypeFilter !== 'all' ? docTypeFilter : null,
                    limit: 12,
                });
                setSearchResults(data.results || []);
            } catch { }
            setSearching(false);
        }, 350);
    }, [query, docTypeFilter]);

    const handleDelete = async (id: string) => {
        try {
            await api.delete(`/api/v1/content/${id}`);
            setItems(prev => prev.filter(i => i.id !== id));
            setFilteredTotal(prev => Math.max(0, prev - 1));
            setTotalItems(prev => Math.max(0, prev - 1));
            refreshCounts();
            toast.success('Item deleted');
        } catch {
            toast.error('Failed to delete item');
        }
    };

    const handleExport = async () => {
        if (!isPro) { setUpgradeFeature('Knowledge Base Export'); setShowUpgradeModal(true); return; }
        setExporting(true);
        try {
            const token = localStorage.getItem('access_token') || '';
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/content/export?format=json`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'minime-knowledge-export.json';
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Knowledge base exported');
        } catch { toast.error('Export failed'); }
        setExporting(false);
    };

    const isSearching = query.trim().length > 0;

    // Stats
    const totalWords = items.reduce((sum, i) => sum + (i.word_count || 0), 0);
    const itemLimit = isPro ? 10000 : 25;
    const itemPct = Math.round((totalItems / itemLimit) * 100);
    const hasMore = items.length < filteredTotal;

    // "Other" count from typeCounts
    const otherCount = Object.entries(typeCounts)
        .filter(([k]) => !KNOWN_TYPES.has(k))
        .reduce((sum, [, v]) => sum + v, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                            <Brain size={18} className="text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Knowledge Library</h1>
                            <p className="text-xs text-gray-500">{totalItems} of {isPro ? '10,000' : '25'} items</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Export button (Pro) */}
                        <button
                            onClick={handleExport}
                            disabled={exporting}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${isPro ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-gray-50 text-gray-400 cursor-pointer'
                                }`}
                        >
                            {isPro ? <Download size={13} /> : <Lock size={13} />}
                            {exporting ? 'Exporting…' : 'Export'}
                            {!isPro && <span className="ml-0.5 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Pro</span>}
                        </button>

                        {/* Upload button */}
                        <button
                            onClick={() => setShowUploader(v => !v)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-indigo-600 hover:bg-indigo-500 text-white"
                        >
                            <Upload size={14} />
                            Upload Document
                        </button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="max-w-5xl mx-auto mt-3 flex items-center gap-4 text-[11px] text-gray-500">
                    <span>📚 {totalItems} items</span>
                    <span>📝 {totalWords.toLocaleString()} words</span>
                    <span>🔍 Semantic search enabled</span>
                    {!isPro && (
                        <div className="ml-auto flex items-center gap-2">
                            <div className="w-24 h-1.5 rounded-full bg-gray-200">
                                <div className="h-1.5 rounded-full bg-indigo-500 transition-all"
                                    style={{ width: `${Math.min(itemPct, 100)}%`, background: itemPct >= 80 ? '#ef4444' : undefined }} />
                            </div>
                            <span className={itemPct >= 80 ? 'text-red-500' : ''}>{itemPct}% used</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
                {/* Upload Panel */}
                {showUploader && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Upload size={14} /> Upload & Extract</h2>
                            <button onClick={() => setShowUploader(false)} className="text-gray-400 hover:text-gray-700"><X size={16} /></button>
                        </div>
                        <DocumentUploader
                            disabled={false}
                            onExtracted={(r) => {
                                setShowUploader(false);
                                toast.success('Document added to Knowledge Base');
                                refreshCounts();
                                fetchItems(docTypeFilter);
                            }}
                        />
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    {searching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 animate-spin" />}
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Semantic search across your captured content…"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-300 text-sm text-gray-900 placeholder-gray-400 transition-all"
                    />
                </div>

                {/* Filter Row */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <Filter size={14} className="text-gray-400 flex-shrink-0" />
                    {DOC_TYPES.map(type => {
                        const count = type === 'all' ? totalItems
                            : type === 'other' ? otherCount
                                : (typeCounts[type] || 0);
                        // Hide tabs with 0 items (except 'all' and 'other')
                        if (count === 0 && type !== 'all') return null;
                        return (
                            <button
                                key={type}
                                onClick={() => setDocTypeFilter(type)}
                                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize flex items-center gap-1.5 ${docTypeFilter === type ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                {type === 'all' ? 'All Types' : type === 'other' ? 'Other' : type.toUpperCase()}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${docTypeFilter === type ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search Results */}
                {isSearching && (
                    <div className="space-y-3">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {searchResults.length > 0
                                ? `${searchResults.length} semantic matches`
                                : searching ? 'Searching…' : 'No matches found'}
                        </h2>
                        {searchResults.map(r => (
                            <div key={r.content_id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-indigo-300 transition-all">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-medium text-gray-900 truncate">{r.title || 'Untitled'}</h3>
                                        <p className="text-[10px] text-gray-400">{r.url ? (() => { try { return new URL(r.url).hostname; } catch { return ''; } })() : ''}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <div className="text-xs text-indigo-600 font-semibold">{Math.round(r.score * 100)}%</div>
                                        <div className="text-[10px] text-gray-400">match</div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{r.snippet}</p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {(r.keyphrases || []).slice(0, 4).map(kp => (
                                        <span key={kp} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">{kp}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Content Feed */}
                {!isSearching && (
                    <div className="space-y-3">
                        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {loading ? 'Loading…' : `${items.length} of ${filteredTotal} ${docTypeFilter === 'all' ? 'items' : docTypeFilter + ' items'}`}
                        </h2>
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 size={24} className="text-indigo-500 animate-spin" />
                            </div>
                        ) : items.length === 0 ? (
                            <div className="text-center py-16 text-gray-400">
                                <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm">No {docTypeFilter !== 'all' ? docTypeFilter.toUpperCase() + ' ' : ''}content captured yet.</p>
                                <p className="text-xs mt-1">Browse the web with the MiniMe extension installed.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {items.map(item => (
                                        <ContentCard
                                            key={item.id}
                                            item={item}
                                            onClick={() => setSelectedItem(item)}
                                            onDelete={() => handleDelete(item.id)}
                                        />
                                    ))}
                                </div>
                                {/* Load More */}
                                {hasMore && (
                                    <div className="text-center pt-4">
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="px-6 py-2.5 bg-white border border-gray-200 hover:border-indigo-300 rounded-xl text-sm font-medium text-gray-700 hover:text-indigo-600 transition-all disabled:opacity-50"
                                        >
                                            {loadingMore ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 size={14} className="animate-spin" /> Loading…
                                                </span>
                                            ) : (
                                                `Load More (${totalItems - items.length} remaining)`
                                            )}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Item Detail Drawer */}
            {selectedItem && (
                <DetailDrawer
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onDelete={() => handleDelete(selectedItem.id)}
                />
            )}

            {/* ── Knowledge Freshness Panel ────────────────────────── */}
            <KnowledgeFreshnessPanel />

            {/* ── Semantic Clusters Panel ──────────────────────────── */}
            <SemanticClustersPanel />


            {/* Upgrade Modal */}
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName={upgradeFeature}
                tier="pro"
            />
        </div>
    );
}
