'use client';

import { useState } from 'react';
import { Search, User, Building2, Wrench, Brain, MapPin, Tag, ChevronRight } from 'lucide-react';
import { useEntities, type EntityItem } from '@/lib/hooks/useEntities';

const ENTITY_TYPES = [
    { id: 'all', label: 'All', icon: Tag },
    { id: 'person', label: 'People', icon: User },
    { id: 'organization', label: 'Orgs', icon: Building2 },
    { id: 'artifact', label: 'Tools', icon: Wrench },
    { id: 'skill', label: 'Skills', icon: Brain },
    { id: 'concept', label: 'Concepts', icon: MapPin },
] as const;

const TYPE_COLORS: Record<string, string> = {
    person: 'bg-blue-100 text-blue-700',
    organization: 'bg-purple-100 text-purple-700',
    artifact: 'bg-green-100 text-green-700',
    skill: 'bg-orange-100 text-orange-700',
    concept: 'bg-teal-100 text-teal-700',
    event: 'bg-red-100 text-red-700',
    project: 'bg-indigo-100 text-indigo-700',
    interaction: 'bg-gray-100 text-gray-700',
    unknown: 'bg-gray-100 text-gray-500',
};

const TYPE_ICONS: Record<string, React.ElementType> = {
    person: User,
    organization: Building2,
    artifact: Wrench,
    skill: Brain,
    concept: MapPin,
    event: Tag,
    project: Tag,
    interaction: Tag,
    unknown: Tag,
};

// org_type display labels and colors
const ORG_TYPE_COLORS: Record<string, string> = {
    company:          'bg-amber-100 text-amber-700',
    educational:      'bg-blue-100 text-blue-700',
    government:       'bg-red-100 text-red-700',
    open_source:      'bg-green-100 text-green-700',
    media:            'bg-pink-100 text-pink-700',
    cloud:            'bg-sky-100 text-sky-700',
    developer_tools:  'bg-violet-100 text-violet-700',
    social_media:     'bg-orange-100 text-orange-700',
    community:        'bg-teal-100 text-teal-700',
    productivity:     'bg-indigo-100 text-indigo-700',
};

interface EntityListProps {
    onSelectEntity?: (entity: EntityItem) => void;
    selectedEntityId?: string | null;
}

export function EntityList({ onSelectEntity, selectedEntityId }: EntityListProps) {
    const [activeType, setActiveType] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;

    const { data, isLoading, isError } = useEntities(
        activeType === 'all' ? undefined : activeType,
        PAGE_SIZE,
        page * PAGE_SIZE
    );

    const entities = data?.entities ?? [];
    const total = data?.total ?? 0;

    // Client-side search filter
    const filtered = search.trim()
        ? entities.filter(
            e =>
                e.canonical_name.toLowerCase().includes(search.toLowerCase()) ||
                e.aliases.some(a => a.toLowerCase().includes(search.toLowerCase()))
        )
        : entities;

    const handleTypeChange = (typeId: string) => {
        setActiveType(typeId);
        setPage(0);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Type filter tabs */}
            <div className="flex gap-1 flex-wrap">
                {ENTITY_TYPES.map(type => {
                    const Icon = type.icon;
                    const isActive = activeType === type.id;
                    return (
                        <button
                            key={type.id}
                            onClick={() => handleTypeChange(type.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {type.label}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search entities..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
            )}

            {/* Error */}
            {isError && (
                <div className="text-center py-12 text-red-500">
                    Failed to load entities. Please try again.
                </div>
            )}

            {/* Empty */}
            {!isLoading && !isError && filtered.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No entities found</p>
                    <p className="text-sm mt-1">
                        {total === 0
                            ? 'Entities are extracted automatically from your activities'
                            : 'Try a different filter or search term'}
                    </p>
                </div>
            )}

            {/* Entity cards */}
            <div className="flex flex-col gap-2">
                {filtered.map(entity => {
                    const Icon = TYPE_ICONS[entity.entity_type] ?? Tag;
                    const colorClass = TYPE_COLORS[entity.entity_type] ?? 'bg-gray-100 text-gray-500';
                    const isSelected = selectedEntityId === entity.id;

                    return (
                        <button
                            key={entity.id}
                            onClick={() => onSelectEntity?.(entity)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${isSelected
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/30'
                                }`}
                        >
                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                                <Icon className="w-4 h-4" />
                            </div>

                        {/* Name + aliases + org badges */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                    {entity.canonical_name}
                                </p>
                                {entity.aliases.length > 0 && (
                                    <p className="text-xs text-gray-400 truncate mt-0.5">
                                        {entity.aliases.slice(0, 3).join(' · ')}
                                    </p>
                                )}
                                {/* Org type + industry badges */}
                                {entity.entity_type === 'organization' && (entity.org_type || entity.industry) && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {entity.org_type && (
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ORG_TYPE_COLORS[entity.org_type] ?? 'bg-gray-100 text-gray-500'}`}>
                                                {entity.org_type.replace(/_/g, ' ')}
                                            </span>
                                        )}
                                        {entity.industry && (
                                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                                {entity.industry}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Occurrence badge + arrow */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                    {entity.occurrence_count}×
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && !search && (
                <div className="flex items-center justify-between pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                    >
                        ← Prev
                    </button>
                    <span className="text-sm text-gray-500">
                        Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={(page + 1) * PAGE_SIZE >= total}
                        className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}
