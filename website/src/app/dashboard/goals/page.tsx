'use client';

import { useState } from 'react';
import { Target, Plus, Trash2, CheckCircle, Clock, PauseCircle, X, Flame } from 'lucide-react';
import { useGoals, useCreateGoal, useDeleteGoal, useUpdateGoal, Goal, GoalCreate } from '@/lib/hooks/useGoals';

const CATEGORIES = [
    { id: 'focus', label: 'Focus', color: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-200' },
    { id: 'productivity', label: 'Productivity', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
    { id: 'learning', label: 'Learning', color: 'bg-purple-100 text-purple-700', border: 'border-purple-200' },
    { id: 'wellness', label: 'Wellness', color: 'bg-rose-100 text-rose-700', border: 'border-rose-200' },
    { id: 'custom', label: 'Custom', color: 'bg-gray-100 text-gray-700', border: 'border-gray-200' },
];

const QUICK_GOALS: GoalCreate[] = [
    { title: 'Deep Work 4h/day', category: 'focus', target_value: 4, unit: 'hours' },
    { title: 'Break every 90min', category: 'wellness', target_value: 5, unit: 'sessions' },
    { title: 'Learn 2 skills/month', category: 'learning', target_value: 2, unit: 'sessions' },
    { title: 'Limit meetings to 2h', category: 'productivity', target_value: 2, unit: 'hours' },
];

function GoalCard({ goal, onDelete, onToggle }: { goal: Goal; onDelete: (id: string) => void; onToggle: (id: string, status: string) => void }) {
    const pct = Math.min(100, goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0);
    const cat = CATEGORIES.find(c => c.id === goal.category) ?? CATEGORIES[4];
    const statusIcon = goal.status === 'completed'
        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
        : goal.status === 'paused'
            ? <PauseCircle className="w-4 h-4 text-amber-500" />
            : <Clock className="w-4 h-4 text-indigo-500" />;

    const daysLeft = goal.deadline
        ? Math.max(0, Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / 86400000))
        : null;

    return (
        <div className={`bg-white rounded-2xl border p-5 ${cat.border} hover:shadow-sm transition-shadow`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>{cat.label}</span>
                        {goal.streak_count > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-orange-600">
                                <Flame className="w-3 h-3" />{goal.streak_count}
                            </span>
                        )}
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{goal.title}</h3>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                    {statusIcon}
                    <button
                        onClick={() => onDelete(goal.id)}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Progress */}
            <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">{pct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                        className={`h-2 rounded-full transition-all ${goal.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mt-3">
                {daysLeft !== null
                    ? <span className={`text-xs ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-400'}`}>
                        {daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                    </span>
                    : <span className="text-xs text-gray-400">No deadline</span>
                }
                <button
                    onClick={() => onToggle(goal.id, goal.status === 'paused' ? 'active' : 'paused')}
                    className="text-xs text-gray-500 hover:text-indigo-600 transition-colors"
                >
                    {goal.status === 'paused' ? 'Resume' : 'Pause'}
                </button>
            </div>
        </div>
    );
}

function AddGoalSheet({ onClose }: { onClose: () => void }) {
    const { mutate: create, isPending } = useCreateGoal();
    const [form, setForm] = useState<GoalCreate>({ title: '', category: 'focus', target_value: 4, unit: 'hours' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) return;
        create(form, { onSuccess: () => onClose() });
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Add Goal</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
                </div>

                {/* Quick Goals */}
                <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Quick add:</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_GOALS.map(q => (
                            <button
                                key={q.title}
                                type="button"
                                onClick={() => { create(q, { onSuccess: () => onClose() }); }}
                                className="text-xs px-2.5 py-1 rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
                            >
                                + {q.title}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Goal Title</label>
                        <input
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none"
                            placeholder="e.g. Deep work 3h per day"
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                                value={form.category}
                                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            >
                                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Unit</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                                value={form.unit}
                                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                            >
                                {['hours', 'sessions', 'points', '%'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Target Value</label>
                            <input
                                type="number" step="0.5" min="0.5"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                                value={form.target_value}
                                onChange={e => setForm(f => ({ ...f, target_value: parseFloat(e.target.value) || 1 }))}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Deadline (optional)</label>
                            <input
                                type="date"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
                                value={form.deadline ?? ''}
                                onChange={e => setForm(f => ({ ...f, deadline: e.target.value || undefined }))}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                    >
                        {isPending ? 'Creating...' : 'Create Goal'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function GoalsPage() {
    const { data: goals = [], isLoading } = useGoals();
    const { mutate: deleteGoal } = useDeleteGoal();
    const { mutate: updateGoal } = useUpdateGoal();
    const [showAdd, setShowAdd] = useState(false);

    const active = goals.filter(g => g.status === 'active');
    const completed = goals.filter(g => g.status === 'completed');
    const paused = goals.filter(g => g.status === 'paused');

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Target className="w-6 h-6 text-indigo-500" /> Goals & Progress
                    </h1>
                    <p className="text-gray-500 mt-1">Set, track, and achieve your productivity and learning goals</p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Goal
                </button>
            </div>

            {/* Summary Row */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Active', count: active.length, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                    { label: 'Completed', count: completed.length, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                    { label: 'Paused', count: paused.length, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                ].map(s => (
                    <div key={s.label} className={`rounded-xl border px-5 py-4 text-center ${s.color}`}>
                        <p className="text-2xl font-bold">{s.count}</p>
                        <p className="text-xs font-medium mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />)}
                </div>
            ) : goals.length === 0 ? (
                /* Empty State */
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No goals yet</h3>
                    <p className="text-gray-500 text-sm mb-5">Create your first goal to start tracking your progress</p>
                    <div className="flex flex-wrap justify-center gap-2 mb-5">
                        {QUICK_GOALS.map(q => (
                            <button
                                key={q.title}
                                className="text-sm px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-colors"
                                onClick={() => setShowAdd(true)}
                            >
                                + {q.title}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="w-4 h-4 inline mr-1" />Create a Goal
                    </button>
                </div>
            ) : (
                <>
                    {/* Active Goals */}
                    {active.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Active</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {active.map(g => (
                                    <GoalCard
                                        key={g.id} goal={g}
                                        onDelete={id => deleteGoal(id)}
                                        onToggle={(id, status) => updateGoal({ id, status })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Completed Goals */}
                    {completed.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-emerald-500" /> Completed
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {completed.map(g => (
                                    <GoalCard
                                        key={g.id} goal={g}
                                        onDelete={id => deleteGoal(id)}
                                        onToggle={(id, status) => updateGoal({ id, status })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Paused Goals */}
                    {paused.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Paused</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paused.map(g => (
                                    <GoalCard
                                        key={g.id} goal={g}
                                        onDelete={id => deleteGoal(id)}
                                        onToggle={(id, status) => updateGoal({ id, status })}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {showAdd && <AddGoalSheet onClose={() => setShowAdd(false)} />}
        </div>
    );
}
