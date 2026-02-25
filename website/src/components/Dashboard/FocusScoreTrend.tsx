'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useProductivityTrend, ProductivityMetrics } from '@/lib/hooks/useProductivityMetrics';
import { formatShortDate } from '@/lib/utils';

export function FocusScoreTrend() {
    const { data, isLoading, error } = useProductivityTrend(7);

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Focus  Score Trend</h3>
                <div className="bg-gray-100 animate-pulse rounded h-64" />
            </div>
        );
    }

    if (error || !data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Focus Score Trend</h3>
                <div className="bg-gray-50 rounded p-8 text-center">
                    <p className="text-gray-500">No data available for the last 7 days</p>
                </div>
            </div>
        );
    }

    const chartData = data
        .filter((item): item is ProductivityMetrics => item !== null)
        .map((item) => ({
            date: formatShortDate(item.date),
            'Focus Score': item.focus_score,
            'Productivity Score': item.productivity_score,
        }));

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">7-Day Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                    />
                    <YAxis
                        stroke="#6b7280"
                        fontSize={12}
                        tickLine={false}
                        domain={[0, 100]}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="Focus Score"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="Productivity Score"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
