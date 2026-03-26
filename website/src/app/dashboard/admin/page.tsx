'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Shield, LayoutDashboard, Users, CreditCard, Globe, Cpu, Activity,
    Search, ChevronLeft, ChevronRight, MoreVertical, UserX, Pause, Trash2,
    CheckCircle, XCircle, AlertTriangle, LogOut, RefreshCw, TrendingUp,
    ArrowUpRight, ArrowDownRight, DollarSign, Zap, Database, Server
} from 'lucide-react';
import {
    useAdminOverview, useAdminUsers, useAdminSubscriptions, useAdminRegions,
    useAdminTokens, useAdminHealth, useUpdateUser, useDeleteUser,
    AdminUser, PlatformOverview
} from '@/lib/hooks/useAdmin';
import { getAPIClient } from '@/lib/api';

type AdminTab = 'overview' | 'users' | 'subscriptions' | 'regions' | 'tokens' | 'system';

const TABS: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'regions', label: 'Regions', icon: Globe },
    { id: 'tokens', label: 'Tokens & Usage', icon: Cpu },
    { id: 'system', label: 'System Health', icon: Activity },
];

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [isAuthed, setIsAuthed] = useState(false);

    // Check admin auth on mount
    useEffect(() => {
        const token = localStorage.getItem('minime_auth_token');
        if (!token) {
            router.push('/auth/admin');
            return;
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!payload.is_superadmin) {
                router.push('/auth/admin');
                return;
            }
            setIsAuthed(true);
        } catch {
            router.push('/auth/admin');
        }
    }, [router]);

    const handleLogout = () => {
        const api = getAPIClient();
        api.clearAuthToken();
        localStorage.removeItem('minime_refresh_token');
        localStorage.removeItem('minime_is_admin');
        router.push('/auth/admin');
    };

    if (!isAuthed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a1a]">
                <div className="w-10 h-10 rounded-full border-4 border-gray-700 border-t-red-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-[#0a0a1a] text-white">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0d0d1f] border-r border-white/5 flex flex-col">
                {/* Logo */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-white">MiniMe Admin</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Control Panel</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    isActive
                                        ? 'bg-gradient-to-r from-red-500/20 to-orange-500/10 text-red-400 border border-red-500/20'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    <button
                        onClick={() => router.push('/dashboard/overview')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all"
                    >
                        <ArrowUpRight className="w-4 h-4" />
                        User Dashboard
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8 max-w-7xl mx-auto">
                    {activeTab === 'overview' && <OverviewPanel />}
                    {activeTab === 'users' && <UsersPanel />}
                    {activeTab === 'subscriptions' && <SubscriptionsPanel />}
                    {activeTab === 'regions' && <RegionsPanel />}
                    {activeTab === 'tokens' && <TokensPanel />}
                    {activeTab === 'system' && <SystemPanel />}
                </div>
            </main>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Overview Panel
// ═══════════════════════════════════════════════════════════════════════════════

function OverviewPanel() {
    const { data, isLoading } = useAdminOverview();

    if (isLoading || !data) {
        return <LoadingSkeleton title="Platform Overview" />;
    }

    const kpis = [
        { label: 'Total Users', value: data.total_users, icon: Users, color: 'from-blue-500 to-cyan-500', change: null },
        { label: 'Active (7d)', value: data.active_users_7d, icon: Activity, color: 'from-emerald-500 to-green-500', change: null },
        { label: 'Total Activities', value: data.total_activities.toLocaleString(), icon: Zap, color: 'from-purple-500 to-pink-500', change: null },
        { label: 'Total Sessions', value: data.total_sessions.toLocaleString(), icon: Server, color: 'from-orange-500 to-red-500', change: null },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Platform Overview</h2>
                <p className="text-gray-500 text-sm mt-1">Real-time metrics across the MiniMe platform</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={kpi.label} className="bg-[#12122a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold">{kpi.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{kpi.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tier & Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tier Distribution */}
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Tier Distribution</h3>
                    <div className="space-y-3">
                        {Object.entries(data.tier_distribution).map(([tier, count]) => {
                            const pct = Math.round((count / Math.max(data.total_users, 1)) * 100);
                            const colors: Record<string, string> = { free: 'bg-gray-500', premium: 'bg-blue-500', enterprise: 'bg-purple-500' };
                            return (
                                <div key={tier}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-300 capitalize">{tier}</span>
                                        <span className="text-gray-400">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${colors[tier] || 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Signup Trend */}
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Signup Trend (30 days)</h3>
                    {data.signup_trend.length > 0 ? (
                        <div className="flex items-end gap-1 h-40">
                            {data.signup_trend.map((day, i) => {
                                const maxCount = Math.max(...data.signup_trend.map(d => d.count), 1);
                                const heightPct = (day.count / maxCount) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                                            {day.date}: {day.count}
                                        </div>
                                        <div
                                            className="w-full rounded-t bg-gradient-to-t from-blue-600 to-blue-400 hover:from-blue-500 hover:to-blue-300 transition-colors min-h-[2px]"
                                            style={{ height: `${Math.max(2, heightPct)}%` }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-600 text-sm">No signups in the last 30 days</div>
                    )}
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Users Panel
// ═══════════════════════════════════════════════════════════════════════════════

function UsersPanel() {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [tierFilter, setTierFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);

    const { data, isLoading, refetch } = useAdminUsers({
        search: search || undefined,
        tier: tierFilter || undefined,
        status: statusFilter || undefined,
        page,
        page_size: 15,
    });

    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    const handleAction = async (userId: string, action: string) => {
        setActionMenuUser(null);
        try {
            switch (action) {
                case 'pause':
                    await updateUser.mutateAsync({ userId, subscription_status: 'paused' });
                    break;
                case 'suspend':
                    await updateUser.mutateAsync({ userId, subscription_status: 'suspended' });
                    break;
                case 'activate':
                    await updateUser.mutateAsync({ userId, subscription_status: 'active' });
                    break;
                case 'delete':
                    if (confirm('Are you sure you want to delete this user? This action is irreversible.')) {
                        await deleteUser.mutateAsync(userId);
                    }
                    break;
                case 'make_admin':
                    await updateUser.mutateAsync({ userId, is_superadmin: true });
                    break;
                case 'remove_admin':
                    await updateUser.mutateAsync({ userId, is_superadmin: false });
                    break;
                case 'upgrade_premium':
                    await updateUser.mutateAsync({ userId, tier: 'premium' });
                    break;
                case 'upgrade_enterprise':
                    await updateUser.mutateAsync({ userId, tier: 'enterprise' });
                    break;
                case 'downgrade_free':
                    await updateUser.mutateAsync({ userId, tier: 'free' });
                    break;
            }
        } catch (e) {
            console.error('Action failed:', e);
        }
    };

    const statusColors: Record<string, string> = {
        active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        paused: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        suspended: 'bg-red-500/20 text-red-400 border-red-500/30',
        canceled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        deleted: 'bg-red-900/20 text-red-500 border-red-900/30',
    };

    const tierColors: Record<string, string> = {
        free: 'bg-gray-500/20 text-gray-300',
        premium: 'bg-blue-500/20 text-blue-400',
        enterprise: 'bg-purple-500/20 text-purple-400',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">User Management</h2>
                    <p className="text-gray-500 text-sm mt-1">{data?.total || 0} users total</p>
                </div>
                <button onClick={() => refetch()} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search by email or name..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[#12122a] text-white placeholder:text-gray-600 border border-white/10 focus:border-red-500/50 focus:outline-none"
                    />
                </div>
                <select
                    value={tierFilter}
                    onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-xl text-sm bg-[#12122a] text-gray-300 border border-white/10 focus:outline-none"
                >
                    <option value="">All Tiers</option>
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 rounded-xl text-sm bg-[#12122a] text-gray-300 border border-white/10 focus:outline-none"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="suspended">Suspended</option>
                    <option value="canceled">Canceled</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#12122a] border border-white/5 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-500">Loading users...</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</th>
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Activities</th>
                                <th className="text-left px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Joined</th>
                                <th className="text-center px-4 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data?.users?.map((user) => (
                                <tr key={user.id} className="border-b border-white/3 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                {(user.full_name || user.email)?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white">{user.full_name || 'No name'}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                            {user.is_superadmin && (
                                                <span title="Admin"><Shield className="w-3.5 h-3.5 text-red-400" /></span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${tierColors[user.tier] || 'bg-gray-500/20 text-gray-300'}`}>
                                            {user.tier}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium capitalize border ${statusColors[user.subscription_status] || statusColors.active}`}>
                                            {user.subscription_status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-gray-400">{user.activity_count.toLocaleString()}</td>
                                    <td className="px-4 py-4 text-gray-500 text-xs">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '–'}</td>
                                    <td className="px-4 py-4 text-center relative">
                                        <button
                                            onClick={() => setActionMenuUser(actionMenuUser === user.id ? null : user.id)}
                                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-400" />
                                        </button>
                                        {actionMenuUser === user.id && (
                                            <div className="absolute right-6 top-12 z-50 w-52 bg-[#1a1a3a] border border-white/10 rounded-xl shadow-2xl py-1.5 text-left">
                                                <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Account Status</div>
                                                {user.subscription_status !== 'active' && (
                                                    <button onClick={() => handleAction(user.id, 'activate')} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-white/5 text-emerald-400">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Activate
                                                    </button>
                                                )}
                                                {user.subscription_status !== 'paused' && (
                                                    <button onClick={() => handleAction(user.id, 'pause')} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-white/5 text-amber-400">
                                                        <Pause className="w-3.5 h-3.5" /> Pause Account
                                                    </button>
                                                )}
                                                {user.subscription_status !== 'suspended' && (
                                                    <button onClick={() => handleAction(user.id, 'suspend')} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-white/5 text-orange-400">
                                                        <UserX className="w-3.5 h-3.5" /> Suspend
                                                    </button>
                                                )}

                                                <div className="border-t border-white/5 my-1.5" />
                                                <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Tier</div>
                                                {user.tier !== 'premium' && (
                                                    <button onClick={() => handleAction(user.id, 'upgrade_premium')} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-white/5 text-blue-400">
                                                        <TrendingUp className="w-3.5 h-3.5" /> Upgrade to Premium
                                                    </button>
                                                )}
                                                {user.tier !== 'enterprise' && (
                                                    <button onClick={() => handleAction(user.id, 'upgrade_enterprise')} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-white/5 text-purple-400">
                                                        <TrendingUp className="w-3.5 h-3.5" /> Upgrade to Enterprise
                                                    </button>
                                                )}
                                                {user.tier !== 'free' && (
                                                    <button onClick={() => handleAction(user.id, 'downgrade_free')} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-white/5 text-gray-400">
                                                        <ArrowDownRight className="w-3.5 h-3.5" /> Downgrade to Free
                                                    </button>
                                                )}

                                                <div className="border-t border-white/5 my-1.5" />
                                                <div className="px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Admin</div>
                                                {!user.is_superadmin ? (
                                                    <button onClick={() => handleAction(user.id, 'make_admin')} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-white/5 text-red-400">
                                                        <Shield className="w-3.5 h-3.5" /> Make Admin
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleAction(user.id, 'remove_admin')} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-white/5 text-gray-400">
                                                        <Shield className="w-3.5 h-3.5" /> Remove Admin
                                                    </button>
                                                )}

                                                <div className="border-t border-white/5 my-1.5" />
                                                <button onClick={() => handleAction(user.id, 'delete')} className="w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-red-500/10 text-red-500">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete User
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {data && data.total_pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-white/5">
                        <p className="text-xs text-gray-500">
                            Page {data.page} of {data.total_pages} ({data.total} users)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(Math.max(1, page - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                                disabled={page >= data.total_pages}
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Subscriptions Panel
// ═══════════════════════════════════════════════════════════════════════════════

function SubscriptionsPanel() {
    const { data, isLoading } = useAdminSubscriptions();

    if (isLoading || !data) return <LoadingSkeleton title="Subscriptions" />;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Subscriptions</h2>
                <p className="text-gray-500 text-sm mt-1">Revenue and subscription analytics</p>
            </div>

            {/* Revenue KPI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold">${data.mrr_estimate.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Estimated MRR</p>
                </div>
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{Object.values(data.tier_distribution).reduce((a, b) => a + b, 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Subscribers</p>
                </div>
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                            <UserX className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold">{data.churned_users}</p>
                    <p className="text-xs text-gray-500 mt-1">Churned Users</p>
                </div>
            </div>

            {/* Tier Breakdown */}
            <div className="bg-[#12122a] border border-white/5 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-gray-300 mb-4">Pricing Tiers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(data.pricing_tiers).map(([tier, price]) => {
                        const count = data.tier_distribution[tier] || 0;
                        return (
                            <div key={tier} className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                                <p className="text-sm font-semibold capitalize text-white">{tier}</p>
                                <p className="text-2xl font-bold mt-1">{count} <span className="text-sm text-gray-500 font-normal">users</span></p>
                                <p className="text-xs text-gray-500 mt-1">${price}/mo per user</p>
                                <p className="text-xs text-emerald-400 mt-1 font-medium">${(price * count).toFixed(2)}/mo revenue</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Regions Panel
// ═══════════════════════════════════════════════════════════════════════════════

function RegionsPanel() {
    const { data, isLoading } = useAdminRegions();

    if (isLoading || !data) return <LoadingSkeleton title="Regions" />;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Regions & Clients</h2>
                <p className="text-gray-500 text-sm mt-1">User distribution by location and browser</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Browser Distribution */}
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Browser Distribution</h3>
                    <div className="space-y-3">
                        {Object.entries(data.browser_distribution).map(([browser, count]) => {
                            const total = Object.values(data.browser_distribution).reduce((a, b) => a + b, 0);
                            const pct = Math.round((count / Math.max(total, 1)) * 100);
                            const colors: Record<string, string> = {
                                Chrome: 'bg-blue-500', Firefox: 'bg-orange-500', Safari: 'bg-cyan-500', Edge: 'bg-green-500', Other: 'bg-gray-500',
                            };
                            return (
                                <div key={browser}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-300">{browser}</span>
                                        <span className="text-gray-500">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${colors[browser] || 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                        {Object.keys(data.browser_distribution).length === 0 && (
                            <p className="text-gray-600 text-sm">No browser data yet</p>
                        )}
                    </div>
                </div>

                {/* IP Distribution */}
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Session Origins (by IP)</h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {data.ip_distribution.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/3">
                                <span className="text-gray-400 font-mono text-xs">{item.ip}</span>
                                <span className="text-gray-500">{item.user_count} user{item.user_count !== 1 ? 's' : ''}</span>
                            </div>
                        ))}
                        {data.ip_distribution.length === 0 && (
                            <p className="text-gray-600 text-sm">No session IP data yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Tokens Panel
// ═══════════════════════════════════════════════════════════════════════════════

function TokensPanel() {
    const { data, isLoading } = useAdminTokens();

    if (isLoading || !data) return <LoadingSkeleton title="Token Usage" />;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold">Tokens & Usage</h2>
                <p className="text-gray-500 text-sm mt-1">AI processing and data ingestion metrics</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-5">
                    <p className="text-2xl font-bold">{data.estimated_tokens.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Estimated Tokens Used</p>
                </div>
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-5">
                    <p className="text-2xl font-bold">{data.total_content_items.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Content Items Ingested</p>
                </div>
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-5">
                    <p className="text-2xl font-bold">{data.total_activities.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Activities Processed</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Activity by User */}
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Users by Activity</h3>
                    <div className="space-y-2">
                        {data.activity_by_user.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/3">
                                <span className="text-gray-300 truncate max-w-[200px]">{item.email}</span>
                                <span className="text-gray-500 font-mono">{item.activity_count.toLocaleString()}</span>
                            </div>
                        ))}
                        {data.activity_by_user.length === 0 && <p className="text-gray-600 text-sm">No data</p>}
                    </div>
                </div>

                {/* Content by User */}
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Top Users by Content</h3>
                    <div className="space-y-2">
                        {data.content_by_user.map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-white/3">
                                <span className="text-gray-300 truncate max-w-[200px]">{item.email}</span>
                                <span className="text-gray-500 font-mono">{item.content_count.toLocaleString()}</span>
                            </div>
                        ))}
                        {data.content_by_user.length === 0 && <p className="text-gray-600 text-sm">No data</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// System Health Panel
// ═══════════════════════════════════════════════════════════════════════════════

function SystemPanel() {
    const { data, isLoading, refetch } = useAdminHealth();

    if (isLoading || !data) return <LoadingSkeleton title="System Health" />;

    const serviceNames: Record<string, { label: string; icon: any }> = {
        postgres: { label: 'PostgreSQL', icon: Database },
        redis: { label: 'Redis', icon: Server },
        neo4j: { label: 'Neo4j Graph', icon: Globe },
        qdrant: { label: 'Qdrant Vector', icon: Cpu },
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">System Health</h2>
                    <p className="text-gray-500 text-sm mt-1">Last checked: {new Date(data.timestamp).toLocaleTimeString()}</p>
                </div>
                <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-colors">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(data.services).filter(([k]) => k !== 'db_stats').map(([key, service]) => {
                    const meta = serviceNames[key] || { label: key, icon: Server };
                    const Icon = meta.icon;
                    const isHealthy = service.status === 'healthy';
                    const isUnavailable = service.status === 'unavailable';

                    return (
                        <div key={key} className={`bg-[#12122a] border rounded-2xl p-6 transition-colors ${
                            isHealthy ? 'border-emerald-500/20' : isUnavailable ? 'border-amber-500/20' : 'border-red-500/20'
                        }`}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        isHealthy ? 'bg-emerald-500/20' : isUnavailable ? 'bg-amber-500/20' : 'bg-red-500/20'
                                    }`}>
                                        <Icon className={`w-5 h-5 ${isHealthy ? 'text-emerald-400' : isUnavailable ? 'text-amber-400' : 'text-red-400'}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{meta.label}</p>
                                        <p className="text-xs text-gray-500 capitalize">{key}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                                    isHealthy ? 'bg-emerald-500/10 text-emerald-400' : isUnavailable ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                    {isHealthy ? <CheckCircle className="w-3 h-3" /> : isUnavailable ? <AlertTriangle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                    {service.status}
                                </div>
                            </div>
                            {service.error && (
                                <p className="text-xs text-red-400/80 bg-red-500/5 rounded-lg p-3 font-mono break-all">{service.error}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* DB Stats */}
            {data.services.db_stats && (
                <div className="bg-[#12122a] border border-white/5 rounded-2xl p-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-4">Database Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-2xl font-bold">{(data.services.db_stats as any).users?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Total Users</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{(data.services.db_stats as any).activities?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500 mt-1">Total Activities</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingSkeleton({ title }: { title: string }) {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-[#12122a] border border-white/5 rounded-2xl p-5 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-white/5 mb-3" />
                        <div className="h-6 bg-white/5 rounded w-20 mb-2" />
                        <div className="h-3 bg-white/5 rounded w-32" />
                    </div>
                ))}
            </div>
        </div>
    );
}
