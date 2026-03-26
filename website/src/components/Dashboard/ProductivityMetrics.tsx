'use client';

import { TrendingUp, Zap, Clock, Users, Shuffle, Activity } from 'lucide-react';
import { StatCard } from '@/components/Common/StatCard';
import { useProductivityTrend, type ProductivityMetrics as ProductivityMetricsType } from '@/lib/hooks/useProductivityMetrics';

export function ProductivityMetrics() {
    // Fetch last 7 days of metrics to find the most recent active day
    const { data: trendData, isLoading, error } = useProductivityTrend(7);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-32" />
                ))}
            </div>
        );
    }

    if (error || !trendData || trendData.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Failed to load productivity metrics</p>
            </div>
        );
    }

    // Find the most recent day that has activities, fallback to the very last day (today)
    const validData = trendData.filter((d): d is ProductivityMetricsType => d !== null);
    const activeDays = validData.filter(d => d.activity_count > 0);
    const data = activeDays.length > 0 ? activeDays[activeDays.length - 1] : validData[validData.length - 1];

    if (!data) {
        return null;
    }

    // For yesterday's delta, find the active day before 'data'
    const dataIndex = validData.findIndex(d => d.date === data.date);
    const yData = dataIndex > 0 ? validData[dataIndex - 1] : null;

    // Compute real deltas versus "yesterday" (or previous active day)
    const focusDelta = yData ? data.focus_score - yData.focus_score : 0;
    const prodDelta = yData ? data.productivity_score - yData.productivity_score : 0;
    const focusChangeText = yData
        ? `${focusDelta >= 0 ? '+' : ''}${focusDelta.toFixed(0)}pts from previous session`
        : 'No prior data';
    const prodChangeText = yData
        ? `${prodDelta >= 0 ? '+' : ''}${prodDelta.toFixed(0)}pts from previous session`
        : 'No prior data';

    const deepWorkHours = (data.deep_work_sessions * 25 / 60);  // 25min min per session

    const metrics = [
        {
            title: 'Focus Score',
            value: data.focus_score.toFixed(1),
            change: focusChangeText,
            changeType: (focusDelta > 0 ? 'positive' : focusDelta < 0 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
            icon: <Zap className="w-5 h-5" />,
        },
        {
            title: 'Productivity Score',
            value: data.productivity_score.toFixed(1),
            change: prodChangeText,
            changeType: (prodDelta > 0 ? 'positive' : prodDelta < 0 ? 'negative' : 'neutral') as 'positive' | 'negative' | 'neutral',
            icon: <TrendingUp className="w-5 h-5" />,
        },
        {
            title: 'Deep Work Sessions',
            value: data.deep_work_sessions,
            change: `${deepWorkHours.toFixed(1)}h estimated`,
            changeType: (data.deep_work_sessions > 0 ? 'positive' : 'neutral') as 'positive' | 'negative' | 'neutral',
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
