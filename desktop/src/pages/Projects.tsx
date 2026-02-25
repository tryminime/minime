import ProjectCards from '../components/dashboard/ProjectCards'
import { Plus, Filter, Search } from 'lucide-react'

export default function Projects() {
    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-charcoal dark:text-white">Projects</h1>
                    <p className="text-sm text-soft-gray mt-1">Manage your research and development projects</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg hover:bg-navy-dark transition-colors">
                    <Plus className="w-5 h-5" />
                    <span>New Project</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-soft-gray" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <Filter className="w-5 h-5" />
                    <span>Filter</span>
                </button>
            </div>

            {/* Project Cards */}
            <ProjectCards />
        </div>
    )
}
