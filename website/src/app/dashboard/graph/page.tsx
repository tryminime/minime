'use client';

import { useCallback, useRef, useState } from 'react';
import type Sigma from 'sigma';
import { GraphExplorer } from '@/components/Dashboard/GraphExplorer';
import { GraphFilters } from '@/components/Dashboard/GraphFilters';
import { NodeDetailsPanel } from '@/components/Dashboard/NodeDetailsPanel';
import { CommunitiesPanel } from '@/components/Dashboard/CommunitiesPanel';
import { LearningPathsPanel } from '@/components/Dashboard/LearningPathsPanel';
import { ExpertInsightsPanel } from '@/components/Dashboard/ExpertInsightsPanel';
import { LinkPredictionPanel } from '@/components/Dashboard/LinkPredictionPanel';
import { Network, ZoomIn, ZoomOut, Maximize2, Download, Layers, BookOpen, Award, Link2 } from 'lucide-react';
import { useGraphData } from '@/lib/hooks/useGraphData';

type BottomTab = 'communities' | 'learning' | 'expertise' | 'links';

const BOTTOM_TABS: { id: BottomTab; label: string; icon: React.ReactNode }[] = [
    { id: 'communities', label: 'Communities', icon: <Layers className="w-4 h-4" /> },
    { id: 'learning', label: 'Learning Paths', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'expertise', label: 'Expert Insights', icon: <Award className="w-4 h-4" /> },
    { id: 'links', label: 'Suggested Links', icon: <Link2 className="w-4 h-4" /> },
];

export default function GraphPage() {
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [selectedNodeData, setSelectedNodeData] = useState<{ id: string; label: string; type: string; size: number } | null>(null);
    const [activeTab, setActiveTab] = useState<BottomTab>('communities');
    const [filters, setFilters] = useState<{ nodeTypes: string[]; searchQuery: string }>({
        nodeTypes: [],
        searchQuery: '',
    });
    const sigmaInstanceRef = useRef<Sigma | null>(null);
    const { data: graphData } = useGraphData();

    const handleNodeClick = useCallback((nodeId: string, nodeData?: { id: string; label: string; type: string; size: number }) => {
        setSelectedNode(nodeId);
        setSelectedNodeData(nodeData ?? null);
    }, []);

    const handleSigmaReady = useCallback((sigma: Sigma) => {
        sigmaInstanceRef.current = sigma;
    }, []);

    const handleZoomIn = () => {
        const sigma = sigmaInstanceRef.current;
        if (!sigma) return;
        const camera = sigma.getCamera();
        camera.animatedZoom({ duration: 300 });
    };

    const handleZoomOut = () => {
        const sigma = sigmaInstanceRef.current;
        if (!sigma) return;
        const camera = sigma.getCamera();
        camera.animatedUnzoom({ duration: 300 });
    };

    const handleReset = () => {
        const sigma = sigmaInstanceRef.current;
        if (!sigma) return;
        sigma.getCamera().animatedReset({ duration: 400 });
    };

    const handleExport = () => {
        if (!graphData) return;
        const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `minime-knowledge-graph-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* ── Header ────────────────────────────────── */}
            <div className="flex-none bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Network className="w-6 h-6 text-indigo-600" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">Knowledge Graph Explorer</h1>
                            <p className="text-xs text-gray-500">Visualize your network of knowledge and connections</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleZoomIn}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Zoom in"
                        >
                            <ZoomIn className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Zoom out"
                        >
                            <ZoomOut className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            onClick={handleReset}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Reset view"
                        >
                            <Maximize2 className="w-4 h-4 text-gray-600" />
                        </button>
                        <div className="w-px h-5 bg-gray-200 mx-1" />
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            title="Export graph as JSON"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Content ──────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">
                {/* Filters Sidebar */}
                <div className="flex-none w-56 border-r border-gray-100 bg-white overflow-y-auto">
                    <GraphFilters onFilterChange={setFilters} />
                </div>

                {/* Center column: graph top + tabs bottom */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Graph Canvas (top 58%) */}
                    <div className="relative" style={{ height: '58%' }}>
                        {/* Empty state when graph has no nodes */}
                        {graphData && (!graphData.nodes || graphData.nodes.length === 0) ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <div className="text-center max-w-sm px-6">
                                    <Network className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-base font-semibold text-gray-600 mb-2">Your knowledge graph is empty</h3>
                                    <p className="text-sm text-gray-400 mb-4">
                                        The graph builds automatically as you track activities. Start the MiniMe desktop app to begin capturing your work.
                                    </p>
                                    <a
                                        href="/dashboard/activities"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                                    >
                                        View Activities →
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <>
                                <GraphExplorer
                                    onNodeClick={handleNodeClick}
                                    selectedNode={selectedNode}
                                    filters={filters}
                                    onSigmaReady={handleSigmaReady}
                                />

                                {/* Quick tips overlay — dismisses when a node is selected */}
                                {!selectedNode && (
                                    <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm p-3 max-w-xs border border-gray-100 text-xs text-gray-600">
                                        <p className="font-semibold text-gray-700 mb-1">💡 Quick Tips</p>
                                        <ul className="space-y-0.5">
                                            <li>• Click a node to see its details</li>
                                            <li>• Scroll / pinch to zoom</li>
                                            <li>• Drag to pan the canvas</li>
                                            <li>• Use filters on the left to focus</li>
                                        </ul>
                                    </div>
                                )}
                            </>
                        )}
                    </div>


                    {/* Bottom Analytics Tabs (bottom 42%) */}
                    <div className="flex-1 flex flex-col border-t border-gray-200 bg-white overflow-hidden">
                        {/* Tab bar */}
                        <div className="flex-none flex border-b border-gray-100 px-4 pt-1">
                            {BOTTOM_TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 mr-1 transition-colors ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Tab content */}
                        <div className="flex-1 overflow-y-auto">
                            {activeTab === 'communities' && <CommunitiesPanel />}
                            {activeTab === 'learning' && <LearningPathsPanel />}
                            {activeTab === 'expertise' && <ExpertInsightsPanel />}
                            {activeTab === 'links' && <LinkPredictionPanel />}
                        </div>
                    </div>
                </div>

                {/* Node Details Panel (right sidebar — only when node selected) */}
                {selectedNode && (
                    <div className="flex-none w-72 border-l border-gray-100 bg-white overflow-y-auto">
                        <NodeDetailsPanel
                            nodeId={selectedNode}
                            nodeData={selectedNodeData}
                            onClose={() => { setSelectedNode(null); setSelectedNodeData(null); }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
