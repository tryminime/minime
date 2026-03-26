'use client';

import { ActivityItem } from '@/lib/hooks/useActivities';
import {
    X, Monitor, Globe, Clock, Play, Square,
    FileText, Folder, ChevronRight, BookOpen, Eye, Type
} from 'lucide-react';
import { useEffect, useRef } from 'react';

const FILE_TYPE_ICONS: Record<string, string> = {
    document: '📄', note: '📝', spreadsheet: '📊', presentation: '📽️',
    code: '💻', script: '⚡', data: '🗃️', database: '🗄️',
    notebook: '🧪', log: '📋', design: '🎨', '3d_model': '🧊',
    image: '🖼️', audio: '🎵', video: '🎬', archive: '📦',
    text: '📝', file: '📁',
};

function formatDuration(seconds: number | null): string {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    const h = Math.floor(seconds / 3600);
    const m = Math.round((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

function formatTime(isoStr: string | undefined): string {
    if (!isoStr) return '—';
    try {
        return new Date(isoStr).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    } catch { return '—'; }
}

function formatDate(isoStr: string): string {
    try {
        return new Date(isoStr).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        });
    } catch { return '—'; }
}

interface Props {
    activity: ActivityItem;
    onClose: () => void;
}

export function ActivityDetailModal({ activity, onClose }: Props) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const data = activity.data;

    // Close on Escape and overlay click
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
    };

    const appColor = activity.type === 'web_visit' ? '#10b981'
        : activity.type === 'reading_analytics' ? '#059669'
            : '#3b82f6';
    const reading = activity.context?.reading;

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
                style={{ animation: 'modalSlideIn 0.2s ease-out' }}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: appColor + '15' }}
                    >
                        {activity.type === 'web_visit'
                            ? <Globe className="w-6 h-6" style={{ color: appColor }} />
                            : <Monitor className="w-6 h-6" style={{ color: appColor }} />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 truncate">
                            {activity.title || activity.context?.title || activity.app || 'Untitled Activity'}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {activity.app}
                            {(activity.domain || activity.context?.domain) && <span> · {activity.domain || activity.context?.domain}</span>}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
                    {/* Session Timeline */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Session Timeline
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <Play className="w-4 h-4 text-green-500" />
                                <div>
                                    <p className="text-xs text-gray-400">Started</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {formatTime(data?.started_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Square className="w-4 h-4 text-red-500" />
                                <div>
                                    <p className="text-xs text-gray-400">Ended</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {formatTime(data?.ended_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <div>
                                    <p className="text-xs text-gray-400">Duration</p>
                                    <p className="text-sm font-bold text-blue-600">
                                        {formatDuration(activity.duration_seconds)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{formatDate(activity.created_at)}</p>
                    </div>

                    {/* Files Accessed */}
                    {data?.files && data.files.length > 0 && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Files Accessed ({data.files.length})
                            </h3>
                            <div className="space-y-2">
                                {data.files.map((file, i) => (
                                    <div key={i} className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                        <div className="flex items-center gap-3 px-4 py-3">
                                            <span className="text-xl flex-shrink-0">
                                                {FILE_TYPE_ICONS[file.type] || '📁'}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-400 truncate">{file.path}</p>
                                            </div>
                                            <span className="text-xs bg-blue-100 text-blue-700 rounded-full px-2.5 py-1 font-medium flex-shrink-0">
                                                {file.type}
                                            </span>
                                        </div>
                                        {/* Content Preview */}
                                        {file.content_preview && (
                                            <div className="px-4 pb-3 pt-0">
                                                <div className="bg-white rounded-lg border border-gray-200 p-3">
                                                    <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                                                        <ChevronRight className="w-3 h-3" />
                                                        Content Preview
                                                    </p>
                                                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed max-h-32 overflow-y-auto">
                                                        {file.content_preview}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Legacy single file */}
                    {!data?.files && data?.file_name && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                File
                            </h3>
                            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-gray-800 truncate">{data.file_name}</p>
                                    <p className="text-xs text-gray-400 truncate">{data.file_path}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Summary */}
                    {data?.content_summary && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Extracted Content
                            </h3>
                            <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                                    {data.content_summary}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Working Directory */}
                    {data?.working_directory && (
                        <div className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400">Working Directory</p>
                                <p className="text-sm font-medium text-gray-700">{data.working_directory}</p>
                            </div>
                        </div>
                    )}

                    {/* Reading Analytics */}
                    {reading && (
                        <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Reading Engagement
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {reading.scroll_depth_pct != null && (
                                    <div className="bg-emerald-50 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                            <span className="text-[10px] text-gray-500 uppercase">Scroll Depth</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">{reading.scroll_depth_pct}%</p>
                                    </div>
                                )}
                                {reading.estimated_read_pct != null && (
                                    <div className="bg-blue-50 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                            <span className="text-[10px] text-gray-500 uppercase">Read</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">{reading.estimated_read_pct}%</p>
                                    </div>
                                )}
                                {reading.word_count != null && reading.word_count > 0 && (
                                    <div className="bg-purple-50 rounded-xl p-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Type className="w-3.5 h-3.5 text-purple-600" />
                                            <span className="text-[10px] text-gray-500 uppercase">Words</span>
                                        </div>
                                        <p className="text-lg font-bold text-gray-900">{reading.word_count.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                            {activity.context?.url && (
                                <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                                    <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                    <a
                                        href={activity.context.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline truncate"
                                    >
                                        {activity.context.url}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* No context data */}
                    {(!data || (!data.files && !data.file_name && !data.content_summary && !data.working_directory && !data.started_at)) && !reading && (
                        <div className="text-center py-8 text-gray-400">
                            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">No detailed context available for this activity</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                        Source: {activity.source || 'unknown'} · ID: {activity.id.slice(0, 8)}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
