import { useActivityTimeline } from '../../lib/hooks/useApi'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function LoadingSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="w-40 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="w-60 h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
            <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
    )
}

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-charcoal dark:text-white mb-1">{label}</p>
            {payload.map((entry: any) => (
                <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}h
                </p>
            ))}
        </div>
    )
}

export default function ActivityChart() {
    const { data, isLoading, isError } = useActivityTimeline()

    if (isLoading) return <LoadingSkeleton />

    if (isError) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white mb-1">Activity Timeline</h2>
                <div className="mt-4 text-center py-12">
                    <p className="text-red-500 font-medium">Failed to load activity data</p>
                    <p className="text-sm text-soft-gray mt-1">Check backend connection</p>
                </div>
            </div>
        )
    }

    // Build chart data from weekly summary
    const summary = data as any
    const chartData = summary?.top_activities && summary.top_activities.length > 0
        ? summary.top_activities
        : [
            { day: 'Mon', hours: 0 },
            { day: 'Tue', hours: 0 },
            { day: 'Wed', hours: 0 },
            { day: 'Thu', hours: 0 },
            { day: 'Fri', hours: 0 },
            { day: 'Sat', hours: 0 },
            { day: 'Sun', hours: 0 },
        ]

    const hasData = chartData.some((d: any) => (d.hours || d.deepWork || d.total_hours || 0) > 0)

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">Activity Timeline</h2>
                <p className="text-sm text-soft-gray mt-1">
                    {summary?.week_start && summary?.week_end
                        ? `${summary.week_start} — ${summary.week_end}`
                        : 'Weekly activity overview'}
                </p>
                {summary && (
                    <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-soft-gray">Total: <span className="text-charcoal dark:text-white font-medium">{summary.total_hours?.toFixed(1) ?? 0}h</span></span>
                        <span className="text-soft-gray">Productivity: <span className="text-charcoal dark:text-white font-medium">{summary.productivity_score?.toFixed(0) ?? 0}%</span></span>
                        <span className="text-soft-gray">Wellness: <span className="text-charcoal dark:text-white font-medium">{summary.wellness_score?.toFixed(0) ?? 0}%</span></span>
                    </div>
                )}
            </div>

            {!hasData ? (
                <div className="text-center py-16 text-soft-gray">
                    <p className="text-lg font-medium">No activity data yet</p>
                    <p className="text-sm mt-1">Start tracking your work to see activity charts here</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#1B2A4A" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#1B2A4A" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
                        <YAxis stroke="#9CA3AF" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="hours" stroke="#1B2A4A" fill="url(#colorHours)" strokeWidth={2} name="Hours" />
                    </AreaChart>
                </ResponsiveContainer>
            )}

            {/* Highlights */}
            {summary?.highlights && summary.highlights.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-soft-gray uppercase tracking-wide font-medium mb-2">Highlights</p>
                    <ul className="space-y-1">
                        {summary.highlights.map((h: string, i: number) => (
                            <li key={i} className="text-sm text-charcoal dark:text-white">• {h}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
