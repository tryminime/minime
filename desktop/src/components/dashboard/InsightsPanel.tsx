import { useInsights } from '../../lib/hooks/useApi'
import { Lightbulb, TrendingUp, Wrench, Users, Clock, Sparkles } from 'lucide-react'

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
    productivity: { icon: TrendingUp, color: 'text-teal', bg: 'bg-teal/10' },
    technical: { icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    collaboration: { icon: Users, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    deadline: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
}

function LoadingSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="w-28 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
            </div>
        </div>
    )
}

export default function InsightsPanel() {
    const { data: insights, isLoading, isError } = useInsights()

    if (isLoading) return <LoadingSkeleton />

    if (isError) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white mb-4">AI Insights</h2>
                <p className="text-sm text-red-500">Failed to load insights</p>
            </div>
        )
    }

    const insightsList = insights || []

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-teal" />
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">AI Insights</h2>
                <span className="text-xs px-2 py-0.5 bg-teal/10 text-teal rounded-full font-medium">{insightsList.length}</span>
            </div>

            {insightsList.length === 0 ? (
                <div className="text-center py-8 text-soft-gray">
                    <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No insights yet</p>
                    <p className="text-sm mt-1">Insights will appear as you track more activity</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {insightsList.map((insight: any) => {
                        const config = typeConfig[insight.type] || typeConfig.productivity
                        const Icon = config.icon
                        return (
                            <div key={insight.id} className={`p-4 rounded-lg ${config.bg} border border-gray-200 dark:border-gray-700`}>
                                <div className="flex items-start gap-3">
                                    <Icon className={`w-5 h-5 mt-0.5 ${config.color}`} />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-charcoal dark:text-white">{insight.title}</h4>
                                        <p className="text-sm text-soft-gray mt-1">{insight.description}</p>
                                        {insight.impact && (
                                            <span className={`inline-block text-xs mt-2 px-2 py-0.5 rounded-full ${config.bg} ${config.color} font-medium`}>
                                                {insight.impact}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
