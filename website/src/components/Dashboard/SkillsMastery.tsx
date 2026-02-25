'use client';

import { TrendingUp, Clock, Star, Award } from 'lucide-react';
import { useSkillsMetrics } from '@/lib/hooks/useSkillsMetrics';

export function SkillsMastery() {
    const { data, isLoading, error } = useSkillsMetrics();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Skills Mastery</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-gray-100 animate-pulse rounded h-24" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600">Failed to load skills data</p>
            </div>
        );
    }

    const getMasteryColor = (mastery: number) => {
        if (mastery >= 80) return 'bg-green-500';
        if (mastery >= 60) return 'bg-blue-500';
        if (mastery >= 40) return 'bg-yellow-500';
        return 'bg-gray-400';
    };

    const getMasteryLabel = (mastery: number) => {
        if (mastery >= 80) return 'Expert';
        if (mastery >= 60) return 'Advanced';
        if (mastery >= 40) return 'Intermediate';
        return 'Beginner';
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Skills Mastery</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="w-4 h-4" />
                    <span>{data.total_skills} total skills</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.top_skills.map((skill) => (
                    <div
                        key={skill.name}
                        className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{skill.name}</h4>
                                <p className="text-sm text-gray-500">{skill.category}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-gray-900">
                                    {skill.mastery}%
                                </p>
                                <p className="text-xs text-gray-500">
                                    {getMasteryLabel(skill.mastery)}
                                </p>
                            </div>
                        </div>

                        {/* Mastery bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                                className={`h-2 rounded-full transition-all ${getMasteryColor(skill.mastery)}`}
                                style={{ width: `${skill.mastery}%` }}
                            />
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{skill.time_invested_hours}h invested</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span className={skill.growth_rate > 0 ? 'text-green-600' : 'text-gray-400'}>
                                    {skill.growth_rate > 0 ? '+' : ''}{skill.growth_rate.toFixed(1)}%
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                            Last used: {new Date(skill.last_used).toLocaleDateString()}
                        </p>
                    </div>
                ))}
            </div>

            {data.top_skills.length === 0 && (
                <div className="text-center py-12">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No skills tracked yet</p>
                    <p className="text-sm text-gray-400">
                        Start working on projects to build your skill profile
                    </p>
                </div>
            )}
        </div>
    );
}
