'use client';

import { Mail, MessageCircle } from 'lucide-react';
import { useCollaborationWeekly, Collaborator } from '@/lib/hooks/useCollaborationMetrics';

export function TopCollaborators() {
    const { data, isLoading, error } = useCollaborationWeekly();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Top Collaborators</h3>
                <div className="space-y-3 flex-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="bg-gray-100 animate-pulse rounded h-16" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data || data.top_collaborators.length === 0) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-full flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex-shrink-0">Top Collaborators</h3>
                <div className="bg-gray-50 rounded p-8 text-center flex-1 flex items-center justify-center flex-col">
                    <p className="text-gray-500">No collaboration data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 h-full flex flex-col">
            <h3 className="text-lg font-semibold mb-1 flex-shrink-0">Top Collaborators</h3>
            <p className="text-sm text-gray-600 mb-4 flex-shrink-0">
                People you've worked with most this week
            </p>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {data.top_collaborators.slice(0, 10).map((collaborator: Collaborator, index: number) => (
                    <div
                        key={collaborator.email || collaborator.name}
                        onClick={() => collaborator.email && (window.location.href = `mailto:${collaborator.email}`)}
                        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors ${collaborator.email ? 'cursor-pointer' : ''}`}
                    >
                        <div className="flex items-center gap-3">
                            {/* Rank badge */}
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                                #{index + 1}
                            </div>

                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                {collaborator.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Info */}
                            <div>
                                <p className="font-medium text-gray-900">{collaborator.name}</p>
                                {collaborator.email && (
                                    <p className="text-sm text-gray-500">{collaborator.email}</p>
                                )}
                            </div>
                        </div>

                        {/* Interaction count */}
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-sm font-semibold text-gray-900">
                                    {collaborator.interaction_count}
                                </p>
                                <p className="text-xs text-gray-500">interactions</p>
                            </div>

                            {/* Actions */}
                            {collaborator.email && (
                                <a
                                    href={`mailto:${collaborator.email}`}
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                    title="Send email"
                                >
                                    <Mail className="w-4 h-4 text-gray-600" />
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {data.top_collaborators.length > 10 && (
                <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0">
                    View all {data.top_collaborators.length} collaborators →
                </button>
            )}
        </div>
    );
}
