'use client';

import { useState } from 'react';
import { useReadingAnalytics, ReadingDocument, FormatGroup } from '@/lib/hooks/useReadingAnalytics';
import {
    BookOpen, Clock, FileText, Monitor, Globe, BarChart3, TrendingUp,
    ChevronDown, ChevronRight, Sparkles, List, LayoutGrid, Database, Eye, Type, Link,
} from 'lucide-react';

const SOURCE_COLORS = {
    browser: '#3b82f6',
    desktop: '#8b5cf6',
};

const FORMAT_COLORS: Record<string, string> = {
    'PDF': '#ef4444', 'Word': '#2563eb', 'Document': '#2563eb',
    'Excel': '#16a34a', 'PowerPoint': '#f97316',
    'Text': '#6b7280', 'Markdown': '#8b5cf6',
    'eBook': '#d946ef', 'LaTeX': '#0891b2',
    'Google': '#4285f4', 'Web Article': '#10b981',
    'ODT': '#2563eb', 'RTF': '#6b7280', 'CSV': '#16a34a',
};

const FORMAT_ICONS: Record<string, string> = {
    'PDF': '📕', 'Word': '📘', 'Document': '📘', 'Excel': '📊',
    'PowerPoint': '📽️', 'Text': '📝', 'Markdown': '📓',
    'eBook': '📖', 'LaTeX': '📐', 'Google': '🔵',
    'Web Article': '🌐', 'ODT': '📘', 'RTF': '📄', 'CSV': '📊',
};

function formatMinutes(mins: number): string {
    if (mins < 1) return '<1m';
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
}

/* ─── Extracted Data Viewer ────────────────────────────────────────── */
function ExtractedDataPanel({ data }: { data: Record<string, any> }) {
    const entries = Object.entries(data).filter(([, v]) => v != null && v !== '' && (typeof v !== 'object' || Object.keys(v).length > 0));
    if (entries.length === 0) {
        return (
            <div className="text-center py-4 text-gray-400 text-xs">
                No extracted data available yet
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {/* Reading metrics */}
            {data.reading && (
                <div className="bg-emerald-50 rounded-lg p-3">
                    <h5 className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Reading Metrics
                    </h5>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                        {data.reading.scroll_depth_pct != null && (
                            <div><span className="text-gray-500">Scroll:</span> <strong>{data.reading.scroll_depth_pct}%</strong></div>
                        )}
                        {data.reading.estimated_read_pct != null && (
                            <div><span className="text-gray-500">Read:</span> <strong>{data.reading.estimated_read_pct}%</strong></div>
                        )}
                        {data.reading.word_count != null && (
                            <div><span className="text-gray-500">Words:</span> <strong>{data.reading.word_count.toLocaleString()}</strong></div>
                        )}
                        {data.reading.time_on_page_sec != null && (
                            <div><span className="text-gray-500">Time:</span> <strong>{formatMinutes(Math.round(data.reading.time_on_page_sec / 60))}</strong></div>
                        )}
                        {data.reading.selection_count != null && data.reading.selection_count > 0 && (
                            <div><span className="text-gray-500">Highlights:</span> <strong>{data.reading.selection_count}</strong></div>
                        )}
                    </div>
                </div>
            )}

            {/* URL */}
            {data.url && (
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs">
                    <Link className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <a href={data.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {data.url}
                    </a>
                </div>
            )}

            {/* Page type / importance */}
            {(data.page_type || data.importance_score != null) && (
                <div className="flex items-center gap-3 text-xs">
                    {data.page_type && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {data.page_type}
                        </span>
                    )}
                    {data.importance_score != null && (
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            Importance: {data.importance_score}/100
                        </span>
                    )}
                </div>
            )}

            {/* Headings */}
            {data.headings && data.headings.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3">
                    <h5 className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Type className="w-3 h-3" /> Page Headings
                    </h5>
                    <ul className="space-y-1">
                        {data.headings.slice(0, 8).map((h: any, i: number) => (
                            <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                <span className="text-blue-400 flex-shrink-0 mt-0.5">
                                    {'#'.repeat(typeof h === 'object' ? h.level || 1 : 1)}
                                </span>
                                <span>{typeof h === 'string' ? h : h.text}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Meta */}
            {data.meta && (
                <div className="bg-gray-50 rounded-lg p-3">
                    <h5 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Page Metadata
                    </h5>
                    <div className="space-y-1 text-xs text-gray-600">
                        {data.meta.description && (
                            <p><span className="text-gray-400">Desc:</span> {data.meta.description.substring(0, 150)}</p>
                        )}
                        {data.meta.author && (
                            <p><span className="text-gray-400">Author:</span> {data.meta.author}</p>
                        )}
                        {data.meta.published && (
                            <p><span className="text-gray-400">Published:</span> {data.meta.published}</p>
                        )}
                        {data.meta.keywords && (
                            <p><span className="text-gray-400">Keywords:</span> {data.meta.keywords.substring(0, 100)}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Selected text */}
            {data.selected_text && (
                <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                    <h5 className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wider mb-1">
                        Highlighted Text
                    </h5>
                    <p className="text-xs text-gray-700 italic">&ldquo;{data.selected_text.substring(0, 300)}&rdquo;</p>
                </div>
            )}

            {/* Desktop file info */}
            {(data.file_path || data.app) && (
                <div className="bg-purple-50 rounded-lg p-3 text-xs">
                    <h5 className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider mb-2">
                        Desktop Details
                    </h5>
                    {data.app && <p><span className="text-gray-500">App:</span> {data.app}</p>}
                    {data.file_path && <p><span className="text-gray-500">Path:</span> {data.file_path}</p>}
                    {data.source && <p><span className="text-gray-500">Source:</span> {data.source}</p>}
                </div>
            )}

            {/* Input metrics */}
            {data.input_metrics && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs">
                    <h5 className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">
                        Input Activity
                    </h5>
                    <div className="grid grid-cols-2 gap-1">
                        {data.input_metrics.keystrokes_per_minute != null && (
                            <p><span className="text-gray-500">Keys/min:</span> {data.input_metrics.keystrokes_per_minute}</p>
                        )}
                        {data.input_metrics.mouse_click_count != null && (
                            <p><span className="text-gray-500">Clicks:</span> {data.input_metrics.mouse_click_count}</p>
                        )}
                        {data.input_metrics.activity_level && (
                            <p><span className="text-gray-500">Level:</span> {data.input_metrics.activity_level}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Single document row ─────────────────────────────────────────── */
function DocRow({ doc }: { doc: ReadingDocument }) {
    const [expanded, setExpanded] = useState<'none' | 'insights' | 'data'>('none');
    const isDesktop = doc.source === 'desktop';
    const SourceIcon = isDesktop ? Monitor : Globe;
    const color = SOURCE_COLORS[doc.source];
    const minutes = Math.round(doc.time_seconds / 60);
    const fmtColor = FORMAT_COLORS[doc.format] || '#6b7280';
    const hasInsights = doc.key_insights.length > 0;
    const hasData = Object.keys(doc.extracted_data).length > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}15` }}
                    >
                        <SourceIcon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                            <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{ backgroundColor: `${fmtColor}15`, color: fmtColor }}
                            >
                                {doc.format}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="truncate">{doc.app_or_domain}</span>
                            <span className="text-gray-300">·</span>
                            <span className="flex-shrink-0">{timeAgo(doc.latest_at)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    <div className="text-right mr-1">
                        <p className="text-sm font-bold text-gray-900">{formatMinutes(minutes)}</p>
                        <p className="text-xs text-gray-400">
                            {doc.visit_count} {doc.visit_count === 1 ? 'session' : 'sessions'}
                        </p>
                    </div>
                    {hasInsights && (
                        <button
                            onClick={() => setExpanded(prev => prev === 'insights' ? 'none' : 'insights')}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${expanded === 'insights' ? 'bg-amber-200' : 'bg-amber-50 hover:bg-amber-100'}`}
                            title="Key insights"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        </button>
                    )}
                    {hasData && (
                        <button
                            onClick={() => setExpanded(prev => prev === 'data' ? 'none' : 'data')}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${expanded === 'data' ? 'bg-blue-200' : 'bg-blue-50 hover:bg-blue-100'}`}
                            title="View extracted data"
                        >
                            <Database className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* Reading engagement bars */}
            {(doc.scroll_depth_pct || doc.estimated_read_pct) ? (
                <div className="mt-3 flex items-center gap-4">
                    {doc.scroll_depth_pct != null && (
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Scroll</span>
                                <span className="text-xs font-medium text-gray-600">{doc.scroll_depth_pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-blue-400 transition-all" style={{ width: `${Math.min(doc.scroll_depth_pct, 100)}%` }} />
                            </div>
                        </div>
                    )}
                    {doc.estimated_read_pct != null && (
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Read</span>
                                <span className="text-xs font-medium text-gray-600">{doc.estimated_read_pct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className="h-1.5 rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.min(doc.estimated_read_pct, 100)}%` }} />
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {/* Key insights */}
            {expanded === 'insights' && hasInsights && (
                <div className="mt-3 bg-amber-50/50 rounded-lg border border-amber-100 p-3">
                    <h4 className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Key Insights → Knowledge Graph
                    </h4>
                    <ul className="space-y-1.5">
                        {doc.key_insights.map((insight, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                <span className="text-amber-500 mt-0.5 flex-shrink-0">•</span>
                                <span className="leading-relaxed">{insight}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Extracted data */}
            {expanded === 'data' && hasData && (
                <div className="mt-3 bg-blue-50/30 rounded-lg border border-blue-100 p-3">
                    <h4 className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        Extracted Data
                    </h4>
                    <ExtractedDataPanel data={doc.extracted_data} />
                </div>
            )}
        </div>
    );
}

/* ─── Format group (expandable) ──────────────────────────────────── */
function FormatGroupRow({ group }: { group: FormatGroup }) {
    const [expanded, setExpanded] = useState(true);
    const color = FORMAT_COLORS[group.format] || '#6b7280';
    const icon = FORMAT_ICONS[group.format] || '📄';
    const Chevron = expanded ? ChevronDown : ChevronRight;

    return (
        <div>
            <button
                onClick={() => setExpanded(prev => !prev)}
                className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
            >
                <span className="text-lg">{icon}</span>
                <span className="font-semibold text-gray-800 flex-1">{group.format}</span>
                <span className="text-xs text-gray-400 mr-1">
                    {group.doc_count} {group.doc_count === 1 ? 'doc' : 'docs'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}15`, color }}>
                    {formatMinutes(Math.round(group.total_time_seconds / 60))}
                </span>
                <Chevron className="w-4 h-4 text-gray-400 transition-transform" />
            </button>
            {expanded && (
                <div className="space-y-2 ml-2 mt-1">
                    {group.documents.map((doc, i) => (
                        <DocRow key={`${doc.source}:${doc.name}:${i}`} doc={doc} />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ─── Main component ──────────────────────────────────────────────── */
export function ReadingTracker() {
    const { data, isLoading, error } = useReadingAnalytics();
    const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p className="font-semibold">Failed to load reading data</p>
            </div>
        );
    }

    if (!data) return null;

    const browserPct = data.total_reading_minutes > 0
        ? Math.round((data.browser_minutes / data.total_reading_minutes) * 100)
        : 0;
    const desktopPct = 100 - browserPct;

    return (
        <div>
            {/* Summary stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatMinutes(data.total_reading_minutes)}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Reading Time</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.total_documents}</p>
                    <p className="text-xs text-gray-500 mt-1">Documents Read</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatMinutes(data.avg_session_minutes)}</p>
                    <p className="text-xs text-gray-500 mt-1">Avg Session</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-amber-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.top_format}</p>
                    <p className="text-xs text-gray-500 mt-1">Most Read Format</p>
                </div>
            </div>

            {/* Source breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" /> Source Breakdown
                </h3>
                <div className="flex items-center gap-6 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SOURCE_COLORS.browser }} />
                        <span className="text-sm text-gray-600">Browser</span>
                        <span className="text-sm font-bold text-gray-900">{formatMinutes(data.browser_minutes)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SOURCE_COLORS.desktop }} />
                        <span className="text-sm text-gray-600">Desktop</span>
                        <span className="text-sm font-bold text-gray-900">{formatMinutes(data.desktop_minutes)}</span>
                    </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4 flex overflow-hidden">
                    {browserPct > 0 && <div className="h-4 transition-all" style={{ width: `${browserPct}%`, backgroundColor: SOURCE_COLORS.browser }} />}
                    {desktopPct > 0 && <div className="h-4 transition-all" style={{ width: `${desktopPct}%`, backgroundColor: SOURCE_COLORS.desktop }} />}
                </div>
                <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{browserPct}%</span>
                    <span className="text-[10px] text-gray-400">{desktopPct}%</span>
                </div>
            </div>

            {/* Daily trend */}
            {data.daily_minutes.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Daily Reading</h3>
                    <div className="flex items-end gap-1 h-24">
                        {data.daily_minutes.slice(-14).map((day, i) => {
                            const maxVal = Math.max(...data.daily_minutes.slice(-14).map(d => d.minutes), 1);
                            const heightPct = Math.max((day.minutes / maxVal) * 100, 4);
                            return (
                                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                    <div
                                        className="w-full rounded-t-sm bg-emerald-400 hover:bg-emerald-500 transition-colors cursor-default"
                                        style={{ height: `${heightPct}%` }}
                                        title={`${day.date}: ${day.minutes}m`}
                                    />
                                    {i % 2 === 0 && <span className="text-[9px] text-gray-400">{day.date.slice(5)}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Document list header with view toggle */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                    Documents & Articles
                    <span className="text-gray-400 font-normal ml-2 text-xs">
                        (social, chat, entertainment excluded)
                    </span>
                </h3>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode('grouped')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'grouped' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        title="Group by type"
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        title="List view (sorted by latest)"
                    >
                        <List className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {data.documents.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No reading activity yet</p>
                    <p className="text-sm mt-1">
                        Content you read in browsers, PDFs, and documents will appear here
                    </p>
                </div>
            ) : viewMode === 'grouped' ? (
                <div className="space-y-4">
                    {data.format_groups.map(group => (
                        <FormatGroupRow key={group.format} group={group} />
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    {data.documents.slice(0, 30).map((doc, i) => (
                        <DocRow key={`${doc.source}:${doc.name}:${i}`} doc={doc} />
                    ))}
                    {data.documents.length > 30 && (
                        <p className="text-center text-sm text-gray-400 py-2">
                            +{data.documents.length - 30} more documents
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
