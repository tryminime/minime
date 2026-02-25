'use client';

import { Briefcase, TrendingUp, TrendingDown, Minus, Target, ChevronRight, MessageSquare, Star, ArrowRight } from 'lucide-react';
import { useCareer } from '@/lib/hooks/useGoals';
import { useSkillsMetrics } from '@/lib/hooks/useSkillsMetrics';
import Link from 'next/link';

const CAREER_PHASE_INFO: Record<string, { label: string; color: string; bg: string; description: string }> = {
    growth: { label: 'Growth Phase', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', description: 'You are rapidly expanding your skill set and depth. Focus on deepening expertise in 2–3 core areas.' },
    senior: { label: 'Senior Phase', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', description: 'You have strong fundamentals. Now is the time to lead projects and mentor others.' },
    lead: { label: 'Lead Phase', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', description: 'You influence strategy. Focus on systems thinking, delegation, and cross-team collaboration.' },
    exploring: { label: 'Exploring', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', description: 'You are trying different domains. Keep a learning journal to identify what energizes you most.' },
    default: { label: 'Active', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', description: 'Keep tracking your activities to get personalized career insights.' },
};

const TRAJECTORY_INFO: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    accelerating: { icon: <TrendingUp className="w-4 h-4 text-emerald-600" />, label: 'Accelerating', color: 'text-emerald-700 bg-emerald-100' },
    steady: { icon: <Minus className="w-4 h-4 text-blue-600" />, label: 'Steady', color: 'text-blue-700 bg-blue-100' },
    plateau: { icon: <TrendingDown className="w-4 h-4 text-amber-600" />, label: 'Plateau', color: 'text-amber-700 bg-amber-100' },
    declining: { icon: <TrendingDown className="w-4 h-4 text-red-600" />, label: 'Declining', color: 'text-red-700 bg-red-100' },
};

export default function CareerPage() {
    const { data: career, isLoading: careerLoading } = useCareer();
    const { data: skills, isLoading: skillsLoading } = useSkillsMetrics();

    const isLoading = careerLoading || skillsLoading;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="h-10 bg-gray-100 rounded animate-pulse w-52" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    const phase = CAREER_PHASE_INFO[career?.career_phase ?? 'default'] ?? CAREER_PHASE_INFO['default'];
    const trajectory = TRAJECTORY_INFO[career?.growth_trajectory ?? 'steady'] ?? TRAJECTORY_INFO['steady'];

    // No real data — show empty state
    const hasData = career?.career_phase && career.career_phase.length > 0;
    if (!hasData && !isLoading) {
        return (
            <div className="space-y-6 max-w-5xl">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-indigo-500" /> Career Development
                    </h1>
                    <p className="text-gray-500 mt-1">Insights on your professional growth trajectory and skill gaps</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No career data yet</h3>
                    <p className="text-gray-500 max-w-md mx-auto">Start tracking your activities to get personalized career insights, growth trajectory analysis, and skill gap recommendations.</p>
                </div>
            </div>
        );
    }

    // Derive skill gaps from low-mastery skills
    const lowMasterySkills = (skills?.top_skills ?? [])
        .filter(s => s.mastery < 30)
        .slice(0, 3)
        .map(s => s.name);

    const skillGaps = career?.skill_gaps?.length
        ? career.skill_gaps as string[]
        : lowMasterySkills;

    const nextSteps = career?.recommended_next_steps ?? [];


    // Role readiness derived from skill data
    const topSkills = skills?.top_skills ?? [];
    const avgMastery = topSkills.length
        ? topSkills.reduce((s, sk) => s + sk.mastery, 0) / topSkills.length
        : 0;

    const roleReadiness = [
        { role: 'Individual Contributor', score: Math.min(100, avgMastery + 20) },
        { role: 'Tech Lead', score: Math.min(100, avgMastery - 10) },
        { role: 'Senior Engineer', score: Math.min(100, avgMastery) },
    ];

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-indigo-500" /> Career Development
                    </h1>
                    <p className="text-gray-500 mt-1">Insights on your professional growth trajectory and skill gaps</p>
                </div>
                <Link
                    href="/dashboard/chat?prompt=What+career+skills+should+I+focus+on+based+on+my+activity+data%3F"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <MessageSquare className="w-4 h-4" /> Ask AI
                </Link>
            </div>

            {/* Career Phase + Trajectory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className={`rounded-2xl border p-6 ${phase.bg}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Career Phase</span>
                    </div>
                    <p className={`text-2xl font-bold mb-2 ${phase.color}`}>{phase.label}</p>
                    <p className="text-sm text-gray-600">{phase.description}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center gap-2 mb-3">
                        {trajectory.icon}
                        <span className="text-sm font-medium text-gray-600">Growth Trajectory</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`text-2xl font-bold ${trajectory.color.split(' ')[0]}`}>{trajectory.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trajectory.color}`}>
                            {career?.growth_trajectory ?? 'steady'}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500">Based on your skill mastery progression and activity patterns</p>
                </div>
            </div>

            {/* Role Readiness */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-purple-500" />
                    <h3 className="font-semibold text-gray-900">Role Readiness</h3>
                </div>
                <div className="space-y-4">
                    {roleReadiness.map(r => (
                        <div key={r.role}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-gray-700">{r.role}</span>
                                <span className="text-sm font-semibold text-gray-900">{Math.max(0, r.score).toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 transition-all"
                                    style={{ width: `${Math.max(0, Math.min(100, r.score))}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Skill Gaps */}
                <div className="bg-white rounded-2xl border border-amber-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" /> Skill Gaps to Address
                    </h3>
                    {skillGaps.length > 0 ? (
                        <ul className="space-y-3">
                            {skillGaps.map((gap, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-semibold shrink-0">
                                        {i + 1}
                                    </div>
                                    <span className="text-sm text-gray-700">{gap}</span>
                                    <Link
                                        href={`/dashboard/chat?prompt=How+do+I+improve+my+${encodeURIComponent(String(gap))}+skills%3F`}
                                        className="ml-auto text-xs text-indigo-600 hover:underline shrink-0"
                                    >
                                        Learn →
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No significant skill gaps detected. Keep building!</p>
                    )}
                </div>

                {/* Recommended Next Steps */}
                <div className="bg-white rounded-2xl border border-indigo-100 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-indigo-500" /> Recommended Next Steps
                    </h3>
                    {nextSteps.length > 0 ? (
                        <ul className="space-y-3">
                            {nextSteps.slice(0, 4).map((step, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                    <ChevronRight className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                                    {step}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-400">
                            Keep tracking your work — personalised steps appear after a few days of activity data.
                        </p>
                    )}
                </div>

            </div>

            {/* Skill Growth Timeline from skills data */}
            {topSkills.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Current Skill Landscape</h3>
                    <div className="space-y-3">
                        {topSkills.slice(0, 6).map(skill => (
                            <div key={skill.name} className="flex items-center gap-3">
                                <div className="w-28 text-sm text-gray-600 shrink-0 truncate">{skill.name}</div>
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                    <div
                                        className="h-2 rounded-full bg-indigo-500 transition-all"
                                        style={{ width: `${skill.mastery}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-500 w-10 text-right">{skill.mastery.toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
