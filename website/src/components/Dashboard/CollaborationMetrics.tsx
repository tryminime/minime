'use client';

import { Users, MessageSquare, Calendar, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/Common/StatCard';
import { useCollaborationWeekly } from '@/lib/hooks/useCollaborationMetrics';

export function CollaborationMetrics() {
    const { data, isLoading, error } = useCollaborationWeekly();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-32" />
                ))}
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Failed to load collaboration metrics</p>
            </div>
        );
    }

    const metrics = [
        {
            title: 'Collaboration Index',
            value: data.collaboration_index.toFixed(1),
            change: 'Weekly score',
            changeType: 'neutral' as const,
            icon: <TrendingUp className="w-5 h-5" />,
        },
        {
            title: 'Total Collaborators',
            value: data.total_collaborators || data.top_collaborators.length,
            change: 'Active this week',
            changeType: 'neutral' as const,
            icon: <Users className="w-5 h-5" />,
        },
        {
            title: 'Meetings',
            value: data.meeting_count,
            change: 'This week',
            changeType: 'neutral' as const,
            icon: <Calendar className="w-5 h-5" />,
        },
        {
            title: 'Communication',
            value: data.communication_frequency,
            change: 'Frequency',
            changeType: 'neutral' as const,
            icon: <MessageSquare className="w-5 h-5" />,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((metric) => (
                <StatCard key={metric.title} {...metric} />
            ))}
        </div>
    );
}
