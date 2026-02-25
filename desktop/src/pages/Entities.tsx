import React, { useState, useEffect } from 'react';
import { entityAPI } from '../services/entityAPI';
import './Entities.css';

interface Entity {
    id: string;
    canonical_name: string;
    type: string;
    frequency: number;
    aliases?: string[];
    occurrence_count?: number;
    external_ids?: Record<string, string>;
}

interface Duplicate {
    entity_id: string;
    canonical_name: string;
    type: string;
    confidence: number;
    methods: string[];
    recommendation: string;
}

const Entities: React.FC = () => {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
    const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
    const [loading, setLoading] = useState(true);
    const [merging, setMerging] = useState(false);
    const [filter, setFilter] = useState({
        type: '',
        search: ''
    });
    const [view, setView] = useState<'list' | 'duplicates'>('list');

    useEffect(() => {
        loadEntities();
    }, [filter.type]);

    const loadEntities = async () => {
        setLoading(true);
        try {
            const params: any = { limit: 100 };
            if (filter.type) params.type = filter.type;

            const data = await entityAPI.listEntities(params);
            setEntities(data.entities || []);
        } catch (error) {
            console.error('Failed to load entities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEntitySelect = async (entity: Entity) => {
        setSelectedEntity(entity);
        setView('duplicates');

        // Load duplicates
        try {
            const data = await entityAPI.findDuplicates(entity.id);
            setDuplicates(data.duplicates || []);
        } catch (error) {
            console.error('Failed to load duplicates:', error);
            setDuplicates([]);
        }
    };

    const handleMerge = async (duplicate: Duplicate) => {
        if (!selectedEntity) return;

        const confirmed = window.confirm(
            `Merge "${duplicate.canonical_name}" into "${selectedEntity.canonical_name}"?\n\n` +
            `This will:\n` +
            `• Combine all occurrences\n` +
            `• Merge aliases and external IDs\n` +
            `• Mark source entity as merged\n\n` +
            `Confidence: ${(duplicate.confidence * 100).toFixed(1)}%`
        );

        if (!confirmed) return;

        setMerging(true);
        try {
            await entityAPI.mergeEntities(duplicate.entity_id, selectedEntity.id);

            // Reload data
            await loadEntities();
            setDuplicates(prev => prev.filter(d => d.entity_id !== duplicate.entity_id));

            alert('Entities merged successfully!');
        } catch (error) {
            console.error('Merge failed:', error);
            alert(`Merge failed: ${(error as Error).message}`);
        } finally {
            setMerging(false);
        }
    };

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            'PERSON': '👤',
            'ORG': '🏢',
            'TOOL': '🔧',
            'PLACE': '📍',
            'PAPER': '📄',
            'PROJECT': '💼',
            'SKILL': '⭐',
            'EVENT': '📅'
        };
        return icons[type] || '📌';
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.95) return '#10b981'; // green
        if (confidence >= 0.85) return '#f59e0b'; // yellow
        if (confidence >= 0.75) return '#f97316'; // orange
        return '#ef4444'; // red
    };

    const filteredEntities = entities.filter(entity => {
        if (filter.search) {
            const search = filter.search.toLowerCase();
            return entity.canonical_name.toLowerCase().includes(search) ||
                (entity.aliases && entity.aliases.some(a => a.toLowerCase().includes(search)));
        }
        return true;
    });

    return (
        <div className="entities-page">
            <div className="entities-header">
                <h1>Entity Management</h1>
                <p>Manage recognized entities and merge duplicates</p>
            </div>

            <div className="entities-controls">
                <div className="view-tabs">
                    <button
                        className={view === 'list' ? 'active' : ''}
                        onClick={() => setView('list')}
                    >
                        All Entities ({entities.length})
                    </button>
                    <button
                        className={view === 'duplicates' ? 'active' : ''}
                        onClick={() => setView('duplicates')}
                        disabled={!selectedEntity}
                    >
                        Duplicates {selectedEntity && duplicates.length > 0 ? `(${duplicates.length})` : ''}
                    </button>
                </div>

                <div className="filters">
                    <input
                        type="text"
                        placeholder="Search entities..."
                        value={filter.search}
                        onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
                        className="search-input"
                    />

                    <select
                        value={filter.type}
                        onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                        className="type-filter"
                    >
                        <option value="">All Types</option>
                        <option value="PERSON">Person</option>
                        <option value="ORG">Organization</option>
                        <option value="TOOL">Tool</option>
                        <option value="PLACE">Place</option>
                        <option value="PAPER">Paper</option>
                        <option value="PROJECT">Project</option>
                        <option value="SKILL">Skill</option>
                        <option value="EVENT">Event</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading">Loading entities...</div>
            ) : (
                <>
                    {view === 'list' && (
                        <div className="entity-list">
                            {filteredEntities.length === 0 ? (
                                <div className="empty-state">
                                    <p>No entities found</p>
                                    <small>Activities will be analyzed to extract entities automatically</small>
                                </div>
                            ) : (
                                <div className="entity-grid">
                                    {filteredEntities.map(entity => (
                                        <div
                                            key={entity.id}
                                            className="entity-card"
                                            onClick={() => handleEntitySelect(entity)}
                                        >
                                            <div className="entity-icon">{getTypeIcon(entity.type)}</div>
                                            <div className="entity-details">
                                                <h3>{entity.canonical_name}</h3>
                                                <div className="entity-meta">
                                                    <span className="entity-type">{entity.type}</span>
                                                    <span className="entity-frequency">
                                                        {entity.frequency || 0} occurrences
                                                    </span>
                                                </div>
                                                {entity.aliases && entity.aliases.length > 0 && (
                                                    <div className="entity-aliases">
                                                        Aliases: {entity.aliases.slice(0, 3).join(', ')}
                                                        {entity.aliases.length > 3 && ` +${entity.aliases.length - 3} more`}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="entity-action">→</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'duplicates' && selectedEntity && (
                        <div className="duplicates-view">
                            <div className="selected-entity">
                                <h2>
                                    {getTypeIcon(selectedEntity.type)} {selectedEntity.canonical_name}
                                </h2>
                                <p>{selectedEntity.frequency} occurrences • {selectedEntity.type}</p>
                                <button onClick={() => setView('list')} className="back-button">
                                    ← Back to list
                                </button>
                            </div>

                            {duplicates.length === 0 ? (
                                <div className="empty-state">
                                    <p>✓ No duplicates found</p>
                                    <small>This entity appears to be unique</small>
                                </div>
                            ) : (
                                <div className="duplicate-list">
                                    <h3>Potential Duplicates ({duplicates.length})</h3>
                                    {duplicates.map(dup => (
                                        <div key={dup.entity_id} className="duplicate-card">
                                            <div className="duplicate-info">
                                                <h4>{dup.canonical_name}</h4>
                                                <div className="duplicate-meta">
                                                    <span className="duplicate-type">{dup.type}</span>
                                                    <span
                                                        className="duplicate-confidence"
                                                        style={{ color: getConfidenceColor(dup.confidence) }}
                                                    >
                                                        {(dup.confidence * 100).toFixed(1)}% match
                                                    </span>
                                                </div>
                                                <div className="duplicate-methods">
                                                    Matched by: {dup.methods.join(', ')}
                                                </div>
                                                <div className={`duplicate-recommendation ${dup.recommendation}`}>
                                                    {dup.recommendation === 'auto_merge' && '🟢 Auto-merge recommended'}
                                                    {dup.recommendation === 'suggest' && '🟡 Review suggested'}
                                                    {dup.recommendation === 'review' && '🔵 Manual review needed'}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleMerge(dup)}
                                                disabled={merging}
                                                className="merge-button"
                                            >
                                                {merging ? 'Merging...' : 'Merge →'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Entities;
