'use client';

import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useCollaborationNetwork } from '@/lib/hooks/useCollaborationMetrics';

export function CollaborationNetworkChart() {
    const { data, isLoading, error } = useCollaborationNetwork();

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Collaboration Network</h3>
                <div className="bg-gray-100 animate-pulse rounded h-96" />
            </div>
        );
    }

    if (error || !data || data.nodes.length === 0) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Collaboration Network</h3>
                <div className="bg-gray-50 rounded p-8 text-center">
                    <p className="text-gray-500">No network data available</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Collaborate with more people to see your network
                    </p>
                </div>
            </div>
        );
    }

    // Convert network data to scatter chart format
    // Position nodes in a circular layout
    const chartData = data.nodes.map((node, index) => {
        const angle = (index / data.nodes.length) * 2 * Math.PI;
        const radius = 100;
        return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: node.size, // Size of the node
            name: node.name,
            type: node.type,
        };
    });

    const colors: Record<string, string> = {
        person: '#3b82f6',
        project: '#8b5cf6',
        artifact: '#10b981',
        organization: '#f59e0b',
        concept: '#14b8a6',
        skill: '#6366f1',
        event: '#ef4444',
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Collaboration Network</h3>
            <p className="text-sm text-gray-600 mb-4">
                Your collaboration network with {data.nodes.length} entities and {data.edges.length} connections
            </p>

            <ResponsiveContainer width="100%" height={400}>
                <ScatterChart
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                    <XAxis
                        type="number"
                        dataKey="x"
                        hide
                        domain={[-150, 150]}
                    />
                    <YAxis
                        type="number"
                        dataKey="y"
                        hide
                        domain={[-150, 150]}
                    />
                    <ZAxis
                        type="number"
                        dataKey="z"
                        range={[100, 1000]}
                    />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                        <p className="font-semibold text-gray-900">{data.name}</p>
                                        <p className="text-sm text-gray-600">{data.type}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Interactions: {data.z}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter
                        data={chartData}
                        fill="#3b82f6"
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={colors[entry.type as keyof typeof colors] || '#3b82f6'}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center">
                {Object.entries(colors).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-gray-600">{type}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
