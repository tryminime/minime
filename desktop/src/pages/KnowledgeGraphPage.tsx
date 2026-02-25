import KnowledgeGraph from '../components/dashboard/KnowledgeGraph'
import { ZoomIn, ZoomOut, Maximize2, Download } from 'lucide-react'

export default function KnowledgeGraphPage() {
    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-charcoal dark:text-white">Knowledge Graph</h1>
                    <p className="text-sm text-soft-gray mt-1">Explore your research network and connections</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ZoomIn className="w-5 h-5" />
                    </button>
                    <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ZoomOut className="w-5 h-5" />
                    </button>
                    <button className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <Maximize2 className="w-5 h-5" />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark transition-colors">
                        <Download className="w-5 h-5" />
                        <span>Export</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-soft-gray mb-1">Total Nodes</div>
                    <div className="text-2xl font-semibold text-charcoal dark:text-white">247</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-soft-gray mb-1">Connections</div>
                    <div className="text-2xl font-semibold text-charcoal dark:text-white">532</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-soft-gray mb-1">People</div>
                    <div className="text-2xl font-semibold text-charcoal dark:text-white">42</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-soft-gray mb-1">Papers</div>
                    <div className="text-2xl font-semibold text-charcoal dark:text-white">65</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-soft-gray mb-1">Concepts</div>
                    <div className="text-2xl font-semibold text-charcoal dark:text-white">140</div>
                </div>
            </div>

            {/* Full-size Graph */}
            <div className="h-[600px]">
                <KnowledgeGraph />
            </div>
        </div>
    )
}
