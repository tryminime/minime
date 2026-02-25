import DocumentList from '../components/dashboard/DocumentList'
import { Plus, Upload } from 'lucide-react'
import { usePapers } from '../lib/hooks/useApi'

export default function Papers() {
    const { data, isLoading } = usePapers()

    const entities = Array.isArray(data) ? data : (data as any)?.items || []
    const totalEntities = entities.length

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-charcoal dark:text-white">Papers & Documents</h1>
                    <p className="text-sm text-soft-gray mt-1">Track your research publications and writing</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Upload className="w-5 h-5" />
                        <span>Import</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark transition-colors">
                        <Plus className="w-5 h-5" />
                        <span>New Paper</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="text-sm text-soft-gray mb-1">Total Entities</div>
                    <div className="text-3xl font-semibold text-charcoal dark:text-white">
                        {isLoading ? '—' : totalEntities}
                    </div>
                    <div className="text-sm text-soft-gray mt-1">Extracted from activities</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="text-sm text-soft-gray mb-1">Entity Types</div>
                    <div className="text-3xl font-semibold text-charcoal dark:text-white">
                        {isLoading ? '—' : new Set(entities.map((e: any) => e.type).filter(Boolean)).size}
                    </div>
                    <div className="text-sm text-soft-gray mt-1">Unique categories</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="text-sm text-soft-gray mb-1">High Confidence</div>
                    <div className="text-3xl font-semibold text-charcoal dark:text-white">
                        {isLoading ? '—' : entities.filter((e: any) => (e.confidence ?? 0) > 0.8).length}
                    </div>
                    <div className="text-sm text-soft-gray mt-1">&gt; 80% confidence</div>
                </div>
            </div>

            {/* Document List */}
            <DocumentList />
        </div>
    )
}
