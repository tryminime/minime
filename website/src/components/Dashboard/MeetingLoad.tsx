'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProductivityWeekly } from '@/lib/hooks/useProductivityMetrics';

export function MeetingLoad() {
    const { data, isLoading, error } = useProductivityWeekly();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Meeting Load</h3>
                <div className="bg-gray-100 animate-pulse rounded h-64" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Meeting Load</h3>
                <div className="bg-gray-50 rounded p-8 text-center">
                    <p className="text-gray-500">No meeting data available</p>
                </div>
            </div>
        );
    }

    // Calculate recommendation
    const meetingHours = data.total_meeting_hours;
    const deepWorkHours = data.total_deep_work_hours;
    const ratio = deepWorkHours / (meetingHours || 1);

    let recommendation = '';
    let recommendationColor = '';

    if (ratio > 3) {
        recommendation = '✅ Great balance! You have plenty of deep work time.';
        recommendationColor = 'text-green-600';
    } else if (ratio > 1.5) {
        recommendation = '✓ Good balance between meetings and deep work.';
        recommendationColor = 'text-blue-600';
    } else {
        recommendation = '⚠️ High meeting load. Try to block more deep work time.';
        recommendationColor = 'text-orange-600';
    }

    const chartData = [
        {
            name: 'Meetings',
            hours: meetingHours,
            fill: '#ef4444',
        },
        {
            name: 'Deep Work',
            hours: deepWorkHours,
            fill: '#3b82f6',
        },
    ];

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Weekly Meeting Load</h3>

            <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="name"
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                    />
                    <Bar dataKey="hours" radius={[8, 8, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className={`text-sm font-medium ${recommendationColor}`}>
                    {recommendation}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                    Ratio: {ratio.toFixed(1)}:1 (Deep Work:Meetings)
                </p>
            </div>
        </div>
    );
}
