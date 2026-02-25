'use client';

import { useState } from 'react';
import {
    Sparkles, LayoutDashboard, Tag, Network, GitMerge, Clock,
} from 'lucide-react';
import { EnrichmentStats } from '@/components/Dashboard/EnrichmentStats';
import { EntityList } from '@/components/Dashboard/EntityList';
import { EntityDetail } from '@/components/Dashboard/EntityDetail';
import { DuplicateDetection } from '@/components/Dashboard/DuplicateDetection';
import { EntityGraph } from '@/components/Dashboard/EntityGraph';
import { ActivityTimeline } from '@/components/Dashboard/ActivityTimeline';
import type { EntityItem } from '@/lib/hooks/useEntities';
import { useEntities } from '@/lib/hooks/useEntities';

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'entities', label: 'Entities', icon: Tag },
    { id: 'graph', label: 'Knowledge Graph', icon: Network },
    { id: 'duplicates', label: 'Duplicates', icon: GitMerge },
    { id: 'feed', label: 'Activity Feed', icon: Clock },
] as const;

type TabId = typeof TABS[number]['id'];

function GraphTab({ onSelectEntity }: { onSelectEntity?: (e: EntityItem) => void }) {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { data } = useEntities(undefined, 50, 0);
    const entities = data?.entities ?? [];

    // Default to most frequent entity
    const selected = selectedId
        ? entities.find(e => e.id === selectedId)
        : entities[0] ?? null;

    if (entities.length === 0) {
        return (
            <div className="text-center py-16 text-gray-400">
                <Network className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No entities to graph yet</p>
                <p className="text-sm mt-1">
                    The knowledge graph shows how entities co-occur across your activities.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header + entity picker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        Knowledge Graph
                        {selected && <span className="text-purple-600"> — {selected.name}</span>}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Co-occurrence links from PostgreSQL activity data • Click a node to explore
                    </p>
                </div>
                <select
                    value={selected?.id ?? ''}
                    onChange={e => setSelectedId(e.target.value || null)}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[180px]"
                >
                    {entities.map(e => (
                        <option key={e.id} value={e.id}>
                            {e.name} ({e.occurrence_count}×)
                        </option>
                    ))}
                </select>
            </div>

            {selected && (
                <EntityGraph
                    entityId={selected.id}
                    entityName={selected.name}
                    entityType={selected.entity_type}
                    onSelectEntity={onSelectEntity}
                />
            )}

            <p className="text-xs text-gray-400 text-center">
                Edge thickness = co-occurrence strength • Click any neighbor node to navigate to that entity
            </p>
        </div>
    );
}


export default function EnrichmentPage() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [selectedEntity, setSelectedEntity] = useState<EntityItem | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    const handleSelectEntity = (entity: EntityItem) => {
        setSelectedEntity(entity);
        setShowDetail(true);
    };

    const handleFindDuplicates = () => {
        setShowDetail(false);
        setActiveTab('duplicates');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    Data Enrichment
                </h1>
                <p className="text-gray-500 mt-1 ml-[52px]">
                    NER extraction, entity intelligence, and activity enrichment from your work data
                </p>
            </div>

            {/* Tab navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-1 -mb-px overflow-x-auto">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${isActive
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab content */}
            <div className="min-h-[400px]">
                {/* Overview */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <EnrichmentStats />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900 mb-3">
                                    Recent Entities
                                </h2>
                                <EntityList
                                    onSelectEntity={(e) => {
                                        handleSelectEntity(e);
                                        setActiveTab('entities');
                                    }}
                                    selectedEntityId={selectedEntity?.id}
                                />
                            </div>
                            {selectedEntity && (
                                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                                    <EntityDetail
                                        entity={selectedEntity}
                                        onClose={() => setSelectedEntity(null)}
                                        onFindDuplicates={handleFindDuplicates}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Entities tab — list + detail panel */}
                {activeTab === 'entities' && (
                    <div className={`grid gap-6 ${showDetail && selectedEntity ? 'grid-cols-1 lg:grid-cols-[1fr_380px]' : 'grid-cols-1'}`}>
                        <EntityList
                            onSelectEntity={(e) => {
                                setSelectedEntity(e);
                                setShowDetail(true);
                            }}
                            selectedEntityId={selectedEntity?.id}
                        />
                        {showDetail && selectedEntity && (
                            <div className="border border-gray-200 rounded-2xl overflow-hidden sticky top-4 max-h-[70vh]">
                                <EntityDetail
                                    entity={selectedEntity}
                                    onClose={() => setShowDetail(false)}
                                    onFindDuplicates={handleFindDuplicates}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Knowledge Graph */}
                {activeTab === 'graph' && <GraphTab onSelectEntity={handleSelectEntity} />}

                {/* Duplicates */}
                {activeTab === 'duplicates' && <DuplicateDetection />}

                {/* Activity Feed (enriched timeline) */}
                {activeTab === 'feed' && (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-500">
                            Your activity timeline enriched with auto-tags and extracted entities from the NER pipeline.
                        </p>
                        <ActivityTimeline />
                    </div>
                )}
            </div>
        </div>
    );
}
