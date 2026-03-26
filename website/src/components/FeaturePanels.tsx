'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAPIClient } from '@/lib/api';
import {
    TrendingUp, BarChart3, Calendar, Sun, Moon, Loader2,
    Mic, MicOff, Volume2, VolumeX, Puzzle, Plus, X,
    Network, Tag, Trash2, ToggleLeft, ToggleRight
} from 'lucide-react';

// =====================================================
// PREDICTIVE FORECAST PANEL — for productivity/page.tsx
// =====================================================

export function ProductivityForecastPanel() {
    const api = getAPIClient();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<any>('/api/v1/analytics/productivity/forecast');
                setData(res);
            } catch { }
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="bg-white border border-gray-200 rounded-2xl p-6"><Loader2 size={20} className="animate-spin text-indigo-500 mx-auto" /></div>;
    if (!data || !data.predictions?.length) return null;

    const maxScore = Math.max(...data.predictions.map((p: any) => p.upper_bound || p.predicted_score));

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-900">Productivity Forecast</h3>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    data.trend_direction === 'improving' ? 'bg-green-100 text-green-700'
                    : data.trend_direction === 'declining' ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>{data.trend_direction} trend</span>
            </div>

            {/* Summary */}
            <p className="text-xs text-gray-500 mb-4">{data.forecast_summary}</p>

            {/* Prediction bars */}
            <div className="space-y-1.5 mb-4">
                {data.predictions.slice(0, 7).map((p: any) => (
                    <div key={p.date} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-10 flex-shrink-0">{p.day_name?.slice(0, 3)}</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full relative overflow-hidden">
                            {/* Confidence band */}
                            <div className="absolute h-full bg-indigo-100 rounded-full" style={{ left: `${(p.lower_bound / maxScore) * 100}%`, width: `${((p.upper_bound - p.lower_bound) / maxScore) * 100}%` }} />
                            {/* Predicted score */}
                            <div className="absolute h-full bg-indigo-500 rounded-full" style={{ width: `${(p.predicted_score / maxScore) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-700 w-6 text-right">{Math.round(p.predicted_score)}</span>
                    </div>
                ))}
            </div>

            {/* Weekly pattern */}
            <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Weekly Pattern</p>
                <div className="flex gap-1">
                    {(data.weekly_pattern || []).map((d: any) => {
                        const height = Math.max(8, (d.average_score / 100) * 48);
                        return (
                            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                                <div className="w-full bg-gray-100 rounded-t" style={{ height: 48 }}>
                                    <div className="w-full bg-indigo-400 rounded-t mt-auto" style={{ height, position: 'relative', top: 48 - height }} />
                                </div>
                                <span className="text-[9px] text-gray-400">{d.day.slice(0, 2)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Peak hours */}
            {data.peak_hours?.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-500">
                    <Sun size={10} /> Peak: {data.peak_hours.slice(0, 3).map((h: any) => h.label).join(', ')}
                </div>
            )}
        </div>
    );
}


// =====================================================
// COMMUNITIES PANEL — for graph/page.tsx
// =====================================================

export function CommunitiesPanel() {
    const api = getAPIClient();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get<any>('/api/v1/analytics/intelligence/communities');
                setData(res);
            } catch { }
            setLoading(false);
        })();
    }, []);

    if (loading) return <div className="bg-white border border-gray-200 rounded-2xl p-6"><Loader2 size={20} className="animate-spin text-indigo-500 mx-auto" /></div>;
    if (!data || !data.communities?.length) return null;

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#06b6d4', '#eab308'];

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Network size={16} className="text-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-900">Communities</h3>
                </div>
                <span className="text-xs text-gray-400">modularity: {data.modularity_score}</span>
            </div>

            <div className="space-y-3">
                {data.communities.map((c: any, i: number) => (
                    <div key={c.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                <span className="text-xs font-medium text-gray-800">{c.label}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">density: {c.density}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {c.entities.slice(0, 6).map((e: any) => (
                                <span key={e.id} className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">{e.name}</span>
                            ))}
                            {c.size > 6 && <span className="text-[10px] text-gray-400">+{c.size - 6} more</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// =====================================================
// VOICE INPUT/OUTPUT — for chat/page.tsx
// =====================================================

export function VoiceInputButton({ onTranscript }: { onTranscript: (text: string) => void }) {
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const toggleListening = useCallback(() => {
        if (listening) {
            recognitionRef.current?.stop();
            setListening(false);
            return;
        }

        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert('Speech recognition not supported in this browser');
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            onTranscript(transcript);
            setListening(false);
        };

        recognition.onerror = () => setListening(false);
        recognition.onend = () => setListening(false);

        recognitionRef.current = recognition;
        recognition.start();
        setListening(true);
    }, [listening, onTranscript]);

    return (
        <button
            onClick={toggleListening}
            className={`p-2 rounded-lg transition-all ${
                listening
                    ? 'bg-red-100 text-red-600 animate-pulse'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
            }`}
            title={listening ? 'Stop listening' : 'Voice input'}
        >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
    );
}

export function SpeakButton({ text }: { text: string }) {
    const [speaking, setSpeaking] = useState(false);

    const toggleSpeak = () => {
        if (speaking) {
            speechSynthesis.cancel();
            setSpeaking(false);
            return;
        }
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 1.0;
        utter.onend = () => setSpeaking(false);
        speechSynthesis.speak(utter);
        setSpeaking(true);
    };

    return (
        <button
            onClick={toggleSpeak}
            className={`p-1 rounded transition-all ${speaking ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
            title={speaking ? 'Stop speaking' : 'Read aloud'}
        >
            {speaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
    );
}


// =====================================================
// PLUGIN GALLERY — for chat/page.tsx
// =====================================================

export function PluginGallery() {
    const api = getAPIClient();
    const [plugins, setPlugins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPrompt, setNewPrompt] = useState('');

    const fetchPlugins = async () => {
        try {
            const res = await api.get<any>('/api/ai/plugins');
            setPlugins(res.plugins || []);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchPlugins(); }, []);

    const togglePlugin = async (id: string) => {
        try {
            await api.put(`/api/ai/plugins/${id}/toggle`, {});
            fetchPlugins();
        } catch { }
    };

    const createPlugin = async () => {
        if (!newName.trim() || !newPrompt.trim()) return;
        try {
            await api.post('/api/ai/plugins', {
                name: newName, description: newDesc, system_prompt: newPrompt,
            });
            setNewName(''); setNewDesc(''); setNewPrompt('');
            setShowCreate(false);
            fetchPlugins();
        } catch { }
    };

    const deletePlugin = async (id: string) => {
        try {
            await api.delete(`/api/ai/plugins/${id}`);
            fetchPlugins();
        } catch { }
    };

    if (loading) return <Loader2 size={16} className="animate-spin text-indigo-500" />;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Puzzle size={14} className="text-purple-600" />
                    <span className="text-xs font-bold text-gray-900">AI Plugins</span>
                </div>
                <button onClick={() => setShowCreate(v => !v)} className="text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                    <Plus size={12} /> New
                </button>
            </div>

            {showCreate && (
                <div className="bg-indigo-50 rounded-xl p-3 space-y-2 border border-indigo-200">
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Plugin name" className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-white" />
                    <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description" className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-white" />
                    <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)} placeholder="System prompt..." rows={3} className="w-full px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-white resize-none" />
                    <div className="flex gap-2">
                        <button onClick={createPlugin} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500">Create</button>
                        <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-gray-500 text-xs">Cancel</button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {plugins.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                        <span className="text-base">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{p.description}</p>
                        </div>
                        <button onClick={() => togglePlugin(p.id)} className="flex-shrink-0">
                            {p.enabled
                                ? <ToggleRight size={18} className="text-indigo-600" />
                                : <ToggleLeft size={18} className="text-gray-400" />
                            }
                        </button>
                        {!p.builtin && (
                            <button onClick={() => deletePlugin(p.id)} className="flex-shrink-0 p-1 hover:bg-red-50 rounded">
                                <Trash2 size={12} className="text-red-400" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}


// =====================================================
// CUSTOM ENTITY TYPES — for enrichment/page.tsx
// =====================================================

export function CustomEntityTypesPanel() {
    const api = getAPIClient();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#6b7280');
    const [newIcon, setNewIcon] = useState('🏷️');

    const fetchTypes = async () => {
        try {
            const res = await api.get<any>('/api/v1/analytics/entities/types');
            setData(res);
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchTypes(); }, []);

    const createType = async () => {
        if (!newName.trim()) return;
        try {
            await api.post('/api/v1/analytics/entities/types', { name: newName, color: newColor, icon: newIcon });
            setNewName(''); setNewColor('#6b7280'); setNewIcon('🏷️');
            fetchTypes();
        } catch { }
    };

    const deleteType = async (name: string) => {
        try {
            await api.delete(`/api/v1/analytics/entities/types/${name}`);
            fetchTypes();
        } catch { }
    };

    if (loading) return <div className="bg-white border border-gray-200 rounded-2xl p-6"><Loader2 size={20} className="animate-spin text-indigo-500 mx-auto" /></div>;
    if (!data) return null;

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Tag size={16} className="text-indigo-600" />
                    <h3 className="text-sm font-bold text-gray-900">Entity Types</h3>
                </div>
                <span className="text-xs text-gray-400">{(data.all_types || []).length} types</span>
            </div>

            {/* Built-in types */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                {(data.builtin_types || []).map((t: any) => (
                    <span key={t.name} className="text-[10px] px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600 flex items-center gap-1">
                        {t.icon} {t.name}
                    </span>
                ))}
            </div>

            {/* Custom types */}
            {data.custom_types?.length > 0 && (
                <div className="space-y-1.5 mb-4">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Custom Types</p>
                    {data.custom_types.map((t: any) => (
                        <div key={t.name} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 border border-gray-200">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                            <span className="text-xs text-gray-700 flex-1">{t.icon} {t.name}</span>
                            <button onClick={() => deleteType(t.name)} className="p-1 hover:bg-red-50 rounded">
                                <Trash2 size={12} className="text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Create new type */}
            <div className="flex items-center gap-2">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="new type name" className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50" />
                <input value={newColor} onChange={e => setNewColor(e.target.value)} type="color" className="w-8 h-8 rounded cursor-pointer border-0" />
                <button onClick={createType} disabled={!newName.trim()} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-500 disabled:opacity-50">
                    Add
                </button>
            </div>
        </div>
    );
}
