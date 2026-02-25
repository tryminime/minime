import { useWellnessMetrics } from '../../lib/hooks/useApi'
import { Heart, AlertTriangle, Moon, Battery, Shield } from 'lucide-react'

function LoadingSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
            </div>
        </div>
    )
}

function MetricBar({ label, value, max, color, icon: Icon }: {
    label: string; value: number; max: number; color: string; icon: any
}) {
    const pct = Math.min(100, Math.round((value / max) * 100))
    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-soft-gray" />
                    <span className="text-sm text-charcoal dark:text-white">{label}</span>
                </div>
                <span className="text-sm font-medium text-charcoal dark:text-white">{value}/{max}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    )
}

export default function WellnessPanel() {
    const { data, isLoading, isError } = useWellnessMetrics()

    if (isLoading) return <LoadingSkeleton />

    if (isError || !data) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white mb-4">Wellness</h2>
                <p className="text-sm text-red-500">Failed to load wellness data</p>
            </div>
        )
    }

    const overallScore = data.overall_score ?? 0
    const burnout = data.burnout_risk ?? {}
    const wlb = data.work_life_balance ?? {}
    const rest = data.rest_recovery ?? {}

    const scoreColor = overallScore >= 70 ? 'text-teal' : overallScore >= 40 ? 'text-yellow-500' : 'text-red-500'
    const burnoutLevel = burnout.level ?? 'unknown'
    const burnoutColor = burnoutLevel === 'low' ? 'bg-teal' : burnoutLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-charcoal dark:text-white">Wellness</h2>
                    <p className="text-sm text-soft-gray mt-1">Health & balance metrics</p>
                </div>
                <div className={`text-3xl font-bold ${scoreColor}`}>{overallScore}</div>
            </div>

            {/* Burnout Risk */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-soft-gray" />
                        <span className="text-sm text-charcoal dark:text-white">Burnout Risk</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full text-white font-medium ${burnoutColor}`}>
                        {burnout.label ?? burnoutLevel}
                    </span>
                </div>
                {burnout.indicators && burnout.indicators.length > 0 && (
                    <ul className="mt-2 space-y-1">
                        {burnout.indicators.map((ind: string, i: number) => (
                            <li key={i} className="text-xs text-soft-gray flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-yellow-500" /> {ind}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Metrics */}
            <div className="space-y-4">
                <MetricBar
                    label="Work-Life Balance"
                    value={wlb.score ?? 0}
                    max={100}
                    color="bg-navy"
                    icon={Heart}
                />
                <MetricBar
                    label="Recovery Score"
                    value={rest.recovery_score ?? 0}
                    max={100}
                    color="bg-blue-500"
                    icon={Moon}
                />
                <MetricBar
                    label="Rest Hours (avg)"
                    value={rest.avg_rest_hours ?? 0}
                    max={24}
                    color="bg-purple-500"
                    icon={Battery}
                />
            </div>

            {/* Recommendations */}
            {burnout.recommendations && burnout.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-soft-gray uppercase tracking-wide font-medium mb-2">Recommendations</p>
                    <ul className="space-y-1">
                        {burnout.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-charcoal dark:text-white">💡 {rec}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
