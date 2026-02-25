'use client';

import { Search, X, Filter } from 'lucide-react';
import { useState } from 'react';

interface GraphFiltersProps {
    onFilterChange: (filters: {
        nodeTypes: string[];
        searchQuery: string;
    }) => void;
}

const NODE_TYPES = [
    { value: 'PERSON', label: 'People', color: '#3b82f6' },
    { value: 'PROJECT', label: 'Projects', color: '#8b5cf6' },
    { value: 'SKILL', label: 'Skills', color: '#10b981' },
    { value: 'ORGANIZATION', label: 'Organizations', color: '#f59e0b' },
    { value: 'DOCUMENT', label: 'Documents', color: '#6b7280' },
];

export function GraphFilters({ onFilterChange }: GraphFiltersProps) {
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const handleTypeToggle = (type: string) => {
        const newTypes = selectedTypes.includes(type)
            ? selectedTypes.filter(t => t !== type)
            : [...selectedTypes, type];

        setSelectedTypes(newTypes);
        onFilterChange({ nodeTypes: newTypes, searchQuery });
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        onFilterChange({ nodeTypes: selectedTypes, searchQuery: query });
    };

    const handleClearAll = () => {
        setSelectedTypes([]);
        setSearchQuery('');
        onFilterChange({ nodeTypes: [], searchQuery: '' });
    };

    return (
        <div className="h-full bg-white border-r border-gray-200 p-4 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-900">Filters</h3>
                </div>
                {(selectedTypes.length > 0 || searchQuery) && (
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
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <div className="space-y-2">
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
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: type.color }}
                            />
                            <span className="text-sm text-gray-700">{type.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Active Filters Summary */}
            {(selectedTypes.length > 0 || searchQuery) && (
                <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-2">ACTIVE FILTERS</p>
                    <div className="space-y-1">
                        {selectedTypes.length > 0 && (
                            <p className="text-xs text-gray-600">
                                {selectedTypes.length} type{selectedTypes.length > 1 ? 's' : ''} selected
                            </p>
                        )}
                        {searchQuery && (
                            <p className="text-xs text-gray-600">
                                Search: "{searchQuery}"
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
