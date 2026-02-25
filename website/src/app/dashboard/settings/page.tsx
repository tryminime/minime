'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
    User, Shield, Bell, Plug, Database, Sparkles,
    Save, ToggleLeft, ToggleRight,
    Download, Trash2, Clock, Globe,
    Cpu, Zap, BookOpen, CheckCircle, Loader2, Eye, EyeOff, ChevronRight,
    ExternalLink, AlertCircle, CreditCard, Crown, TrendingUp, Mail, Camera,
    Settings2, KeyRound, LogOut, Activity, Monitor,

} from 'lucide-react';
import { useModelInfo, useAvailableModels, useSetModel } from '@/lib/hooks/useAIChat';
import { getAPIClient } from '@/lib/api';
import {
    useAllIntegrationStatuses,
    useConnectIntegration,
    useDisconnectIntegration,
    IntegrationProvider,
} from '@/lib/hooks/useIntegrations';
import { useAuth } from '@/lib/hooks/useAuth';
import { useSubscription, useUsageMetrics, useCreateCheckout, useCancelSubscription } from '@/lib/hooks/useBilling';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Tab = 'profile' | 'subscription' | 'privacy' | 'notifications' | 'integrations' | 'data' | 'ai' | 'desktop';


// ── Toggle ────────────────────────────────────────────────────────────────────

interface ToggleProps {
    enabled: boolean;
    onToggle: () => void;
    label: string;
    description?: string;
}

function Toggle({ enabled, onToggle, label, description }: ToggleProps) {
    return (
        <div
            className="flex items-center justify-between py-3 px-4 rounded-xl transition-colors"
            style={{ background: enabled ? 'rgba(99,102,241,0.06)' : 'transparent' }}
        >
            <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{label}</p>
                {description && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{description}</p>
                )}
            </div>
            <button onClick={onToggle} className="focus:outline-none">
                {enabled ? (
                    <ToggleRight className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
                ) : (
                    <ToggleLeft className="w-8 h-8" style={{ color: 'var(--color-border)' }} />
                )}
            </button>
        </div>
    );
}

// ── Integration Card ──────────────────────────────────────────────────────────

interface IntegrationCardProps {
    name: string;
    desc: string;
    provider: IntegrationProvider;
}

function IntegrationCard({ name, desc, provider }: IntegrationCardProps) {
    const { data: status, isLoading } = (() => {
        const all = useAllIntegrationStatuses();
        return all[provider === 'google' ? 'google' : provider];
    })();
    const connect = useConnectIntegration();
    const disconnect = useDisconnectIntegration();

    const isConnected = status?.connected ?? false;
    const isBusy = connect.isPending || disconnect.isPending || isLoading;

    return (
        <div
            className="flex items-center justify-between p-4 rounded-xl transition-all"
            style={{ background: 'var(--color-shell)', border: `1px solid ${isConnected ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}` }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{
                        background: isConnected ? 'rgba(99,102,241,0.1)' : 'var(--color-border)',
                        color: isConnected ? 'var(--color-accent)' : 'var(--color-muted)',
                    }}
                >
                    {name[0]}
                </div>
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {isConnected && status?.username
                            ? `Connected as ${status.username}`
                            : desc}
                    </p>
                </div>
            </div>
            <button
                onClick={() => {
                    if (isConnected) {
                        disconnect.mutate(provider);
                    } else {
                        connect.mutate(provider);
                    }
                }}
                disabled={isBusy}
                className="px-4 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50 flex items-center gap-1"
                style={{
                    background: isConnected ? 'var(--color-danger)' : 'var(--color-accent)',
                    color: '#fff',
                }}
            >
                {isBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {isConnected ? 'Disconnect' : (
                    <><ExternalLink className="w-3 h-3" /> Connect</>
                )}
            </button>
        </div>
    );
}

function ComingSoonCard({ name, desc }: { name: string; desc: string }) {
    return (
        <div
            className="flex items-center justify-between p-4 rounded-xl opacity-60"
            style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
        >
            <div className="flex items-center gap-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--color-border)', color: 'var(--color-muted)' }}
                >
                    {name[0]}
                </div>
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{name}</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{desc}</p>
                </div>
            </div>
            <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ background: 'var(--color-border)', color: 'var(--color-muted)' }}>
                Coming Soon
            </span>
        </div>
    );
}

// ── Usage Bar ─────────────────────────────────────────────────────────────────

function UsageBar({ label, current, limit, color }: { label: string; current: number; limit: number; color: string }) {
    const isUnlimited = limit === -1;
    const pct = isUnlimited ? 0 : Math.min(100, (current / limit) * 100);

    return (
        <div>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium" style={{ color: 'var(--color-secondary)' }}>{label}</span>
                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    {current.toLocaleString()} / {isUnlimited ? '∞' : limit.toLocaleString()}
                </span>
            </div>
            <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--color-border)' }}>
                <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: isUnlimited ? '100%' : `${pct}%`, background: color, opacity: isUnlimited ? 0.3 : 1 }}
                />
            </div>
        </div>
    );
}

// ── Profile Hero Card ─────────────────────────────────────────────────────────

function ProfileHero({
    profile,
    planType,
    onEdit,
}: {
    profile: { name: string; email: string; bio: string };
    planType: string;
    onEdit: () => void;
}) {
    const initials = profile.name
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    const planColors: Record<string, { bg: string; text: string; label: string }> = {
        free: { bg: 'rgba(107,114,128,0.1)', text: '#6b7280', label: 'Free' },
        pro: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1', label: 'Pro' },
        enterprise: { bg: 'rgba(168,85,247,0.1)', text: '#a855f7', label: 'Enterprise' },
    };
    const plan = planColors[planType] || planColors.free;

    return (
        <div
            className="relative rounded-2xl overflow-hidden"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
            {/* Gradient header band */}
            <div
                className="h-24"
                style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #a78bfa 100%)',
                }}
            />

            <div className="px-6 pb-6">
                {/* Avatar + name row */}
                <div className="flex items-end gap-4 -mt-10">
                    <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg border-4"
                        style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff',
                            borderColor: 'var(--color-surface)',
                        }}
                    >
                        {initials}
                    </div>
                    <div className="flex-1 pb-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                                {profile.name || 'User'}
                            </h2>
                            <span
                                className="px-2.5 py-0.5 text-xs font-semibold rounded-full flex items-center gap-1"
                                style={{ background: plan.bg, color: plan.text }}
                            >
                                <Crown className="w-3 h-3" />
                                {plan.label}
                            </span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>{profile.email}</p>
                    </div>
                    <button
                        onClick={onEdit}
                        className="px-4 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-80"
                        style={{ background: 'var(--color-accent)', color: '#fff' }}
                    >
                        Edit Profile
                    </button>
                </div>

                {/* Bio */}
                {profile.bio && (
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
                        {profile.bio}
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Main Settings Page ────────────────────────────────────────────────────────

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const api = getAPIClient();
    const { user } = useAuth();

    // Billing data
    const { data: subscription } = useSubscription();
    const { data: usage } = useUsageMetrics();
    const planType = subscription?.plan_type || 'free';

    // ── Profile local state ──────────────────────────────────────────────────
    const [profile, setProfile] = useState({
        name: user?.full_name ?? '',
        email: user?.email ?? '',
        bio: '',
        timezone: 'America/New_York',
    });

    // Fetch bio from profile endpoint
    const { data: profileData } = useQuery({
        queryKey: ['user', 'profile'],
        queryFn: () => api.get<{ full_name: string; email: string; bio?: string; timezone?: string }>('/api/v1/users/me/profile'),
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (profileData) {
            setProfile(prev => ({
                ...prev,
                name: profileData.full_name || prev.name,
                email: profileData.email || prev.email,
                bio: profileData.bio || '',
                timezone: profileData.timezone || prev.timezone,
            }));
        }
    }, [profileData]);

    // ── Privacy: load from backend ────────────────────────────────────────────
    const { data: privacyData } = useQuery({
        queryKey: ['user', 'privacy'],
        queryFn: () => api.get<{ privacy_settings: Record<string, unknown> }>('/api/v1/users/me/privacy'),
        staleTime: 5 * 60 * 1000,
    });

    const [privacy, setPrivacy] = useState({
        localProcessing: true,
        dataEncryption: true,
        piiFiltering: true,
        analyticsSharing: false,
        retentionDays: 90,
    });

    useEffect(() => {
        if (privacyData?.privacy_settings) {
            const ps = privacyData.privacy_settings as Record<string, unknown>;
            setPrivacy(prev => ({
                localProcessing: (ps.local_processing as boolean) ?? prev.localProcessing,
                dataEncryption: (ps.data_encryption as boolean) ?? prev.dataEncryption,
                piiFiltering: (ps.pii_filtering as boolean) ?? prev.piiFiltering,
                analyticsSharing: (ps.analytics_sharing as boolean) ?? prev.analyticsSharing,
                retentionDays: (ps.retention_days as number) ?? prev.retentionDays,
            }));
        }
    }, [privacyData]);

    // ── Notifications: load from preferences ──────────────────────────────────
    const { data: prefsData } = useQuery({
        queryKey: ['user', 'preferences'],
        queryFn: () => api.get<{ preferences: Record<string, unknown> }>('/api/v1/users/me/preferences'),
        staleTime: 5 * 60 * 1000,
    });

    const [notifs, setNotifs] = useState({
        emailNotifications: true,
        desktopNotifications: true,
        weeklyDigest: true,
        productivityAlerts: true,
        dndEnabled: false,
    });

    useEffect(() => {
        if (prefsData?.preferences) {
            const p = prefsData.preferences;
            setNotifs(prev => ({
                emailNotifications: (p.email_notifications as boolean) ?? prev.emailNotifications,
                desktopNotifications: (p.desktop_notifications as boolean) ?? prev.desktopNotifications,
                weeklyDigest: (p.weekly_digest as boolean) ?? prev.weeklyDigest,
                productivityAlerts: (p.productivity_alerts as boolean) ?? prev.productivityAlerts,
                dndEnabled: (p.dnd_enabled as boolean) ?? prev.dndEnabled,
            }));
        }
    }, [prefsData]);

    // ── Auto-backup local state ───────────────────────────────────────────────
    const [autoBackup, setAutoBackup] = useState(true);

    // ── Desktop: detect Tauri + manage autostart ──────────────────────────
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    const [autostartEnabled, setAutostartEnabled] = useState(false);
    const [autostartLoading, setAutostartLoading] = useState(false);

    useEffect(() => {
        if (!isTauri) return;
        (async () => {
            try {
                // Use Tauri's global bridge — no npm package needed
                const invoke = (window as any).__TAURI_INTERNALS__.invoke;
                const enabled = await invoke('get_autostart') as boolean;
                setAutostartEnabled(enabled);
            } catch { /* running in browser */ }
        })();
    }, [isTauri]);

    const handleAutostartToggle = async () => {
        if (!isTauri) return;
        setAutostartLoading(true);
        try {
            const invoke = (window as any).__TAURI_INTERNALS__.invoke;
            const newState = await invoke('set_autostart', { enabled: !autostartEnabled }) as boolean;
            setAutostartEnabled(newState);
            toast.success(newState ? 'MiniMe will launch at login' : 'Auto-launch on login disabled');
        } catch {
            toast.error('Failed to update auto-launch setting');
        }
        setAutostartLoading(false);
    };


    // ── Modal states ──────────────────────────────────────────────────────────
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
    const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [exporting, setExporting] = useState(false);
    const router = useRouter();
    const createCheckout = useCreateCheckout();
    const cancelSub = useCancelSubscription();

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
        if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        try {
            await api.post('/api/v1/users/me/change-password', { current_password: currentPassword, new_password: newPassword });
            toast.success('Password changed successfully');
            setShowPasswordModal(false);
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (e: any) { toast.error(e?.message || 'Failed to change password'); }
    };

    const handleExportData = async () => {
        setExporting(true);
        try {
            const data = await api.get('/api/v1/users/me/export-data');
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'minime_export.json'; a.click();
            URL.revokeObjectURL(url);
            toast.success('Data exported successfully');
        } catch { toast.error('Export failed'); }
        setExporting(false);
    };

    const handleDeleteData = async () => {
        try {
            const res = await api.delete<{ deleted_count: number }>('/api/v1/users/me/data');
            toast.success(`Deleted ${res.deleted_count} activities`);
            setShowDeleteDataModal(false); setDeleteConfirmText('');
        } catch { toast.error('Failed to delete data'); }
    };

    const handleDeleteAccount = async () => {
        try {
            await api.delete('/api/v1/users/me/account');
            toast.success('Account deleted');
            setShowDeleteAccountModal(false);
            router.push('/auth/login');
        } catch { toast.error('Failed to delete account'); }
    };

    const handleUpgrade = (plan: string) => {
        createCheckout.mutate({
            plan_type: plan,
            success_url: `${window.location.origin}/dashboard/billing?success=true`,
            cancel_url: `${window.location.origin}/dashboard/settings`,
        });
    };

    // ── Save mutations ────────────────────────────────────────────────────────
    const saveProfile = useMutation({
        mutationFn: () => api.put('/api/v1/users/me/profile', {
            full_name: profile.name,
            bio: profile.bio,
            timezone: profile.timezone,
        }),
    });

    const savePrivacy = useMutation({
        mutationFn: () => api.put('/api/v1/users/me/privacy', {
            privacy_settings: {
                local_processing: privacy.localProcessing,
                data_encryption: privacy.dataEncryption,
                pii_filtering: privacy.piiFiltering,
                analytics_sharing: privacy.analyticsSharing,
                retention_days: privacy.retentionDays,
            },
        }),
    });

    const saveNotifications = useMutation({
        mutationFn: () => api.put('/api/v1/users/me/preferences', {
            preferences: {
                email_notifications: notifs.emailNotifications,
                desktop_notifications: notifs.desktopNotifications,
                weekly_digest: notifs.weeklyDigest,
                productivity_alerts: notifs.productivityAlerts,
                dnd_enabled: notifs.dndEnabled,
            },
        }),
    });

    const handleSave = async () => {
        setSaveError(null);
        try {
            if (activeTab === 'profile') await saveProfile.mutateAsync();
            if (activeTab === 'privacy') await savePrivacy.mutateAsync();
            if (activeTab === 'notifications') await saveNotifications.mutateAsync();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch {
            setSaveError('Failed to save. Please try again.');
        }
    };

    // ── Tab definitions ───────────────────────────────────────────────────────
    const tabs = [
        { id: 'profile' as Tab, label: 'Profile', icon: User },
        { id: 'subscription' as Tab, label: 'Subscription', icon: CreditCard },
        { id: 'privacy' as Tab, label: 'Privacy', icon: Shield },
        { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
        { id: 'integrations' as Tab, label: 'Integrations', icon: Plug },
        { id: 'data' as Tab, label: 'Data & Backup', icon: Database },
        { id: 'ai' as Tab, label: 'AI & LLM', icon: Sparkles },
        { id: 'desktop' as Tab, label: 'Desktop App', icon: Monitor },
    ];


    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* ── Profile Hero ─────────────────────────────────────────── */}
            <ProfileHero
                profile={{ name: profile.name, email: profile.email, bio: profile.bio }}
                planType={planType}
                onEdit={() => setActiveTab('profile')}
            />

            {/* ── Quick Stats Row ──────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Plan', value: planType === 'pro' ? 'Pro' : planType === 'enterprise' ? 'Enterprise' : 'Free', icon: Crown, color: '#6366f1' },
                    { label: 'Activities', value: usage?.usage?.activities_count?.toLocaleString() || '0', icon: Activity, color: '#3b82f6' },
                    { label: 'Graph Nodes', value: usage?.usage?.graph_nodes_count?.toLocaleString() || '0', icon: TrendingUp, color: '#8b5cf6' },
                    { label: 'Status', value: subscription?.status === 'active' ? 'Active' : 'Inactive', icon: CheckCircle, color: '#10b981' },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-xl p-4 transition-all hover:scale-[1.01]"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                            <span className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>{stat.label}</span>
                        </div>
                        <p className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* ── Tabs + Content ────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Tab navigation */}
                <div
                    className="lg:w-56 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible p-1 rounded-xl"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className="ds-nav-item flex-shrink-0"
                                style={{
                                    background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                                    color: isActive ? 'var(--color-accent)' : 'var(--color-secondary)',
                                    fontWeight: isActive ? 600 : 400,
                                }}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm whitespace-nowrap">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Content panel */}
                <div
                    className="flex-1 rounded-xl p-6"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                >
                    {/* ── Profile ─────────────────────────────────────────── */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Profile Settings</h3>
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Update your personal information and preferences</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-secondary)' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={profile.name}
                                        onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all"
                                        style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-secondary)' }}>Email</label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full px-4 py-2.5 text-sm rounded-xl outline-none opacity-60 cursor-not-allowed"
                                        style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                                    />
                                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-secondary)' }}>Bio</label>
                                    <textarea
                                        value={profile.bio}
                                        onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
                                        rows={3}
                                        placeholder="Tell us about yourself and your work..."
                                        className="w-full px-4 py-2.5 text-sm rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-accent)] transition-all resize-none"
                                        style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-secondary)' }}>
                                        <Globe className="w-4 h-4 inline mr-1" />Timezone
                                    </label>
                                    <select
                                        value={profile.timezone}
                                        onChange={(e) => setProfile(p => ({ ...p, timezone: e.target.value }))}
                                        className="w-full px-4 py-2.5 text-sm rounded-xl outline-none transition-all"
                                        style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                                    >
                                        <option>America/New_York</option>
                                        <option>America/Chicago</option>
                                        <option>America/Denver</option>
                                        <option>America/Los_Angeles</option>
                                        <option>Europe/London</option>
                                        <option>Europe/Berlin</option>
                                        <option>Europe/Paris</option>
                                        <option>Asia/Tokyo</option>
                                        <option>Asia/Shanghai</option>
                                        <option>Asia/Dubai</option>
                                        <option>Asia/Kolkata</option>
                                        <option>Australia/Sydney</option>
                                        <option>Pacific/Auckland</option>
                                    </select>
                                </div>
                            </div>

                            {/* Account Actions */}
                            <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>Account</h4>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setShowPasswordModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-80"
                                        style={{ background: 'var(--color-shell)', color: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}
                                    >
                                        <KeyRound className="w-3.5 h-3.5" /> Change Password
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteAccountModal(true)}
                                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-80"
                                        style={{ background: 'rgba(239,68,68,0.06)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.15)' }}
                                    >
                                        <LogOut className="w-3.5 h-3.5" /> Delete Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Subscription ────────────────────────────────────── */}
                    {activeTab === 'subscription' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Subscription & Billing</h3>
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Manage your plan, usage, and billing details</p>
                            </div>

                            {/* Current Plan Card */}
                            <div
                                className="rounded-xl p-5"
                                style={{
                                    background: planType === 'pro'
                                        ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))'
                                        : planType === 'enterprise'
                                            ? 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(217,70,239,0.08))'
                                            : 'var(--color-shell)',
                                    border: `1px solid ${planType !== 'free' ? 'rgba(99,102,241,0.2)' : 'var(--color-border)'}`,
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{ background: 'rgba(99,102,241,0.1)' }}
                                        >
                                            <Crown className="w-6 h-6" style={{ color: '#6366f1' }} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg" style={{ color: 'var(--color-primary)' }}>
                                                {planType === 'pro' ? 'Pro Plan' : planType === 'enterprise' ? 'Enterprise Plan' : 'Free Plan'}
                                            </h4>
                                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                                {planType === 'pro' ? '$19/month' : planType === 'enterprise' ? '$99/month' : '$0/month'}
                                                {' · '}
                                                {subscription?.status === 'active' ? '✓ Active' : 'Inactive'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <a
                                            href="/dashboard/billing"
                                            className="px-4 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-80"
                                            style={{ background: 'var(--color-accent)', color: '#fff' }}
                                        >
                                            Manage Plan →
                                        </a>
                                        {planType === 'free' && (
                                            <button
                                                onClick={() => handleUpgrade('pro')}
                                                disabled={createCheckout.isPending}
                                                className="px-4 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-80 flex items-center gap-1"
                                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
                                            >
                                                {createCheckout.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
                                                Upgrade to Pro
                                            </button>
                                        )}
                                        {planType !== 'free' && (
                                            <button
                                                onClick={() => cancelSub.mutate(true)}
                                                disabled={cancelSub.isPending}
                                                className="px-4 py-2 text-xs font-medium rounded-xl transition-all hover:opacity-80"
                                                style={{ background: 'rgba(239,68,68,0.06)', color: 'var(--color-danger)', border: '1px solid rgba(239,68,68,0.15)' }}
                                            >
                                                {cancelSub.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cancel'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Usage Bars */}
                                {usage && (
                                    <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
                                        <UsageBar
                                            label="Activities"
                                            current={usage.usage.activities_count}
                                            limit={usage.limits.activities_per_month}
                                            color="#6366f1"
                                        />
                                        <UsageBar
                                            label="Graph Nodes"
                                            current={usage.usage.graph_nodes_count}
                                            limit={usage.limits.graph_nodes}
                                            color="#8b5cf6"
                                        />
                                        <UsageBar
                                            label="API Calls"
                                            current={usage.usage.api_calls_count}
                                            limit={usage.limits.api_calls_per_day}
                                            color="#3b82f6"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <a
                                    href="/dashboard/billing"
                                    className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]"
                                    style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                                >
                                    <CreditCard className="w-5 h-5" style={{ color: '#6366f1' }} />
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Billing & Invoices</p>
                                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>View invoices and payment history</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 ml-auto" style={{ color: 'var(--color-muted)' }} />
                                </a>
                                <a
                                    href="/dashboard/billing#pricing"
                                    className="flex items-center gap-3 p-4 rounded-xl transition-all hover:scale-[1.01]"
                                    style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                                >
                                    <TrendingUp className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Compare Plans</p>
                                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>View pricing and upgrade options</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 ml-auto" style={{ color: 'var(--color-muted)' }} />
                                </a>
                            </div>
                        </div>
                    )}

                    {/* ── Privacy ────────────────────────────────────────── */}
                    {activeTab === 'privacy' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Privacy & Security</h3>
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Control how your data is processed and stored. Changes are saved to your account.</p>
                            </div>
                            <div className="space-y-1">
                                <Toggle enabled={privacy.localProcessing} onToggle={() => setPrivacy(p => ({ ...p, localProcessing: !p.localProcessing }))} label="Local Processing Only" description="Process all data on your device — nothing leaves your machine" />
                                <Toggle enabled={privacy.dataEncryption} onToggle={() => setPrivacy(p => ({ ...p, dataEncryption: !p.dataEncryption }))} label="End-to-End Encryption" description="Encrypt stored data with AES-256" />
                                <Toggle enabled={privacy.piiFiltering} onToggle={() => setPrivacy(p => ({ ...p, piiFiltering: !p.piiFiltering }))} label="PII Auto-Filtering" description="Automatically detect and redact personal information" />
                                <Toggle enabled={privacy.analyticsSharing} onToggle={() => setPrivacy(p => ({ ...p, analyticsSharing: !p.analyticsSharing }))} label="Anonymous Analytics" description="Share anonymized usage data to help improve MiniMe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-secondary)' }}>
                                    <Clock className="w-4 h-4 inline mr-1" />Data Retention (days)
                                </label>
                                <input
                                    type="number" value={privacy.retentionDays}
                                    onChange={(e) => setPrivacy(p => ({ ...p, retentionDays: parseInt(e.target.value) || 30 }))}
                                    min={7} max={365}
                                    className="w-32 px-4 py-2.5 text-sm rounded-xl outline-none transition-all"
                                    style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* ── Notifications ────────────────────────────────────── */}
                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Notifications</h3>
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Choose what updates you receive. Changes are saved to your account.</p>
                            </div>
                            <div className="space-y-1">
                                <Toggle enabled={notifs.emailNotifications} onToggle={() => setNotifs(n => ({ ...n, emailNotifications: !n.emailNotifications }))} label="Email Notifications" description="Receive updates via email" />
                                <Toggle enabled={notifs.desktopNotifications} onToggle={() => setNotifs(n => ({ ...n, desktopNotifications: !n.desktopNotifications }))} label="Desktop Notifications" description="Show system notifications for important events" />
                                <Toggle enabled={notifs.weeklyDigest} onToggle={() => setNotifs(n => ({ ...n, weeklyDigest: !n.weeklyDigest }))} label="Weekly Digest" description="Receive a weekly summary of your activity" />
                                <Toggle enabled={notifs.productivityAlerts} onToggle={() => setNotifs(n => ({ ...n, productivityAlerts: !n.productivityAlerts }))} label="Productivity Alerts" description="Get notified when unusual patterns are detected" />
                                <Toggle enabled={notifs.dndEnabled} onToggle={() => setNotifs(n => ({ ...n, dndEnabled: !n.dndEnabled }))} label="Do Not Disturb" description="Mute all notifications during focus sessions" />
                            </div>
                        </div>
                    )}

                    {/* ── Integrations ─────────────────────────────────────── */}
                    {activeTab === 'integrations' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Integrations</h3>
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Connect your tools. OAuth credentials must be configured for connections.</p>
                            </div>
                            <div className="space-y-3">
                                <IntegrationCard provider="github" name="GitHub" desc="Track commits, PRs, and code reviews" />
                                <IntegrationCard provider="google" name="Google Calendar" desc="Sync meetings and events" />
                                <IntegrationCard provider="notion" name="Notion" desc="Connect documentation and notes" />
                                <ComingSoonCard name="Slack" desc="Monitor communication patterns" />
                                <ComingSoonCard name="Jira" desc="Track project tasks and sprints" />
                            </div>
                        </div>
                    )}

                    {/* ── Data & Backup ────────────────────────────────────── */}
                    {activeTab === 'data' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Data & Backup</h3>
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Export, backup, or delete your data</p>
                            </div>
                            <Toggle enabled={autoBackup} onToggle={() => setAutoBackup(v => !v)} label="Automatic Backups" description="Daily encrypted backups of your activity data" />
                            <div className="space-y-3">
                                <button
                                    onClick={handleExportData}
                                    disabled={exporting}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors hover:opacity-80"
                                    style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        {exporting ? <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--color-accent)' }} /> : <Download className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />}
                                        <div className="text-left">
                                            <p className="text-sm font-medium">{exporting ? 'Exporting...' : 'Export All Data'}</p>
                                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Download a GDPR-compliant export of all your data</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4" style={{ color: 'var(--color-muted)' }} />
                                </button>
                                <button
                                    onClick={() => setShowDeleteDataModal(true)}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors hover:opacity-80"
                                    style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--color-danger)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <Trash2 className="w-5 h-5" />
                                        <div className="text-left">
                                            <p className="text-sm font-medium">Delete All Data</p>
                                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Permanently delete all your activity data</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── AI & LLM ─────────────────────────────────────────── */}
                    {activeTab === 'ai' && <AISettingsTab />}

                    {/* ── Desktop App ──────────────────────────────────────── */}
                    {activeTab === 'desktop' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Desktop App</h3>
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Settings for the native MiniMe desktop application.</p>
                            </div>
                            {!isTauri ? (
                                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}>
                                    <Monitor className="w-5 h-5" style={{ color: 'var(--color-muted)' }} />
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Not running in the desktop app</p>
                                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>These settings are only available in the MiniMe desktop app.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between py-3 px-4 rounded-xl" style={{ background: autostartEnabled ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Launch at Login</p>
                                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Start MiniMe automatically when you log in — runs silently in the system tray</p>
                                        </div>
                                        <button onClick={handleAutostartToggle} disabled={autostartLoading} className="focus:outline-none disabled:opacity-50">
                                            {autostartLoading
                                                ? <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-accent)' }} />
                                                : autostartEnabled
                                                    ? <ToggleRight className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
                                                    : <ToggleLeft className="w-8 h-8" style={{ color: 'var(--color-border)' }} />
                                            }
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Save button ───────────────────────────────────────── */}
                    {(activeTab === 'profile' || activeTab === 'privacy' || activeTab === 'notifications') && (
                        <div className="mt-8 flex items-center justify-end gap-3">
                            {saveError && (
                                <span className="flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="w-3.5 h-3.5" />{saveError}
                                </span>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saveProfile.isPending || savePrivacy.isPending || saveNotifications.isPending}
                                className="ds-btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60"
                                style={{
                                    background: saved ? 'var(--color-success)' : 'var(--color-accent)',
                                }}
                            >
                                {(saveProfile.isPending || savePrivacy.isPending || saveNotifications.isPending)
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Save className="w-4 h-4" />}
                                {saved ? 'Saved!' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Change Password Modal ────────────────────────────── */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Change Password</h3>
                        <div className="space-y-3">
                            <input type="password" placeholder="Current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-xl outline-none" style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }} />
                            <input type="password" placeholder="New password (min 8 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-xl outline-none" style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }} />
                            <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-2.5 text-sm rounded-xl outline-none" style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }} />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                                className="px-4 py-2 text-sm rounded-xl" style={{ color: 'var(--color-secondary)' }}>Cancel</button>
                            <button onClick={handleChangePassword}
                                className="px-4 py-2 text-sm font-medium rounded-xl" style={{ background: 'var(--color-accent)', color: '#fff' }}>Change Password</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Data Modal ────────────────────────────────── */}
            {showDeleteDataModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-danger)' }}>Delete All Data</h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>This will permanently delete all your activity data. Your account will remain active. Type <strong>DELETE</strong> to confirm.</p>
                        <input type="text" placeholder='Type "DELETE" to confirm' value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm rounded-xl outline-none" style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid rgba(239,68,68,0.3)' }} />
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setShowDeleteDataModal(false); setDeleteConfirmText(''); }}
                                className="px-4 py-2 text-sm rounded-xl" style={{ color: 'var(--color-secondary)' }}>Cancel</button>
                            <button onClick={handleDeleteData} disabled={deleteConfirmText !== 'DELETE'}
                                className="px-4 py-2 text-sm font-medium rounded-xl disabled:opacity-40" style={{ background: 'var(--color-danger)', color: '#fff' }}>Delete All Data</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Account Modal ─────────────────────────────── */}
            {showDeleteAccountModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-danger)' }}>Delete Account</h3>
                        <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>This will permanently delete your account and all associated data. This action cannot be undone. Type <strong>DELETE MY ACCOUNT</strong> to confirm.</p>
                        <input type="text" placeholder='Type "DELETE MY ACCOUNT"' value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                            className="w-full px-4 py-2.5 text-sm rounded-xl outline-none" style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid rgba(239,68,68,0.3)' }} />
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => { setShowDeleteAccountModal(false); setDeleteConfirmText(''); }}
                                className="px-4 py-2 text-sm rounded-xl" style={{ color: 'var(--color-secondary)' }}>Cancel</button>
                            <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                                className="px-4 py-2 text-sm font-medium rounded-xl disabled:opacity-40" style={{ background: 'var(--color-danger)', color: '#fff' }}>Delete Account Forever</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── AI Settings Tab ───────────────────────────────────────────────────────────

function AISettingsTab() {
    const { data: modelInfo, isLoading: modelLoading, refetch: refetchModel } = useModelInfo();
    const { data: availableData, isLoading: modelsLoading } = useAvailableModels();
    const setModel = useSetModel();
    const [showKey, setShowKey] = useState(false);
    const [openAIKey, setOpenAIKey] = useState('');
    const [ragEnabled, setRagEnabled] = useState(true);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ ok: boolean; ms?: number; model?: string; error?: string } | null>(null);

    const activeModel = modelInfo?.model ?? 'llama3.2:3b';
    const models = availableData?.models ?? [];

    const speedLabel = (sizeGb: number) => {
        if (sizeGb <= 2) return { label: '⚡ Fast', color: 'text-emerald-700 bg-emerald-100' };
        if (sizeGb <= 4.5) return { label: '🔵 Medium', color: 'text-blue-700 bg-blue-100' };
        return { label: '🐢 Slow', color: 'text-orange-700 bg-orange-100' };
    };

    const handleSwitchModel = async (modelName: string) => {
        await setModel.mutateAsync(modelName);
        refetchModel();
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestResult(null);
        const t0 = Date.now();
        try {
            const api = getAPIClient();
            const data = await api.post<{ message: string; model?: string }>(
                '/api/ai/chat',
                { message: 'Say "OK" and nothing else.', use_rag: false }
            );
            const ms = Date.now() - t0;
            setTestResult({ ok: true, ms, model: data.model ?? activeModel });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setTestResult({ ok: false, error: msg });
        }
        setTesting(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>AI & LLM Configuration</h3>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Select a model and configure AI preferences. Changes apply immediately.</p>
            </div>

            {/* Current Active Model */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}>
                <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-muted)' }}>ACTIVE MODEL</p>
                {modelLoading ? (
                    <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-muted)' }} />
                        <span style={{ color: 'var(--color-muted)' }}>Loading...</span>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-emerald-600" />
                            <div>
                                <p className="font-semibold" style={{ color: 'var(--color-primary)' }}>{activeModel}</p>
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                    {modelInfo?.provider ?? 'ollama'} · {modelInfo?.ollama_available ? '✓ Ollama connected' : '○ Ollama offline'}
                                </p>
                            </div>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium text-emerald-700 bg-emerald-100">
                            {modelInfo?.ollama_available ? 'Local' : 'Demo'}
                        </span>
                    </div>
                )}
            </div>

            {/* Model Selector */}
            <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-secondary)' }}>
                    <Cpu className="w-4 h-4 inline mr-1" />Installed Models — click to switch
                </p>
                {modelsLoading ? (
                    <div className="flex items-center gap-2 text-sm py-2" style={{ color: 'var(--color-muted)' }}>
                        <Loader2 className="w-4 h-4 animate-spin" />Loading available models...
                    </div>
                ) : models.length === 0 ? (
                    <p className="text-sm py-2" style={{ color: 'var(--color-muted)' }}>No Ollama models found. Run <code className="px-1 py-0.5 rounded bg-gray-100 text-xs">ollama pull llama3.2:3b</code> to get started.</p>
                ) : (
                    <div className="space-y-2">
                        {models.map((m) => {
                            const isActive = m.name === activeModel;
                            const speed = speedLabel(m.size_gb);
                            const isSwitching = setModel.isPending && setModel.variables === m.name;
                            return (
                                <button
                                    key={m.name}
                                    onClick={() => !isActive && handleSwitchModel(m.name)}
                                    disabled={setModel.isPending}
                                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left disabled:opacity-60"
                                    style={{
                                        background: isActive ? 'rgba(99,102,241,0.08)' : 'var(--color-shell)',
                                        border: `1px solid ${isActive ? 'rgba(99,102,241,0.4)' : 'var(--color-border)'}`,
                                        cursor: isActive ? 'default' : 'pointer',
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        {isSwitching
                                            ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-accent)' }} />
                                            : <Cpu className="w-4 h-4" style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-muted)' }} />}
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-primary)' }}>
                                                {m.name} {isActive && '★'}
                                            </p>
                                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{m.size_gb} GB</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${speed.color}`}>
                                        {speed.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* OpenAI API Key */}
            <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-secondary)' }}>
                    <Zap className="w-4 h-4 inline mr-1" />OpenAI API Key (optional)
                </label>
                <div className="relative">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={openAIKey}
                        onChange={e => setOpenAIKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl outline-none focus:ring-2 transition-all"
                        style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                    />
                    <button
                        type="button"
                        onClick={() => setShowKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--color-muted)' }}
                    >
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>Provide your own OpenAI key to use GPT-4o instead of local Ollama.</p>
            </div>

            {/* RAG Toggle */}
            <div
                className="flex items-center justify-between py-3 px-4 rounded-xl transition-colors"
                style={{ background: ragEnabled ? 'rgba(99,102,241,0.06)' : 'transparent' }}
            >
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Enable RAG Context</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>Retrieve your recent activity data to ground AI responses in real context</p>
                </div>
                <button onClick={() => setRagEnabled(v => !v)} className="focus:outline-none">
                    {ragEnabled
                        ? <ToggleRight className="w-8 h-8" style={{ color: 'var(--color-accent)' }} />
                        : <ToggleLeft className="w-8 h-8" style={{ color: 'var(--color-border)' }} />}
                </button>
            </div>

            {/* Test Connection */}
            <div className="pt-2">
                <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}
                >
                    {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {testing ? `Testing ${activeModel}...` : `Test ${activeModel}`}
                </button>
                {testResult && (
                    <div className={`mt-2 text-xs px-3 py-2 rounded-lg ${testResult.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {testResult.ok
                            ? `✓ ${testResult.model ?? activeModel} responded in ${testResult.ms}ms`
                            : `✗ Connection failed: ${testResult.error}`}
                    </div>
                )}
            </div>
        </div>
    );
}
