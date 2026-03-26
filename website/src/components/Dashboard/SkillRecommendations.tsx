'use client';

import { Lightbulb, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSkillsMetrics } from '@/lib/hooks/useSkillsMetrics';

export function SkillRecommendations() {
    const { data, isLoading, error } = useSkillsMetrics();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Recommended Skills</h3>
                <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-100 animate-pulse rounded h-24" />
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data || data.recommended_skills.length === 0) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Recommended Skills</h3>
                <div className="bg-gray-50 rounded p-8 text-center">
                    <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No recommendations yet</p>
                </div>
            </div>
        );
    }

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-700';
            case 'intermediate': return 'bg-yellow-100 text-yellow-700';
            case 'advanced': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getDifficultyIcon = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return '⭐';
            case 'intermediate': return '⭐⭐';
            case 'advanced': return '⭐⭐⭐';
            default: return '⭐';
        }
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Recommended Skills to Learn</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
                Based on your activity patterns and skill gaps
            </p>

            <div className="space-y-3">
                {data.recommended_skills.map((skill) => (
                    <div
                        key={skill.name}
                        className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {skill.name}
                                    <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(skill.difficulty)}`}>
                                        {getDifficultyIcon(skill.difficulty)} {skill.difficulty}
                                    </span>
                                </h4>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>{skill.estimated_time_hours}h</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{skill.reason}</p>

                        <Link 
                            href={`/dashboard/chat?prompt=I+want+to+start+learning+${encodeURIComponent(skill.name)}.+Can+you+help+me+create+a+learning+plan%3F`}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                            Start learning
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                ))}
            </div>

            {data.recommended_skills.length > 5 && (
                <button className="w-full mt-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    View all recommendations →
                </button>
            )}
        </div>
    );
}
