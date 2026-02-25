'use client';

import { BookOpen, ArrowRight, Zap } from 'lucide-react';
import { useEntities } from '@/lib/hooks/useEntities';

// Skill domain mapping: entity name → suggested learning path
const DOMAIN_MAP: Record<string, { domain: string; suggestions: string[] }> = {
    Chrome: { domain: 'Research & Discovery', suggestions: ['Advanced web search techniques', 'Browser DevTools mastery', 'Web scraping basics'] },
    'VS Code': { domain: 'Engineering', suggestions: ['Advanced Git workflows', 'Test-driven development', 'Code review best practices'] },
    Python: { domain: 'Development', suggestions: ['Async Python patterns', 'Data structures & algorithms', 'API design patterns'] },
    Figma: { domain: 'Design', suggestions: ['Design systems', 'User research methods', 'Prototyping techniques'] },
    Zoom: { domain: 'Communication', suggestions: ['Effective meeting facilitation', 'Remote collaboration tools', 'Presentation skills'] },
    Slack: { domain: 'Team Collaboration', suggestions: ['Async communication best practices', 'Channel management', 'Bot automation'] },
    SQLAlchemy: { domain: 'Data & Databases', suggestions: ['Database optimization', 'Query performance tuning', 'NoSQL alternatives'] },
    asyncio: { domain: 'Concurrent Programming', suggestions: ['Event-driven architecture', 'Performance profiling', 'Distributed systems'] },
    GitHub: { domain: 'DevOps & Collaboration', suggestions: ['CI/CD pipelines', 'Code review workflows', 'Open source contribution'] },
};

const DEFAULT_SUGGESTIONS = ['Deep dive into documentation', 'Build a side project', 'Find community resources'];

export function LearningPathsPanel() {
    const { data, isLoading } = useEntities(undefined, 20);
    const entities = data?.entities ?? [];

    if (isLoading) {
        return (
            <div className="p-6 space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 animate-pulse rounded-xl h-28" />)}
            </div>
        );
    }

    // Top 4 artifact entities by occurrence count = most used skills/tools
    const topArtifacts = entities
        .filter(e => e.entity_type === 'artifact')
        .slice(0, 4);

    return (
        <div className="p-5">
            <div className="mb-4">
                <h3 className="text-base font-semibold text-gray-900">Learning Paths</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                    Based on your most-used tools, here are suggested areas to deepen your expertise
                </p>
            </div>

            {topArtifacts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Capture more activities to generate personalized learning paths.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {topArtifacts.map((entity, idx) => {
                        const mapping = DOMAIN_MAP[entity.name] ?? {
                            domain: `${entity.name} Mastery`,
                            suggestions: DEFAULT_SUGGESTIONS,
                        };
                        const colors = ['bg-blue-50 border-blue-100', 'bg-purple-50 border-purple-100', 'bg-emerald-50 border-emerald-100', 'bg-amber-50 border-amber-100'];
                        const accentColors = ['text-blue-700', 'text-purple-700', 'text-emerald-700', 'text-amber-700'];
                        const dotColors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500'];

                        return (
                            <div key={entity.id} className={`rounded-xl border p-4 ${colors[idx % 4]}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${dotColors[idx % 4]}`} />
                                        <span className={`font-semibold text-sm ${accentColors[idx % 4]}`}>
                                            {entity.name}
                                        </span>
                                        <span className="text-xs text-gray-400">— {mapping.domain}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Zap className="w-3 h-3" />
                                        {entity.occurrence_count}× used
                                    </div>
                                </div>
                                <div className="space-y-1.5 mt-3">
                                    {mapping.suggestions.map((suggestion, si) => (
                                        <div key={si} className="flex items-center gap-2 text-sm text-gray-700">
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            {suggestion}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-5 p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                <p className="text-xs text-indigo-700">
                    <strong>💡 Tip:</strong> Learning paths are generated based on your most-used tools and applications. The more activities you capture, the more personalized your suggestions become.
                </p>
            </div>
        </div>
    );
}
