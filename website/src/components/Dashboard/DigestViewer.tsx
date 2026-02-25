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

            {/* HTML Content */}
            <div
                id="digest-content"
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 prose prose-sm max-w-none
          prose-headings:text-gray-900 
          prose-p:text-gray-700
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-strong:text-gray-900
          prose-ul:text-gray-700
          prose-ol:text-gray-700
          prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200
          prose-code:text-blue-600 prose-code:bg-gray-50 prose-code:px-1 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: data.html_content }}
            />

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
