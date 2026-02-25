import { usePapers } from '../../lib/hooks/useApi'
import { FileText, ExternalLink } from 'lucide-react'

function LoadingSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="w-40 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
            </div>
        </div>
    )
}

export default function DocumentList() {
    const { data, isLoading, isError } = usePapers()

    if (isLoading) return <LoadingSkeleton />

    const entities = Array.isArray(data) ? data : (data as any)?.items || []

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">Documents & Entities</h2>
                <p className="text-sm text-soft-gray mt-1">Extracted knowledge entities</p>
            </div>

            {isError ? (
                <div className="text-center py-8">
                    <p className="text-sm text-red-500">Failed to load documents</p>
                </div>
            ) : entities.length === 0 ? (
                <div className="text-center py-12 text-soft-gray">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No documents or entities yet</p>
                    <p className="text-sm mt-1">Entities will be extracted from your tracked activities</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {entities.map((entity: any, i: number) => (
                        <div key={entity.id || i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-navy/10 rounded">
                                    <FileText className="w-5 h-5 text-navy" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-charcoal dark:text-white">
                                        {entity.name || entity.text || entity.label || `Entity ${i + 1}`}
                                    </h3>
                                    {entity.type && (
                                        <span className="inline-block text-xs bg-gray-100 dark:bg-gray-700 text-soft-gray px-2 py-0.5 rounded-full mt-1">
                                            {entity.type}
                                        </span>
                                    )}
                                    {entity.confidence && (
                                        <span className="inline-block text-xs text-soft-gray ml-2 mt-1">
                                            Confidence: {(entity.confidence * 100).toFixed(0)}%
                                        </span>
                                    )}
                                    {entity.source && (
                                        <div className="text-xs text-soft-gray mt-2">Source: {entity.source}</div>
                                    )}
                                </div>
                                {entity.url && (
                                    <a href={entity.url} target="_blank" rel="noopener noreferrer" className="text-navy hover:text-navy-dark">
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
