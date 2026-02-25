import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Clock, Target, Activity, BarChart3 } from 'lucide-react'
import { useProductivityMetrics, useWeeklySummary } from '../lib/hooks/useApi'

export default function Analytics() {
    const { data: productivity, isLoading: loadingProd, isError: errorProd } = useProductivityMetrics()
    const { data: weekly, isLoading: loadingWeekly } = useWeeklySummary()

    const isLoading = loadingProd || loadingWeekly

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <div className="w-28 h-7 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="w-64 h-4 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
                            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                            <div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const totalHours = productivity?.total_hours ?? 0
    const focusScore = productivity?.focus_score ?? 0
    const deepWorkHours = productivity?.deep_work_hours ?? 0
    const contextSwitches = productivity?.context_switches ?? 0
    const productivityRatio = productivity?.productivity_ratio ?? 0
    const deepWorkPct = totalHours > 0 ? Math.round((deepWorkHours / totalHours) * 100) : 0

    // Time allocation from API
    const timeAlloc = productivity?.time_allocation || {}
    const byCategory = timeAlloc.by_category || []
    const categoryData = byCategory.length > 0
        ? byCategory.map((c: any, i: number) => ({
            name: c.name || c.category || `Category ${i + 1}`,
            value: c.hours || c.value || 0,
            color: ['#003D82', '#2E8FD8', '#7A8FA0', '#20B2AA', '#E67E22', '#9B59B6'][i % 6],
        }))
        : [
            { name: 'No data', value: 1, color: '#E5E7EB' },
        ]

    const topApps = productivity?.top_apps || []

    return (
        <div className="p-6 space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-semibold text-charcoal dark:text-white">Analytics</h1>
                <p className="text-sm text-soft-gray mt-1">Detailed insights into your productivity patterns</p>
            </div>

            {errorProd && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">Failed to load productivity data. Check backend connection.</p>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-navy/10 rounded-lg">
                            <Clock className="w-5 h-5 text-navy" />
                        </div>
                        <span className="text-sm text-soft-gray">Total Hours</span>
                    </div>
                    <div className="text-3xl font-semibold text-charcoal dark:text-white">{totalHours}h</div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-navy/10 rounded-lg">
                            <Target className="w-5 h-5 text-navy" />
                        </div>
                        <span className="text-sm text-soft-gray">Focus Score</span>
                    </div>
                    <div className="text-3xl font-semibold text-charcoal dark:text-white">{focusScore}</div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-navy/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-navy" />
                        </div>
                        <span className="text-sm text-soft-gray">Deep Work</span>
                    </div>
                    <div className="text-3xl font-semibold text-charcoal dark:text-white">{deepWorkHours}h</div>
                    <div className="text-sm text-soft-gray mt-1">{deepWorkPct}% of total time</div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-navy/10 rounded-lg">
                            <Activity className="w-5 h-5 text-navy" />
                        </div>
                        <span className="text-sm text-soft-gray">Context Switches</span>
                    </div>
                    <div className="text-3xl font-semibold text-charcoal dark:text-white">{contextSwitches}</div>
                    <div className="text-sm text-soft-gray mt-1">Productivity: {(productivityRatio * 100).toFixed(0)}%</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Time Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Time Distribution</h2>
                    {categoryData.length === 1 && categoryData[0].name === 'No data' ? (
                        <div className="text-center py-12 text-soft-gray">
                            <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="font-medium">No time allocation data yet</p>
                            <p className="text-sm mt-1">Start tracking to see your time distribution</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Weekly Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Weekly Summary</h2>
                    {weekly ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <div className="text-sm text-soft-gray">Week</div>
                                    <div className="text-sm font-medium text-charcoal dark:text-white">{weekly.week_start} — {weekly.week_end}</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <div className="text-sm text-soft-gray">Wellness</div>
                                    <div className="text-lg font-semibold text-charcoal dark:text-white">{weekly.wellness_score?.toFixed(0) ?? 0}%</div>
                                </div>
                            </div>

                            {weekly.goals_summary && (
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                    <div className="text-sm text-soft-gray mb-1">Goals</div>
                                    <div className="text-sm text-charcoal dark:text-white">
                                        Active: {weekly.goals_summary.active ?? 0} &middot;
                                        Completed: {weekly.goals_summary.completed_this_week ?? 0} &middot;
                                        Streak: {weekly.goals_summary.streak ?? 0}
                                    </div>
                                </div>
                            )}

                            {weekly.suggestions && weekly.suggestions.length > 0 && (
                                <div>
                                    <p className="text-xs text-soft-gray uppercase tracking-wide font-medium mb-2">Suggestions</p>
                                    <ul className="space-y-1">
                                        {weekly.suggestions.map((s: string, i: number) => (
                                            <li key={i} className="text-sm text-charcoal dark:text-white">💡 {s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-soft-gray">
                            <p>No weekly summary available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Applications */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Top Applications</h2>
                {topApps.length === 0 ? (
                    <div className="text-center py-8 text-soft-gray">
                        <p className="font-medium">No application usage data yet</p>
                        <p className="text-sm mt-1">Start tracking to see which apps you use most</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {topApps.map((app: any) => (
                            <div key={app.name} className="flex items-center gap-4">
                                <div className="w-32 text-sm font-medium text-charcoal dark:text-white">{app.name}</div>
                                <div className="flex-1">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                        <div
                                            className="bg-navy h-3 rounded-full transition-all"
                                            style={{ width: `${app.percentage}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="w-20 text-right text-sm text-soft-gray">{app.hours}h</div>
                                <div className="w-16 text-right text-sm font-medium text-charcoal dark:text-white">{app.percentage}%</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
