'use client';

import { TrendingUp, Zap, Clock, Users, Shuffle, Activity } from 'lucide-react';
import { StatCard } from '@/components/Common/StatCard';
import { useProductivityDaily } from '@/lib/hooks/useProductivityMetrics';
import { formatDuration } from '@/lib/utils';

export function ProductivityMetrics() {
    const { data, isLoading, error } = useProductivityDaily();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-32" />
                ))}
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Failed to load productivity metrics</p>
            </div>
        );
    }

    const metrics = [
        {
            title: 'Focus Score',
            value: data.focus_score.toFixed(1),
            change: '+5% from yesterday',
            changeType: 'positive' as 'positive' | 'negative' | 'neutral',
            icon: <Zap className="w-5 h-5" />,
        },
        {
            title: 'Productivity Score',
            value: data.productivity_score.toFixed(1),
            change: '+3% from yesterday',
            changeType: 'positive' as 'positive' | 'negative' | 'neutral',
            icon: <TrendingUp className="w-5 h-5" />,
        },
        {
            title: 'Deep Work Sessions',
            value: data.deep_work_sessions,
            change: `${formatDuration(data.deep_work_sessions * 45 * 60)}`,
            changeType: 'neutral' as 'positive' | 'negative' | 'neutral',
            icon: <Clock className="w-5 h-5" />,
        },
        {
            title: 'Meeting Load',
            value: `${data.meeting_load_hours.toFixed(1)}h`,
            change: data.meeting_load_hours > 4 ? 'High meeting load' : 'Balanced',
            changeType: (data.meeting_load_hours > 4 ? 'negative' : 'positive') as 'positive' | 'negative' | 'neutral',
            icon: <Users className="w-5 h-5" />,
        },
        {
            title: 'Context Switches',
            value: data.context_switches,
            change: data.context_switches > 20 ? 'Try to reduce' : 'Good',
            changeType: (data.context_switches > 20 ? 'negative' : 'positive') as 'positive' | 'negative' | 'neutral',
            icon: <Shuffle className="w-5 h-5" />,
        },
        {
            title: 'Total Activities',
            value: data.activity_count,
            change: 'Today',
            changeType: 'neutral' as 'positive' | 'negative' | 'neutral',
            icon: <Activity className="w-5 h-5" />,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => (
                <StatCard key={metric.title} {...metric} />
            ))}
        </div>
    );
}
