import { useProjects } from '../../lib/hooks/useApi'
import { Folder, Clock, Activity } from 'lucide-react'

function LoadingSkeleton() {
    return (
        <div>
            <div className="mb-4">
                <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                        <div className="w-40 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
                        <div className="space-y-2">
                            {[1, 2, 3].map(j => (
                                <div key={j} className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ProjectCards() {
    const { data, isLoading, isError } = useProjects()

    if (isLoading) return <LoadingSkeleton />

    // Group activities by application/source as "projects"
    const activities = Array.isArray(data) ? data : (data as any)?.items || []

    // Group by application
    const projectMap = new Map<string, { hours: number; count: number; lastSeen: string }>()
    activities.forEach((act: any) => {
        const app = act.application || act.source || 'Unknown'
        const existing = projectMap.get(app) || { hours: 0, count: 0, lastSeen: '' }
        existing.hours += (act.duration_seconds || 0) / 3600
        existing.count += 1
        if (!existing.lastSeen || act.timestamp > existing.lastSeen) {
            existing.lastSeen = act.timestamp || ''
        }
        projectMap.set(app, existing)
    })

    const projects = Array.from(projectMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.hours - a.hours)
        .slice(0, 6)

    return (
        <div>
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">Active Projects</h2>
                <p className="text-sm text-soft-gray mt-1">Grouped by application usage</p>
            </div>

            {isError ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                    <p className="text-sm text-red-500">Failed to load projects</p>
                </div>
            ) : projects.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-soft-gray">
                    <Folder className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No project data yet</p>
                    <p className="text-sm mt-1">Projects will appear as activities are tracked</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {projects.map(project => (
                        <div key={project.name} className="bg-white dark:bg-gray-800 rounded-xl border-l-4 border-l-navy border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all">
                            <h3 className="text-lg font-semibold text-charcoal dark:text-white mb-3">{project.name}</h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-soft-gray">
                                    <Clock className="w-4 h-4" />
                                    <span>{project.hours.toFixed(1)} hours tracked</span>
                                </div>
                                <div className="flex items-center gap-2 text-soft-gray">
                                    <Activity className="w-4 h-4" />
                                    <span>{project.count} activities</span>
                                </div>
                                {project.lastSeen && (
                                    <div className="text-xs text-soft-gray mt-2">
                                        Last active: {new Date(project.lastSeen).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
