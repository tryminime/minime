import { useDashboardSummary } from '../../lib/hooks/useApi'
import { Activity, TrendingUp, Brain, Target, Clock, Zap, BarChart3, Award } from 'lucide-react'

function StatCard({ icon: Icon, label, value, trend, color }: {
    icon: any
    label: string
    value: string | number
    trend?: number
    color: string
}) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-soft-gray font-medium">{label}</span>
            </div>
            <div className="text-2xl font-bold text-charcoal dark:text-white">{value}</div>
            {trend !== undefined && trend !== 0 && (
                <div className={`text-sm mt-1 ${trend > 0 ? 'text-teal' : 'text-red-500'}`}>
                    {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
                </div>
            )}
        </div>
    )
}

function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                        <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                    </div>
                    <div className="w-16 h-7 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
            ))}
        </div>
    )
}

export default function KPICards() {
    const { data, isLoading, isError } = useDashboardSummary()

    if (isLoading) return <LoadingSkeleton />

    if (isError || !data) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-700 p-6 text-center">
                <p className="text-red-600 dark:text-red-400 font-medium">Unable to load dashboard data</p>
                <p className="text-sm text-red-500 mt-1">Check that the backend is running on localhost:8000</p>
            </div>
        )
    }

    const kpis = data.kpis || {}

    const stats = [
        {
            icon: Clock,
            label: 'Total Hours',
            value: `${kpis.total_hours ?? 0}h`,
            color: 'bg-navy',
        },
        {
            icon: Brain,
            label: 'Focus Score',
            value: kpis.focus_score ?? 0,
            color: 'bg-teal',
        },
        {
            icon: Zap,
            label: 'Deep Work',
            value: `${kpis.deep_work_hours ?? 0}h`,
            color: 'bg-blue-500',
        },
        {
            icon: Target,
            label: 'Goals Completed',
            value: `${kpis.goals_completed ?? 0}/${kpis.active_goals ?? 0}`,
            color: 'bg-purple-500',
        },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {stats.map(stat => (
                <StatCard key={stat.label} {...stat} />
            ))}
        </div>
    )
}
