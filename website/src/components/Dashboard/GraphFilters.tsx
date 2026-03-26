'use client';

import { Search, X, Filter } from 'lucide-react';
import { useState } from 'react';

interface GraphFiltersProps {
    onFilterChange: (filters: {
        nodeTypes: string[];
        relationshipTypes: string[];
        searchQuery: string;
    }) => void;
}

const NODE_TYPES = [
    { value: 'PERSON',       label: 'People',        color: '#3b82f6' },
    { value: 'PROJECT',      label: 'Projects',      color: '#8b5cf6' },
    { value: 'TOPIC',        label: 'Topics',        color: '#10b981' },
    { value: 'ORGANIZATION', label: 'Organizations', color: '#f59e0b' },
    { value: 'INSTITUTION',  label: 'Institutions',  color: '#6366f1' },
    { value: 'TOOL',         label: 'Tools',         color: '#06b6d4' },
    { value: 'PAPER',        label: 'Papers',        color: '#6b7280' },
    { value: 'DATASET',      label: 'Datasets',      color: '#84cc16' },
    { value: 'VENUE',        label: 'Venues',        color: '#f43f5e' },
];

// The relationship types added or enhanced by the new inference pipeline
const RELATIONSHIP_TYPES = [
    { value: 'AFFILIATED_WITH',   label: 'Affiliated With',  color: '#8b5cf6' },
    { value: 'WORKS_ON',          label: 'Works On',         color: '#3b82f6' },
    { value: 'CONTRIBUTES_TO',    label: 'Contributes To',   color: '#10b981' },
    { value: 'LEARNED_FROM',      label: 'Learned From',     color: '#f59e0b', isNew: true },
    { value: 'USED_TOGETHER',     label: 'Used Together',    color: '#06b6d4', isNew: true },
    { value: 'RELATED_TO',        label: 'Related To',       color: '#6b7280' },
    { value: 'USES',              label: 'Uses',             color: '#f43f5e' },
    { value: 'COLLABORATES_WITH', label: 'Collaborates With',color: '#84cc16' },
];

export function GraphFilters({ onFilterChange }: GraphFiltersProps) {
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [selectedRels, setSelectedRels] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const handleTypeToggle = (type: string) => {
        const newTypes = selectedTypes.includes(type)
            ? selectedTypes.filter(t => t !== type)
            : [...selectedTypes, type];
        setSelectedTypes(newTypes);
        onFilterChange({ nodeTypes: newTypes, relationshipTypes: selectedRels, searchQuery });
    };

    const handleRelToggle = (rel: string) => {
        const newRels = selectedRels.includes(rel)
            ? selectedRels.filter(r => r !== rel)
            : [...selectedRels, rel];
        setSelectedRels(newRels);
        onFilterChange({ nodeTypes: selectedTypes, relationshipTypes: newRels, searchQuery });
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        onFilterChange({ nodeTypes: selectedTypes, relationshipTypes: selectedRels, searchQuery: query });
    };

    const handleClearAll = () => {
        setSelectedTypes([]);
        setSelectedRels([]);
        setSearchQuery('');
        onFilterChange({ nodeTypes: [], relationshipTypes: [], searchQuery: '' });
    };

    const hasFilters = selectedTypes.length > 0 || selectedRels.length > 0 || !!searchQuery;

    return (
        <div className="h-full bg-white border-r border-gray-200 p-4 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                </div>
                {hasFilters && (
                    <button
                        onClick={handleClearAll}
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Search */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Nodes
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Search by name..."
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => handleSearchChange('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        >
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                    )}
                </div>
            </div>

            {/* Node Type Filters */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Node Types
                </label>
                <div className="space-y-1.5">
                    {NODE_TYPES.map((type) => (
                        <label
                            key={type.value}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedTypes.includes(type.value)}
                                onChange={() => handleTypeToggle(type.value)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: type.color }}
                            />
                            <span className="text-sm text-gray-700">{type.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Relationship Type Filters */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship Types
                </label>
                <p className="text-xs text-gray-400 mb-3">Filter edges by inferred relationship</p>
                <div className="space-y-1.5">
                    {RELATIONSHIP_TYPES.map((rel) => (
                        <label
                            key={rel.value}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                checked={selectedRels.includes(rel.value)}
                                onChange={() => handleRelToggle(rel.value)}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: rel.color }}
                            />
                            <span className="text-sm text-gray-700 flex-1">{rel.label}</span>
                            {rel.isNew && (
                                <span className="text-[9px] font-bold px-1 py-0.5 bg-green-100 text-green-700 rounded uppercase tracking-wide">
                                    new
                                </span>
                            )}
                        </label>
                    ))}
                </div>
            </div>

            {/* Active Filters Summary */}
            {hasFilters && (
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">ACTIVE FILTERS</p>
                    <div className="space-y-1">
                        {selectedTypes.length > 0 && (
                            <p className="text-xs text-gray-600">
                                {selectedTypes.length} node type{selectedTypes.length > 1 ? 's' : ''}
                            </p>
                        )}
                        {selectedRels.length > 0 && (
                            <p className="text-xs text-gray-600">
                                {selectedRels.length} relationship type{selectedRels.length > 1 ? 's' : ''}
                            </p>
                        )}
                        {searchQuery && (
                            <p className="text-xs text-gray-600">
                                Search: &quot;{searchQuery}&quot;
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
