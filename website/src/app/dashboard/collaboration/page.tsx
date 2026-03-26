'use client';

import { CollaborationMetrics } from '@/components/Dashboard/CollaborationMetrics';
import { TopCollaborators } from '@/components/Dashboard/TopCollaborators';
import { CollaborationNetworkChart } from '@/components/Dashboard/CollaborationNetworkChart';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useCollaborationWeekly } from '@/lib/hooks/useCollaborationMetrics';

export default function CollaborationPage() {
    const { isConnected, lastUpdate } = useWebSocket();
    const { data } = useCollaborationWeekly();

    // Dynamic insights based on actual data
    const insights: string[] = [];
    if (data) {
        const collabCount = data.total_collaborators || data.top_collaborators.length;
        if (collabCount > 0) {
            insights.push(`You've interacted with ${collabCount} unique collaborators this week`);
        }
        if (data.meeting_count > 0) {
            insights.push(`${data.meeting_count} meetings tracked — consider protecting focus blocks`);
        }
        if (data.communication_frequency === 'High') {
            insights.push('Communication volume is high — great for teamwork, but watch for context-switch fatigue');
        } else if (data.communication_frequency === 'Low') {
            insights.push('Communication volume is low — consider reaching out to teammates');
        }
        if (collabCount > 5) {
            insights.push('Strong network diversity — you are collaborating across multiple people');
        }
    }
    if (insights.length === 0) {
        insights.push('Diversify your collaborations to expand your network');
        insights.push('Regular 1:1 meetings strengthen professional relationships');
        insights.push('Cross-functional collaboration boosts innovation');
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Collaboration Hub</h1>
                    <p className="text-gray-600 mt-1">Discover who you work with and expand your network</p>
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
            <CollaborationMetrics />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopCollaborators />
                <CollaborationNetworkChart />
            </div>

            {/* Dynamic Insights */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">🤝 Collaboration Insights</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                    {insights.map((insight, i) => (
                        <li key={i}>• {insight}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

