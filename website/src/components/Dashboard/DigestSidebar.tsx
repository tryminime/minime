'use client';

import { useDigestHistory, DigestListItem } from '@/lib/hooks/useWeeklySummary';
import { Calendar, ChevronRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface DigestSidebarProps {
    currentDate?: string;
    onSelectDigest: (date: string) => void;
}

export function DigestSidebar({ currentDate, onSelectDigest }: DigestSidebarProps) {
    const { data, isLoading, error } = useDigestHistory(1, 10);

    if (isLoading) {
        return (
            <div className="h-full bg-white border-r border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Past Digests</h3>
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-gray-100 animate-pulse rounded h-16" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-full bg-white border-r border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Past Digests</h3>
                <p className="text-sm text-gray-500">Failed to load history</p>
            </div>
        );
    }

    return (
        <div className="h-full bg-white border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4 sticky top-0 bg-white">
                Past Digests
            </h3>

            <div className="space-y-2">
                {data.digests.map((digest: DigestListItem) => {
                    const isSelected = digest.week_start === currentDate;

                    return (
                        <button
                            key={digest.id}
                            onClick={() => onSelectDigest(digest.week_start)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${isSelected
                                    ? 'bg-blue-50 border-2 border-blue-500'
                                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                        {formatDate(digest.week_start)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        to {formatDate(digest.week_end)}
                                    </p>
                                </div>
                                {isSelected && (
                                    <ChevronRight className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {data.digests.length === 0 && (
                <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No digests yet</p>
                </div>
            )}

            {data.total > data.digests.length && (
                <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    Load More ({data.total - data.digests.length} more)
                </button>
            )}
        </div>
    );
}
