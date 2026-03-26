'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useProductivityTrend, ProductivityMetrics } from '@/lib/hooks/useProductivityMetrics';
import { formatShortDate } from '@/lib/utils';

const RANGE_OPTIONS = [
    { label: '7 Days', value: 7 },
    { label: '14 Days', value: 14 },
    { label: '30 Days', value: 30 },
];

export function FocusScoreTrend() {
    const [days, setDays] = useState(7);
    const { data, isLoading, error } = useProductivityTrend(days);

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Focus Score Trend</h3>
                <div className="bg-gray-100 animate-pulse rounded h-64" />
            </div>
        );
    }

    if (error || !data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{days}-Day Trend</h3>
                    <RangeSelector days={days} onChange={setDays} />
                </div>
                <div className="bg-gray-50 rounded p-8 text-center">
                    <p className="text-gray-500">No data available for the last {days} days</p>
                </div>
            </div>
        );
    }

    // Build chart data for ALL days in the range, filling missing days with zero
    const chartData = buildFullRangeData(data, days);

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{days}-Day Trend</h3>
                <RangeSelector days={days} onChange={setDays} />
            </div>
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
                        connectNulls={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="Productivity Score"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

function RangeSelector({ days, onChange }: { days: number; onChange: (d: number) => void }) {
    return (
        <select
            value={days}
            onChange={(e) => onChange(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 cursor-pointer"
        >
            {RANGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
            ))}
        </select>
    );
}

/**
 * Builds an array with one entry per day for the full range,
 * filling in zeros for days that have no data.
 */
function buildFullRangeData(
    data: ProductivityMetrics[],
    days: number,
): { date: string; 'Focus Score': number; 'Productivity Score': number }[] {
    // Build a lookup from date string -> metrics
    const lookup: Record<string, ProductivityMetrics> = {};
    for (const item of data) {
        if (item && item.date) {
            lookup[item.date] = item;
        }
    }

    const result: { date: string; 'Focus Score': number; 'Productivity Score': number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        const metrics = lookup[iso];

        result.push({
            date: formatShortDate(iso),
            'Focus Score': metrics?.focus_score ?? 0,
            'Productivity Score': metrics?.productivity_score ?? 0,
        });
    }

    return result;
}
