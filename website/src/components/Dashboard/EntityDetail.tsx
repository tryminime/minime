'use client';

import { X, User, Building2, Wrench, Brain, MapPin, Tag, Clock, Hash, ExternalLink } from 'lucide-react';
import { useEntity } from '@/lib/hooks/useEntities';
import type { EntityItem } from '@/lib/hooks/useEntities';

const TYPE_ICONS: Record<string, React.ElementType> = {
    person: User,
    organization: Building2,
    tool: Wrench,
    skill: Brain,
    place: MapPin,
    concept: Tag,
    unknown: Tag,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    person: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    organization: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    tool: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    skill: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    place: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

interface EntityDetailProps {
    entity: EntityItem;
    onClose: () => void;
    onFindDuplicates?: (entity: EntityItem) => void;
}

function formatDate(dateStr?: string) {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function EntityDetail({ entity, onClose, onFindDuplicates }: EntityDetailProps) {
    const { data: detail, isLoading } = useEntity(entity.id);
    const colors = TYPE_COLORS[entity.entity_type] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    const Icon = TYPE_ICONS[entity.entity_type] ?? Tag;
    const displayEntity = detail ?? entity;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`flex items-start gap-3 p-5 ${colors.bg} border-b ${colors.border}`}>
                <div className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg text-gray-900 truncate">
                        {displayEntity.canonical_name}
                    </h2>
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border} mt-1`}>
                        {displayEntity.entity_type}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/60 flex-shrink-0"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <Hash className="w-3 h-3" />
                            Occurrences
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {displayEntity.occurrence_count}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <ExternalLink className="w-3 h-3" />
                            Linked activities
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            {displayEntity.linked_activity_count ?? '—'}
                        </p>
                    </div>
                </div>

                {/* Timestamps */}
                <div className="space-y-2">
                    {displayEntity.first_seen && (
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">First seen:</span>
                            <span className="text-gray-900 font-medium">{formatDate(displayEntity.first_seen)}</span>
                        </div>
                    )}
                    {displayEntity.last_seen && (
                        <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-500">Last seen:</span>
                            <span className="text-gray-900 font-medium">{formatDate(displayEntity.last_seen)}</span>
                        </div>
                    )}
                </div>

                {/* Aliases */}
                {displayEntity.aliases.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Aliases</h3>
                        <div className="flex flex-wrap gap-2">
                            {displayEntity.aliases.map(alias => (
                                <span
                                    key={alias}
                                    className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full"
                                >
                                    {alias}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* External IDs */}
                {displayEntity.metadata && Object.keys(displayEntity.metadata).length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">External IDs</h3>
                        <div className="space-y-1">
                            {Object.entries(displayEntity.metadata).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400 capitalize w-20 flex-shrink-0">{key}:</span>
                                    <span className="text-gray-700 font-mono text-xs truncate">{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-gray-100 flex gap-2">
                <button
                    onClick={() => onFindDuplicates?.(entity)}
                    className="flex-1 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Find Duplicates
                </button>
            </div>
        </div>
    );
}
