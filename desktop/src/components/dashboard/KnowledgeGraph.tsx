import { useKnowledgeGraph } from '../../lib/hooks/useApi'
import { useEffect, useRef } from 'react'
import { Network, Share2 } from 'lucide-react'

interface Entity {
    id: string
    name?: string
    text?: string
    label?: string
    type?: string
    confidence?: number
}

const typeColors: Record<string, string> = {
    PERSON: '#2E8FD8',
    ORG: '#9B59B6',
    GPE: '#20B2AA',
    TECH: '#E67E22',
    EVENT: '#E74C3C',
    default: '#7A8FA0',
}

function LoadingSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="w-40 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
    )
}

export default function KnowledgeGraph() {
    const { data, isLoading, isError } = useKnowledgeGraph()

    if (isLoading) return <LoadingSkeleton />

    const entities: Entity[] = Array.isArray(data) ? data : (data as any)?.items || []

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
                <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-navy" />
                    <h2 className="text-lg font-semibold text-charcoal dark:text-white">Knowledge Graph</h2>
                    <span className="text-xs px-2 py-0.5 bg-navy/10 text-navy rounded-full font-medium">
                        {entities.length} entities
                    </span>
                </div>
                <p className="text-sm text-soft-gray mt-1">Extracted knowledge entities from your activities</p>
            </div>

            {isError ? (
                <div className="text-center py-8">
                    <p className="text-sm text-red-500">Failed to load knowledge graph</p>
                </div>
            ) : entities.length === 0 ? (
                <div className="text-center py-16 text-soft-gray">
                    <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-lg">No entities extracted yet</p>
                    <p className="text-sm mt-1">As you work, MiniMe will extract entities to build your knowledge graph</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {entities.slice(0, 20).map((entity, i) => {
                        const entityType = entity.type || 'default'
                        const color = typeColors[entityType.toUpperCase()] || typeColors.default
                        return (
                            <div key={entity.id || i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:shadow-md transition-all">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-charcoal dark:text-white">
                                        {entity.name || entity.text || entity.label || `Entity ${i + 1}`}
                                    </span>
                                </div>
                                {entity.type && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-soft-gray rounded-full">
                                        {entity.type}
                                    </span>
                                )}
                                {entity.confidence !== undefined && (
                                    <span className="text-xs text-soft-gray">
                                        {(entity.confidence * 100).toFixed(0)}%
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Legend */}
            {entities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 text-xs">
                    {Object.entries(typeColors).filter(([k]) => k !== 'default').map(([type, color]) => (
                        <div key={type} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="capitalize">{type.toLowerCase()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
