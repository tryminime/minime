'use client';

import { Tag, User, Building2, Wrench, Brain, MapPin } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ElementType> = {
    person: User,
    organization: Building2,
    tool: Wrench,
    skill: Brain,
    place: MapPin,
    concept: Tag,
    unknown: Tag,
};

const TYPE_COLORS: Record<string, string> = {
    person: 'bg-blue-100 text-blue-700',
    organization: 'bg-purple-100 text-purple-700',
    tool: 'bg-green-100 text-green-700',
    skill: 'bg-orange-100 text-orange-700',
    place: 'bg-teal-100 text-teal-700',
    concept: 'bg-gray-100 text-gray-600',
    unknown: 'bg-gray-100 text-gray-500',
};

const CAT_COLORS: Record<string, string> = {
    development: 'bg-indigo-100 text-indigo-700',
    communication: 'bg-sky-100 text-sky-700',
    meeting: 'bg-yellow-100 text-yellow-700',
    research: 'bg-violet-100 text-violet-700',
    design: 'bg-pink-100 text-pink-700',
    project_management: 'bg-amber-100 text-amber-700',
    ai_tools: 'bg-fuchsia-100 text-fuchsia-700',
    productivity: 'bg-lime-100 text-lime-700',
    cloud: 'bg-cyan-100 text-cyan-700',
    other: 'bg-gray-100 text-gray-600',
};

export interface EnrichmentTagsProps {
    /** Auto-tags from enrichment pipeline, e.g. ["development", "ide"] */
    tags?: string[];
    primaryCategory?: string;
    confidence?: number;
    /** Extracted entities attached to this activity */
    entities?: Array<{
        id: string;
        canonical_name: string;
        entity_type: string;
    }>;
    onEntityClick?: (entityId: string) => void;
    compact?: boolean;
}

export function AutoTagDisplay({
    tags = [],
    primaryCategory,
    confidence,
    entities = [],
    onEntityClick,
    compact = false,
}: EnrichmentTagsProps) {
    if (tags.length === 0 && entities.length === 0) return null;

    const catColor = primaryCategory
        ? (CAT_COLORS[primaryCategory] ?? CAT_COLORS.other)
        : CAT_COLORS.other;

    return (
        <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-1' : 'mt-2'}`}>
            {/* Primary category badge */}
            {primaryCategory && (
                <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${catColor}`}
                >
                    <Tag className="w-2.5 h-2.5" />
                    {primaryCategory.replace(/_/g, ' ')}
                    {confidence !== undefined && !compact && (
                        <span className="opacity-60">{Math.round(confidence * 100)}%</span>
                    )}
                </span>
            )}

            {/* Additional tags (max 2 if compact) */}
            {tags
                .filter(t => t !== primaryCategory)
                .slice(0, compact ? 1 : 3)
                .map(tag => (
                    <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500"
                    >
                        {tag.replace(/_/g, ' ')}
                    </span>
                ))}

            {/* Entity chips */}
            {entities.slice(0, compact ? 2 : 5).map(entity => {
                const Icon = TYPE_ICONS[entity.entity_type] ?? Tag;
                const color = TYPE_COLORS[entity.entity_type] ?? 'bg-gray-100 text-gray-500';
                return (
                    <button
                        key={entity.id}
                        onClick={() => onEntityClick?.(entity.id)}
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-opacity hover:opacity-80 ${color}`}
                    >
                        <Icon className="w-2.5 h-2.5" />
                        {entity.canonical_name.length > 14 && compact
                            ? entity.canonical_name.slice(0, 14) + '…'
                            : entity.canonical_name}
                    </button>
                );
            })}
        </div>
    );
}
