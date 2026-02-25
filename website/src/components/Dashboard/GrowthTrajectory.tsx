'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useSkillsMetrics } from '@/lib/hooks/useSkillsMetrics';
import { formatShortDate } from '@/lib/utils';

export function GrowthTrajectory() {
    const { data, isLoading, error } = useSkillsMetrics();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Growth Trajectory</h3>
                <div className="bg-gray-100 animate-pulse rounded h-80" />
            </div>
        );
    }

    if (error || !data || data.growth_history.length === 0) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Growth Trajectory</h3>
                <div className="bg-gray-50 rounded p-8 text-center">
                    <p className="text-gray-500">No growth data available</p>
                </div>
            </div>
        );
    }

    // Group by skill and get top 5 skills by latest mastery
    const skillsData = data.top_skills.slice(0, 5);

    // Transform data for recharts
    const dateMap: { [date: string]: any } = {};

    data.growth_history.forEach((entry) => {
        const date = formatShortDate(entry.date);
        if (!dateMap[date]) {
            dateMap[date] = { date };
        }
        dateMap[date][entry.skill_name] = entry.mastery;
    });

    const chartData = Object.values(dateMap).sort((a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Growth Trajectory</h3>
            <p className="text-sm text-gray-600 mb-4">
                Skill mastery progression over time (top 5 skills)
            </p>

            <ResponsiveContainer width="100%" height={350}>
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
                        label={{ value: 'Mastery %', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                        }}
                    />
                    <Legend />
                    {skillsData.map((skill, index) => (
                        <Line
                            key={skill.name}
                            type="monotone"
                            dataKey={skill.name}
                            stroke={colors[index]}
                            strokeWidth={2}
                            dot={{ fill: colors[index], r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {skillsData.map((skill, index) => (
                        <div key={skill.name} className="text-center">
                            <div
                                className="w-3 h-3 rounded-full mx-auto mb-1"
                                style={{ backgroundColor: colors[index] }}
                            />
                            <p className="text-xs font-medium text-gray-700">{skill.name}</p>
                            <p className="text-xs text-gray-500">{skill.mastery}%</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
