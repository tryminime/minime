import { CheckCircle2, Circle, Clock, ListTodo, AlertCircle } from 'lucide-react'
import { useWeeklySummary } from '../lib/hooks/useApi'

export default function Tasks() {
    const { data: weekly, isLoading, isError } = useWeeklySummary()

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <div className="w-20 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-56 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                            <div className="w-12 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const goals = weekly?.goals_summary || {}
    const activeGoals = goals.active ?? 0
    const completedGoals = goals.completed_this_week ?? 0
    const streak = goals.streak ?? 0

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold text-charcoal dark:text-white">Tasks & Goals</h1>
                <p className="text-sm text-soft-gray mt-1">Track your research and project goals</p>
            </div>

            {isError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">Failed to load task data. Check backend connection.</p>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Circle className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-soft-gray">Active Goals</span>
                    </div>
                    <div className="text-3xl font-semibold text-charcoal dark:text-white">{activeGoals}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-teal" />
                        <span className="text-sm text-soft-gray">Completed This Week</span>
                    </div>
                    <div className="text-3xl font-semibold text-teal">{completedGoals}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-soft-gray">Current Streak</span>
                    </div>
                    <div className="text-3xl font-semibold text-purple-500">{streak} days</div>
                </div>
            </div>

            {/* Empty state */}
            {activeGoals === 0 && completedGoals === 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <ListTodo className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-xl font-semibold text-charcoal dark:text-white mb-2">No tasks or goals yet</h3>
                    <p className="text-soft-gray max-w-md mx-auto">
                        Set goals via the API or CLI to track your progress. MiniMe will automatically
                        provide suggestions and track completion from your weekly summaries.
                    </p>
                </div>
            )}

            {/* Weekly Highlights */}
            {weekly?.highlights && weekly.highlights.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Weekly Highlights</h2>
                    <div className="space-y-3">
                        {weekly.highlights.map((highlight: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-navy mt-0.5" />
                                <p className="text-sm text-charcoal dark:text-white">{highlight}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Suggestions */}
            {weekly?.suggestions && weekly.suggestions.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-charcoal dark:text-white mb-4">AI Suggestions</h2>
                    <div className="space-y-3">
                        {weekly.suggestions.map((suggestion: string, i: number) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-teal/5 border border-teal/20 rounded-lg">
                                <span className="text-lg">💡</span>
                                <p className="text-sm text-charcoal dark:text-white">{suggestion}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
