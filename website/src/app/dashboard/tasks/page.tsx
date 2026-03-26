'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CheckSquare, Plus, Trash2, Circle, CheckCircle2, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

// ── Types ──────────────────────────────────────────────────────────────────────

type Priority = 'low' | 'medium' | 'high';
type TaskStatus = 'todo' | 'done';

interface Task {
    id: string;
    title: string;
    priority: Priority;
    status: TaskStatus;
    tag?: string;
    dueDate?: string;
    createdAt: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444',
};

// ── Persistence helpers ────────────────────────────────────────────────────────

function storageKey(userId: string | undefined) {
    // Key is per-user — different users on same browser get different task lists
    return userId ? `minime_tasks_${userId}` : null;
}

function loadTasks(userId: string | undefined): Task[] {
    const key = storageKey(userId);
    if (!key || typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        return JSON.parse(raw) as Task[];
    } catch {
        return [];
    }
}

function saveTasks(userId: string | undefined, tasks: Task[]) {
    const key = storageKey(userId);
    if (!key || typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(tasks));
}

// ── Task Card ──────────────────────────────────────────────────────────────────

function TaskCard({ task, onToggle, onDelete, onUpdate }: {
    task: Task; onToggle: () => void; onDelete: () => void; onUpdate: (updates: Partial<Task>) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(task.title);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editing && inputRef.current) inputRef.current.focus();
    }, [editing]);

    const commitEdit = () => {
        const trimmed = editTitle.trim();
        if (trimmed && trimmed !== task.title) onUpdate({ title: trimmed });
        setEditing(false);
    };

    // Due date helpers
    const getDueBadge = () => {
        if (!task.dueDate) return null;
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const due = new Date(task.dueDate); due.setHours(0, 0, 0, 0);
        const diff = Math.round((due.getTime() - now.getTime()) / 86400000);
        if (task.status === 'done') return null;
        if (diff < 0) return <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">Overdue</span>;
        if (diff === 0) return <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600">Due today</span>;
        if (diff <= 3) return <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">Due in {diff}d</span>;
        return null;
    };

    return (
        <div
            className="group flex items-start gap-3 p-4 rounded-xl transition-all"
            style={{
                background: task.status === 'done' ? 'transparent' : 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                opacity: task.status === 'done' ? 0.6 : 1,
            }}
        >
            <button
                onClick={onToggle}
                className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
            >
                {task.status === 'done' ? (
                    <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
                ) : (
                    <Circle className="w-5 h-5" style={{ color: 'var(--color-border)' }} />
                )}
            </button>

            <div className="flex-1 min-w-0">
                {editing ? (
                    <input
                        ref={inputRef}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false); }}
                        className="text-sm font-medium w-full px-1 py-0.5 rounded outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                        style={{ color: 'var(--color-primary)', background: 'var(--color-shell)' }}
                    />
                ) : (
                    <p
                        className="text-sm font-medium leading-snug cursor-text"
                        onDoubleClick={() => { setEditTitle(task.title); setEditing(true); }}
                        style={{
                            color: 'var(--color-primary)',
                            textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        }}
                    >
                        {task.title}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: PRIORITY_COLORS[task.priority] }}
                    />
                    <span className="text-xs capitalize" style={{ color: 'var(--color-muted)' }}>
                        {task.priority}
                    </span>
                    {task.tag && (
                        <span
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--color-accent)' }}
                        >
                            {task.tag}
                        </span>
                    )}
                    {getDueBadge()}
                </div>
            </div>

            <button
                onClick={onDelete}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-50"
            >
                <Trash2 className="w-4 h-4" style={{ color: 'var(--color-danger)' }} />
            </button>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TasksPage() {
    const { user } = useAuth();
    const userId = user?.id as string | undefined;

    // Load tasks from localStorage (keyed to the logged-in user)
    const [tasks, setTasksState] = useState<Task[]>([]);
    const [hydrated, setHydrated] = useState(false);

    // Load once on mount / when userId changes
    useEffect(() => {
        if (userId !== undefined) {
            setTasksState(loadTasks(userId));
            setHydrated(true);
        }
    }, [userId]);

    // Persist every change
    const setTasks = useCallback((updater: Task[] | ((prev: Task[]) => Task[])) => {
        setTasksState((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            saveTasks(userId, next);
            return next;
        });
    }, [userId]);

    const [newTitle, setNewTitle] = useState('');
    const [newPriority, setNewPriority] = useState<Priority>('medium');
    const [newTag, setNewTag] = useState('');
    const [newDueDate, setNewDueDate] = useState('');
    const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
    const [taskError, setTaskError] = useState(false);

    const addTask = () => {
        const title = newTitle.trim();
        if (!title) {
            setTaskError(true);
            return;
        }
        const task: Task = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            title,
            priority: newPriority,
            status: 'todo',
            tag: newTag.trim() || undefined,
            dueDate: newDueDate || undefined,
            createdAt: new Date().toISOString(),
        };
        setTasks((t) => [task, ...t]);
        setNewTitle('');
        setNewTag('');
        setNewDueDate('');
    };

    const updateTask = (id: string, updates: Partial<Task>) =>
        setTasks((t) => t.map((task) => task.id === id ? { ...task, ...updates } : task));

    const toggleTask = (id: string) =>
        setTasks((t) => t.map((task) =>
            task.id === id ? { ...task, status: task.status === 'done' ? 'todo' : 'done' } : task
        ));

    const deleteTask = (id: string) => setTasks((t) => t.filter((task) => task.id !== id));

    const filtered = tasks
        .filter((t) => filter === 'all' ? true : t.status === filter)
        .sort((a, b) => {
            // Sort completed tasks to bottom
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            return 0;
        });
    const doneCount = tasks.filter((t) => t.status === 'done').length;
    const todoCount = tasks.filter((t) => t.status === 'todo').length;

    // While waiting for auth + localStorage hydration, show skeleton
    if (!hydrated) {
        return (
            <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
                <div className="h-8 rounded-xl w-32" style={{ background: 'var(--color-surface)' }} />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-xl" style={{ background: 'var(--color-surface)' }} />
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Tasks</h1>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                        {todoCount} remaining · {doneCount} completed
                    </p>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    {(['all', 'todo', 'done'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all"
                            style={{
                                background: filter === f ? 'var(--color-accent)' : 'transparent',
                                color: filter === f ? '#fff' : 'var(--color-secondary)',
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Progress bar */}
            <div className="rounded-xl p-4" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>Progress</span>
                    <span className="text-xs font-bold" style={{ color: 'var(--color-accent)' }}>
                        {tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%
                    </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-shell)' }}>
                    <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                            width: `${tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0}%`,
                            background: 'linear-gradient(90deg, var(--color-accent), #8b5cf6)',
                        }}
                    />
                </div>
            </div>

            {/* Add task */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Add Task</h2>
                <div className="flex flex-col gap-2">
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        <div className="flex-1 min-w-0 relative">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => { setNewTitle(e.target.value); if (taskError) setTaskError(false); }}
                                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                                placeholder="What needs to be done?"
                                className={`w-full px-3 py-2 text-sm rounded-xl outline-none transition-all ${taskError ? 'ring-2 ring-red-500 !border-red-500 bg-red-50' : 'focus:ring-2 focus:ring-[var(--color-accent)]'}`}
                                style={{ background: taskError ? '#fef2f2' : 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                            />
                        </div>
                    <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as Priority)}
                        className="px-2 py-2 text-sm rounded-xl outline-none"
                        style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                    <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Tag"
                        className="w-24 px-3 py-2 text-sm rounded-xl outline-none"
                        style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                    />
                    <div className="relative">
                        <Calendar className="absolute left-2 top-2.5 w-4 h-4 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
                        <input
                            type="date"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.target.value)}
                            className="pl-7 pr-2 py-2 text-sm rounded-xl outline-none w-36"
                            style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                        />
                    </div>
                    <button
                        onClick={addTask}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-90"
                        style={{ background: 'var(--color-accent)', color: '#fff' }}
                    >
                        <Plus className="w-4 h-4" /> Add
                    </button>
                    </div>
                    {taskError && (
                        <p className="text-xs text-red-500 px-1">Task description cannot be empty.</p>
                    )}
                </div>
            </div>

            {/* Task list */}
            <div className="space-y-2">
                {filtered.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckSquare className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-border)' }} />
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                            {filter === 'done' ? 'No completed tasks yet' : 'No tasks — add one above!'}
                        </p>
                    </div>
                ) : (
                    filtered.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={() => toggleTask(task.id)}
                            onDelete={() => deleteTask(task.id)}
                            onUpdate={(updates) => updateTask(task.id, updates)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
