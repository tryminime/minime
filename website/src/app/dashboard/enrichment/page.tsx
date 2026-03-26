'use client';

import { useState } from 'react';
import {
    Sparkles, LayoutDashboard, Tag, GitMerge, Clock, Layers,
} from 'lucide-react';
import { EnrichmentStats } from '@/components/Dashboard/EnrichmentStats';
import { EntityList } from '@/components/Dashboard/EntityList';
import { EntityDetail } from '@/components/Dashboard/EntityDetail';
import { DuplicateDetection } from '@/components/Dashboard/DuplicateDetection';
import { ActivityTimeline } from '@/components/Dashboard/ActivityTimeline';
import { CustomEntityTypesPanel } from '@/components/FeaturePanels';
import type { EntityItem } from '@/lib/hooks/useEntities';
import { useEntities } from '@/lib/hooks/useEntities';

const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'entities', label: 'Entities', icon: Tag },
    { id: 'types', label: 'Entity Types', icon: Layers },
    { id: 'duplicates', label: 'Duplicates', icon: GitMerge },
    { id: 'feed', label: 'Activity Feed', icon: Clock },
] as const;

type TabId = typeof TABS[number]['id'];



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

                {/* Entity Types */}
                {activeTab === 'types' && <CustomEntityTypesPanel />}



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
