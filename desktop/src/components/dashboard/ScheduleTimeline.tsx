import { useTodaySchedule } from '../../lib/hooks/useApi'
import { Clock, Calendar } from 'lucide-react'

function LoadingSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="w-32 h-5 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                ))}
            </div>
        </div>
    )
}

const typeColors: Record<string, string> = {
    'window': 'bg-navy border-navy',
    'browser': 'bg-blue-500 border-blue-500',
    'meeting': 'bg-purple-500 border-purple-500',
    'email': 'bg-yellow-500 border-yellow-500',
    'document': 'bg-teal border-teal',
    'calendar': 'bg-orange-500 border-orange-500',
    'default': 'bg-gray-400 border-gray-400',
}

export default function ScheduleTimeline() {
    const { data, isLoading, isError } = useTodaySchedule()

    if (isLoading) return <LoadingSkeleton />

    const activities = Array.isArray(data) ? data : (data as any)?.items || []

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
                <h2 className="text-lg font-semibold text-charcoal dark:text-white">Today's Activity</h2>
                <p className="text-sm text-soft-gray mt-1">Recent tracked activities</p>
            </div>

            {isError ? (
                <div className="text-center py-8">
                    <p className="text-sm text-red-500">Failed to load schedule</p>
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-12 text-soft-gray">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">No activities recorded today</p>
                    <p className="text-sm mt-1">Activities will appear as they are tracked</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activities.map((activity: any, i: number) => {
                        const eventType = activity.event_type || 'default'
                        const colors = typeColors[eventType] || typeColors.default
                        const time = activity.timestamp
                            ? new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''
                        const duration = activity.duration_seconds
                            ? `${Math.round(activity.duration_seconds / 60)}m`
                            : ''

                        return (
                            <div key={activity.id || i} className="relative">
                                <div className="flex gap-4">
                                    <div className="w-16 text-sm text-soft-gray font-medium pt-1">{time}</div>
                                    <div className={`flex-1 border-l-4 ${colors} rounded-lg p-4`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-charcoal dark:text-white text-sm">
                                                    {activity.application || activity.title || eventType}
                                                </h4>
                                                {activity.title && activity.application && (
                                                    <p className="text-xs text-soft-gray mt-0.5 truncate max-w-md">
                                                        {activity.title}
                                                    </p>
                                                )}
                                            </div>
                                            {duration && (
                                                <div className="flex items-center gap-1 text-xs text-soft-gray">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{duration}</span>
                                                </div>
                                            )}
                                        </div>
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
