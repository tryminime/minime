'use client';

import { BarChart, Brain, Target, TrendingUp } from 'lucide-react';
import { StatCard } from '@/components/Common/StatCard';
import { SkillsMastery } from '@/components/Dashboard/SkillsMastery';
import { GrowthTrajectory } from '@/components/Dashboard/GrowthTrajectory';
import { SkillRecommendations } from '@/components/Dashboard/SkillRecommendations';
import { useSkillsMetrics } from '@/lib/hooks/useSkillsMetrics';
import { useWebSocket } from '@/lib/hooks/useWebSocket';

export default function SkillsPage() {
    const { data, isLoading } = useSkillsMetrics();
    const { isConnected, lastUpdate } = useWebSocket();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Skills Map</h1>
                    <p className="text-gray-600 mt-1">Track your skill development and discover growth opportunities</p>
                </div>

                {/* Live indicator */}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm text-gray-600">
                        {isConnected ? 'Live' : 'Offline'}
                    </span>
                    {lastUpdate && (
                        <span className="text-xs text-gray-400">
                            Updated {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Metrics Overview */}
            {!isLoading && data && data.total_skills > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Skills"
                        value={data.total_skills}
                        change={`${data.advanced_skills} advanced`}
                        changeType="neutral"
                        icon={<Brain className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Skill Diversity"
                        value={`${data.skill_diversity.toFixed(1)}%`}
                        change="Breadth of categories"
                        changeType="positive"
                        icon={<BarChart className="w-5 h-5" />}
                        tooltip="Percentage of available skill categories you are actively developing."
                    />
                    <StatCard
                        title="Learning Velocity"
                        value={data.learning_velocity.toFixed(1)}
                        change="skills/month"
                        changeType="neutral"
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Advanced Skills"
                        value={data.advanced_skills}
                        change={`${((data.advanced_skills / data.total_skills) * 100).toFixed(0)}% of total`}
                        changeType="positive"
                        icon={<Target className="w-5 h-5" />}
                    />
                </div>
            )}

            {/* Main Content */}
            {!isLoading && (!data || data.total_skills === 0) ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No skills data yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">Start tracking your activities to see your skill development, mastery levels, and personalized recommendations.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left column - 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        <SkillsMastery />
                        <GrowthTrajectory />
                    </div>

                    {/* Right column - 1/3 width */}
                    <div className="space-y-6">
                        <SkillRecommendations />
                    </div>
                </div>
            )}

            {/* Dynamic Tips */}
            {(() => {
                const tips: string[] = [];
                if (data) {
                    if (data.skill_diversity < 30) tips.push(`Your skill diversity is ${data.skill_diversity.toFixed(0)}% — try exploring new categories to become more well-rounded`);
                    if (data.advanced_skills === 0) tips.push('No advanced skills yet — focus on deepening mastery in your top skills to reach 70%+');
                    else tips.push(`You have ${data.advanced_skills} advanced skill${data.advanced_skills > 1 ? 's' : ''} — great depth!`);
                    if (data.learning_velocity > 2) tips.push(`Learning velocity of ${data.learning_velocity.toFixed(1)} skills/month — you're picking up skills fast!`);
                    else tips.push('Try dedicating regular time blocks to skill development to increase your learning velocity');
                    if (data.top_skills.length > 0) tips.push(`Your strongest area is ${data.top_skills[0].category} — consider pairing it with complementary skills`);
                } else {
                    tips.push('Focus on depth over breadth - master a few skills deeply');
                    tips.push('Regularly practice skills to maintain mastery levels');
                    tips.push('Track progress weekly to see your growth trajectory');
                }
                return (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <h3 className="font-semibold text-indigo-900 mb-2">💡 Skill Development Tips</h3>
                        <ul className="text-sm text-indigo-800 space-y-1">
                            {tips.map((tip, i) => <li key={i}>• {tip}</li>)}
                        </ul>
                    </div>
                );
            })()}
        </div>
    );
}
