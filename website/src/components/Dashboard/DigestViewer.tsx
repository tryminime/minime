'use client';

import { useWeeklySummary } from '@/lib/hooks/useWeeklySummary';
import { useWeeklyAIReport } from '@/lib/hooks/useAIChat';
import { ExportButtons } from '@/components/Dashboard/ExportButtons';
import { formatDate } from '@/lib/utils';
import { TrendingUp, Users, Zap, Star, Brain, ArrowUp, ArrowDown } from 'lucide-react';

interface DigestViewerProps {
    date?: string;
}

export function DigestViewer({ date }: DigestViewerProps) {
    const { data, isLoading, error } = useWeeklySummary(date);

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-gray-100 animate-pulse rounded h-64 mb-6" />
                <div className="space-y-4">
                    <div className="bg-gray-100 animate-pulse rounded h-32" />
                    <div className="bg-gray-100 animate-pulse rounded h-32" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
                <p className="text-red-600 font-semibold">Failed to load weekly digest</p>
                <p className="text-sm text-red-500 mt-2">Please try selecting a different week</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Weekly Digest
                        </h1>
                        <p className="text-lg text-gray-600">
                            {formatDate(data.week_start)} - {formatDate(data.week_end)}
                        </p>
                    </div>
                    <ExportButtons weekStart={data.week_start} weekEnd={data.week_end} />
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-blue-600" />
                            <p className="text-2xl font-bold text-gray-900">
                                {data.summary_stats.focus_score.toFixed(0)}
                            </p>
                        </div>
                        <p className="text-xs text-gray-600">Focus Score</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <p className="text-2xl font-bold text-gray-900">
                                {data.summary_stats.productivity_score.toFixed(0)}
                            </p>
                        </div>
                        <p className="text-xs text-gray-600">Productivity</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Users className="w-4 h-4 text-green-600" />
                            <p className="text-2xl font-bold text-gray-900">
                                {data.summary_stats.collaboration_index.toFixed(1)}
                            </p>
                        </div>
                        <p className="text-xs text-gray-600">Collaboration</p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Star className="w-4 h-4 text-yellow-600" />
                            <p className="text-2xl font-bold text-gray-900">
                                {data.summary_stats.total_activities}
                            </p>
                        </div>
                        <p className="text-xs text-gray-600">Activities</p>
                    </div>
                </div>
            </div>

            {/* Structured Digest Content */}
            <DigestSections html={data.html_content} />

            {/* Key Achievements */}
            {data.summary_stats.key_achievements.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        Key Achievements This Week
                    </h3>
                    <ul className="space-y-2">
                        {data.summary_stats.key_achievements.map((achievement, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700">
                                <span className="text-blue-600 font-bold mt-0.5">✓</span>
                                <span>{achievement}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Top Skills */}
            {data.summary_stats.top_skills.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200 p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Top Skills This Week
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {data.summary_stats.top_skills.map((skill, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                            >
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            {/* AI Insights Card */}
            <AIInsightsSection />
        </div>
    );
}

/** Parse the backend HTML digest into structured visual sections */
function DigestSections({ html }: { html: string }) {
    // Parse sections from the HTML
    const parser = typeof DOMParser !== 'undefined' ? new DOMParser() : null;
    if (!parser) return <div dangerouslySetInnerHTML={{ __html: html }} />;

    const doc = parser.parseFromString(html, 'text/html');
    const elements = Array.from(doc.body.children);

    const sections: { title: string; emoji: string; items: string[]; summary?: string }[] = [];
    let currentSection: { title: string; emoji: string; items: string[]; summary?: string } | null = null;
    let overview: string | null = null;

    for (const el of elements) {
        const tag = el.tagName.toLowerCase();
        if (tag === 'h2') {
            // Week overview header — skip, we already show it above
            continue;
        } else if (tag === 'p' && !currentSection) {
            overview = el.textContent || '';
        } else if (tag === 'h3') {
            const text = el.textContent || '';
            const emoji = text.match(/^[^\w\s]/u)?.[0] || '📌';
            const title = text.replace(/^[^\w\s]\s*/u, '');
            currentSection = { title, emoji, items: [] };
            sections.push(currentSection);
        } else if (tag === 'ul' && currentSection) {
            const lis = Array.from(el.querySelectorAll('li'));
            currentSection.items = lis.map(li => li.textContent || '');
        } else if (tag === 'p' && currentSection) {
            currentSection.summary = el.textContent || '';
        }
    }

    const sectionColors: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
        'Top Activities': { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
        'Performance': { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
        'Achievements': { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
        'Suggestions': { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
    };

    const defaultColor = { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' };

    return (
        <div className="space-y-4">
            {/* Overview Card */}
            {overview && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                    <p className="text-gray-700 text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: overview.replace(/(\d+)/g, '<strong>$1</strong>') }} />
                </div>
            )}

            {/* Section Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section, idx) => {
                    const colors = sectionColors[section.title] || defaultColor;
                    return (
                        <div key={idx} className={`${colors.bg} rounded-lg border ${colors.border} p-5`}>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="text-lg">{section.emoji}</span>
                                {section.title}
                            </h3>
                            {section.summary && (
                                <p className="text-sm text-gray-700 mb-2">{section.summary}</p>
                            )}
                            {section.items.length > 0 && (
                                <ul className="space-y-1.5">
                                    {section.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className={`${colors.badge} w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                                                {section.title === 'Top Activities' ? i + 1 : section.title === 'Achievements' ? '✓' : '→'}
                                            </span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AIInsightsSection() {
    const { data: report, isLoading } = useWeeklyAIReport();

    if (isLoading) {
        return <div className="bg-gray-100 animate-pulse rounded-lg h-32" />;
    }

    if (!report) return null;

    const trends = report.trends || {};
    const deepWorkChange = trends.deep_work_change ?? 0;
    const focusChange = trends.focus_change ?? 0;
    const meetingChange = trends.meeting_change ?? 0;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-indigo-100 p-6">
            <div className="flex items-center gap-2 mb-4">
                <Brain className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{report.period}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                    { label: 'Total Hours', value: `${report.total_hours}h`, sub: `${report.days_active} days active` },
                    { label: 'Deep Work', value: `${(report.breakdown?.deep_work ?? 0).toFixed(1)}h`, sub: deepWorkChange !== 0 ? `${deepWorkChange > 0 ? '+' : ''}${deepWorkChange}% vs last week` : '—' },
                    { label: 'Meetings', value: `${(report.breakdown?.meetings ?? 0).toFixed(1)}h`, sub: meetingChange !== 0 ? `${meetingChange > 0 ? '+' : ''}${meetingChange}% vs last week` : '—' },
                    { label: 'Avg Focus', value: `${report.avg_focus_score}/10`, sub: focusChange !== 0 ? `${focusChange > 0 ? '+' : ''}${focusChange.toFixed(1)} pts` : 'stable' },
                ].map((item, i) => (
                    <div key={i} className="bg-indigo-50 rounded-xl p-3">
                        <p className="text-xs text-indigo-500 font-medium">{item.label}</p>
                        <p className="text-xl font-bold text-indigo-700 mt-0.5">{item.value}</p>
                        <p className="text-xs text-indigo-400 mt-0.5">{item.sub}</p>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
                {deepWorkChange > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                        <ArrowUp className="w-3 h-3" /> Deep work up {deepWorkChange}%
                    </span>
                )}
                {meetingChange < 0 && (
                    <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                        <ArrowDown className="w-3 h-3" /> Meetings down {Math.abs(meetingChange)}%
                    </span>
                )}
                {focusChange > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                        <ArrowUp className="w-3 h-3" /> Focus score +{focusChange.toFixed(1)}
                    </span>
                )}
            </div>
        </div>
    );
}
