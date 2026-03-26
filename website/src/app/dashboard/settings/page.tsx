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
    Cloud, Lock, RefreshCcw, HardDrive, UploadCloud, Upload,
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
import {
    useCloudSyncStatus,
    useGDriveConnect, useGDriveDisconnect,
    useOneDriveConnect, useOneDriveDisconnect,
    useBackupNow, useRestoreFromCloud,
    type ProviderStatus,
} from '@/lib/hooks/useCloudSync';
import {
    useSyncSchedule, useUpdateSchedule,
    useTriggerSync, useSyncHistory,
    useRestoreFromCloud as useRestoreFromCloudSync,
} from '@/lib/hooks/useCloudSyncSchedule';
import { useExportDownload, useExportUpload } from '@/lib/hooks/useExport';

type Tab = 'profile' | 'privacy' | 'notifications' | 'integrations' | 'data' | 'ai' | 'desktop' | 'sync';


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

// ComingSoonCard component removed 

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
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        milestoneAlerts: true,
        focusReminders: true,
        digestFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
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
                quietHoursStart: (p.quiet_hours_start as string) ?? prev.quietHoursStart,
                quietHoursEnd: (p.quiet_hours_end as string) ?? prev.quietHoursEnd,
                milestoneAlerts: (p.milestone_alerts as boolean) ?? prev.milestoneAlerts,
                focusReminders: (p.focus_reminders as boolean) ?? prev.focusReminders,
                digestFrequency: (p.digest_frequency as 'daily' | 'weekly' | 'monthly') ?? prev.digestFrequency,
            }));
        }
    }, [prefsData]);



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
            // GDPR Art. 20 — full data export via new /api/v1/account/export
            const token = localStorage.getItem('access_token') || '';
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/account/export`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error(await res.text());
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'minime-personal-data-export.json'; a.click();
            URL.revokeObjectURL(url);
            toast.success('Personal data exported (GDPR Art. 20)');
        } catch { toast.error('Export failed'); }
        setExporting(false);
    };

    const handleDeleteData = async () => {
        try {
            const res = await api.delete<{ deleted_count: number; message: string; breakdown: Record<string, any> }>('/api/v1/users/me/data');
            toast.success(res.message || `Deleted ${res.deleted_count} records`);
            setShowDeleteDataModal(false); setDeleteConfirmText('');
        } catch { toast.error('Failed to delete data'); }
    };

    const handleDeleteAccount = async () => {
        try {
            // GDPR Art. 17 — right to erasure via new /api/v1/account
            await api.delete('/api/v1/account');
            toast.success('Account and all data permanently deleted');
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
                quiet_hours_start: notifs.quietHoursStart,
                quiet_hours_end: notifs.quietHoursEnd,
                milestone_alerts: notifs.milestoneAlerts,
                focus_reminders: notifs.focusReminders,
                digest_frequency: notifs.digestFrequency,
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
            toast.success('Settings saved successfully', { style: { padding: '16px', fontSize: '15px' } });
            setTimeout(() => setSaved(false), 2000);
        } catch {
            setSaveError('Failed to save. Please try again.');
        }
    };

    // ── Tab definitions ───────────────────────────────────────────────────────
    const tabs = [
        { id: 'profile' as Tab, label: 'Profile', icon: User },
        { id: 'privacy' as Tab, label: 'Privacy', icon: Shield },
        { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
        { id: 'integrations' as Tab, label: 'Integrations', icon: Plug },
        { id: 'sync' as Tab, label: 'Data & Sync', icon: Cloud },
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
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Plan', value: planType === 'pro' ? 'Pro' : planType === 'enterprise' ? 'Enterprise' : 'Free', icon: Crown, color: '#6366f1' },
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
                                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Notification Preferences</h3>
                                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Control how and when MiniMe contacts you. Changes are saved to your account.</p>
                            </div>

                            {/* Delivery Channels */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-secondary)' }}>Delivery Channels</h4>
                                <div className="space-y-1">
                                    <Toggle enabled={notifs.emailNotifications} onToggle={() => setNotifs(n => ({ ...n, emailNotifications: !n.emailNotifications }))} label="Email Notifications" description="Receive updates and alerts via email" />
                                    <Toggle enabled={notifs.desktopNotifications} onToggle={() => setNotifs(n => ({ ...n, desktopNotifications: !n.desktopNotifications }))} label="Desktop Notifications" description="Show system notifications for important events" />
                                </div>
                            </div>

                            {/* Insight Categories */}
                            <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-secondary)' }}>Insight Categories</h4>
                                <div className="space-y-1">
                                    <Toggle enabled={notifs.productivityAlerts} onToggle={() => setNotifs(n => ({ ...n, productivityAlerts: !n.productivityAlerts }))} label="Productivity Alerts" description="Get notified when unusual patterns are detected" />
                                    <Toggle enabled={notifs.milestoneAlerts} onToggle={() => setNotifs(n => ({ ...n, milestoneAlerts: !n.milestoneAlerts }))} label="Milestone Celebrations" description="Receive notifications when you hit milestones" />
                                    <Toggle enabled={notifs.focusReminders} onToggle={() => setNotifs(n => ({ ...n, focusReminders: !n.focusReminders }))} label="Focus Reminders" description="Get nudged when context-switching spikes" />
                                </div>
                            </div>

                            {/* Schedule */}
                            <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-secondary)' }}>Schedule</h4>
                                <Toggle enabled={notifs.dndEnabled} onToggle={() => setNotifs(n => ({ ...n, dndEnabled: !n.dndEnabled }))} label="Do Not Disturb" description="Mute all notifications during quiet hours" />
                                {notifs.dndEnabled && (
                                    <div className="flex items-center gap-3 mt-2 ml-4">
                                        <div>
                                            <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>From</label>
                                            <input
                                                type="time"
                                                value={notifs.quietHoursStart}
                                                onChange={(e) => setNotifs(n => ({ ...n, quietHoursStart: e.target.value }))}
                                                className="block mt-1 px-3 py-1.5 text-sm rounded-lg outline-none"
                                                style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium" style={{ color: 'var(--color-muted)' }}>To</label>
                                            <input
                                                type="time"
                                                value={notifs.quietHoursEnd}
                                                onChange={(e) => setNotifs(n => ({ ...n, quietHoursEnd: e.target.value }))}
                                                className="block mt-1 px-3 py-1.5 text-sm rounded-lg outline-none"
                                                style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Digest Frequency */}
                            <div className="pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-secondary)' }}>Digest Frequency</h4>
                                <Toggle enabled={notifs.weeklyDigest} onToggle={() => setNotifs(n => ({ ...n, weeklyDigest: !n.weeklyDigest }))} label="Activity Digest" description="Receive a summary of your activity" />
                                {notifs.weeklyDigest && (
                                    <div className="flex gap-2 mt-2 ml-4">
                                        {(['daily', 'weekly', 'monthly'] as const).map((freq) => (
                                            <button
                                                key={freq}
                                                onClick={() => setNotifs(n => ({ ...n, digestFrequency: freq }))}
                                                className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize"
                                                style={{
                                                    background: notifs.digestFrequency === freq ? 'rgba(99,102,241,0.1)' : 'var(--color-shell)',
                                                    color: notifs.digestFrequency === freq ? 'var(--color-accent)' : 'var(--color-secondary)',
                                                    border: `1px solid ${notifs.digestFrequency === freq ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
                                                }}
                                            >
                                                {freq}
                                            </button>
                                        ))}
                                    </div>
                                )}
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

                    {/* ── Data & Sync ────────────────────────────────────── */}
                    {activeTab === 'sync' && (
                        <SyncTab
                            handleExportData={handleExportData}
                            exporting={exporting}
                            setShowDeleteDataModal={setShowDeleteDataModal}
                            planType={planType}
                            handleUpgrade={handleUpgrade}
                        />
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
            {showDeleteDataModal && <DeleteDataModal
                onDelete={handleDeleteData}
                onCancel={() => { setShowDeleteDataModal(false); setDeleteConfirmText(''); }}
            />}

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

// ── Sync Provider Card ────────────────────────────────────────────────────────

function SyncProviderCard({
    name, icon: Icon, color, provider, status,
    onConnect, onDisconnect, onRestore, isConnecting, isDisconnecting, isRestoring,
}: {
    name: string;
    icon: React.ElementType;
    color: string;
    provider: 'gdrive' | 'onedrive';
    status?: ProviderStatus;
    onConnect: () => void;
    onDisconnect: () => void;
    onRestore: () => void;
    isConnecting: boolean;
    isDisconnecting: boolean;
    isRestoring: boolean;
}) {
    const connected = status?.connected ?? false;
    return (
        <div
            className="rounded-xl p-5 space-y-3"
            style={{
                background: connected ? `rgba(${color},0.03)` : 'var(--color-shell)',
                border: `1px solid ${connected ? `rgba(${color},0.25)` : 'var(--color-border)'}`,
            }}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: connected ? `rgba(${color},0.1)` : 'var(--color-border)' }}
                    >
                        <Icon className="w-5 h-5" style={{ color: connected ? `rgb(${color})` : 'var(--color-muted)' }} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{name}</p>
                        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                            {connected && status?.account
                                ? status.account.email
                                : 'Not connected'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={connected ? onDisconnect : onConnect}
                    disabled={isConnecting || isDisconnecting}
                    className="px-4 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                    style={{
                        background: connected ? 'rgba(239,68,68,0.07)' : `rgb(${color})`,
                        color: connected ? 'var(--color-danger)' : '#fff',
                        border: connected ? '1px solid rgba(239,68,68,0.2)' : 'none',
                    }}
                >
                    {(isConnecting || isDisconnecting) && <Loader2 className="w-3 h-3 animate-spin" />}
                    {connected ? 'Disconnect' : <><ExternalLink className="w-3 h-3" /> Connect</>}
                </button>
            </div>

            {connected && (
                <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {status?.last_sync
                            ? <>Last sync: {new Date(status.last_sync).toLocaleString()}</>
                            : 'Never synced'}
                        {status?.snapshot_count ? <> · {status.snapshot_count} snapshots</> : ''}
                    </div>
                    <button
                        onClick={onRestore}
                        disabled={isRestoring}
                        className="flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg transition-all disabled:opacity-50"
                        style={{ background: 'var(--color-surface)', color: 'var(--color-secondary)', border: '1px solid var(--color-border)' }}
                    >
                        {isRestoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                        Restore
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Sync Tab Content ──────────────────────────────────────────────────────────

function SyncTab({
    handleExportData,
    exporting,
    setShowDeleteDataModal,
    planType,
    handleUpgrade,
}: {
    handleExportData: () => void;
    exporting: boolean;
    setShowDeleteDataModal: (show: boolean) => void;
    planType: string;
    handleUpgrade: (plan: string) => void;
}) {
    const isFree = planType === 'free' || !planType;

    const { data: syncStatus, isLoading } = useCloudSyncStatus();
    const gdriveConnect = useGDriveConnect();
    const gdriveDisconnect = useGDriveDisconnect();
    const oneDriveConnect = useOneDriveConnect();
    const oneDriveDisconnect = useOneDriveDisconnect();
    const backupNow = useBackupNow();
    const gdriveRestore = useRestoreFromCloud('gdrive');
    const oneDriveRestore = useRestoreFromCloud('onedrive');

    const gdrive = syncStatus?.providers.gdrive;
    const onedrive = syncStatus?.providers.onedrive;
    const anyConnected = gdrive?.connected || onedrive?.connected;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>Data & Sync</h3>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                    Your data is encrypted with AES-256-GCM locally before upload. The cloud provider never sees plaintext.
                </p>
            </div>

            {/* Encryption info */}
            <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}
            >
                <Lock className="w-5 h-5 flex-shrink-0" style={{ color: '#6366f1' }} />
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>End-to-End Encrypted</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Algorithm: {syncStatus?.encryption.algorithm ?? 'AES-256-GCM'}
                        {syncStatus?.encryption.key_fingerprint
                            ? ` · Key fingerprint: …${syncStatus.encryption.key_fingerprint}`
                            : ''}
                    </p>
                </div>
            </div>

            {/* Encryption info + Provider cards + Backup — gated behind Pro */}
            {isFree ? (
                /* ── Free user paywall ──────────────────────────────────── */
                <div
                    className="rounded-2xl p-8 text-center relative overflow-hidden"
                    style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                >
                    {/* Decorative gradient blob */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(99,102,241,0.12) 0%, transparent 60%)' }}
                    />

                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                    >
                        <Lock className="w-7 h-7" style={{ color: '#6366f1' }} />
                    </div>

                    <h4 className="text-lg font-bold mb-1" style={{ color: 'var(--color-primary)' }}>
                        Cloud Sync is a Pro feature
                    </h4>
                    <p className="text-sm mb-6" style={{ color: 'var(--color-muted)' }}>
                        Upgrade to back up your data to the cloud and access it across all your devices.
                    </p>

                    {/* Feature list */}
                    <ul className="text-left space-y-2.5 mb-6 max-w-xs mx-auto">
                        {[
                            'AES-256-GCM encrypted backups — only you can decrypt',
                            'Google Drive & Microsoft OneDrive support',
                            'Multi-device restore — log in anywhere, get your data back',
                            'Incremental backups (only changed records are uploaded)',
                            'Automatic daily / weekly / monthly cadence',
                        ].map((f) => (
                            <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--color-secondary)' }}>
                                <span className="mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                                    style={{ background: '#6366f1' }}>✓</span>
                                {f}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={() => handleUpgrade('pro')}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)' }}
                    >
                        <Crown className="w-4 h-4" />
                        Upgrade to Pro
                    </button>
                    <p className="text-xs mt-3" style={{ color: 'var(--color-muted)' }}>14-day free trial · Cancel anytime</p>
                </div>
            ) : (
                /* ── Pro / Enterprise: full sync UI ────────────────────── */
                <>
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Cloud Providers</h4>

                        <SyncProviderCard
                            name="Google Drive"
                            icon={HardDrive}
                            color="66,133,244"
                            provider="gdrive"
                            status={gdrive}
                            onConnect={() => gdriveConnect.mutate()}
                            onDisconnect={() => gdriveDisconnect.mutate()}
                            onRestore={() => gdriveRestore.mutate()}
                            isConnecting={gdriveConnect.isPending}
                            isDisconnecting={gdriveDisconnect.isPending}
                            isRestoring={gdriveRestore.isPending}
                        />

                        <SyncProviderCard
                            name="Microsoft OneDrive"
                            icon={Cloud}
                            color="0,120,212"
                            provider="onedrive"
                            status={onedrive}
                            onConnect={() => oneDriveConnect.mutate()}
                            onDisconnect={() => oneDriveDisconnect.mutate()}
                            onRestore={() => oneDriveRestore.mutate()}
                            isConnecting={oneDriveConnect.isPending}
                            isDisconnecting={oneDriveDisconnect.isPending}
                            isRestoring={oneDriveRestore.isPending}
                        />
                    </div>

                    {/* Backup now */}
                    <div
                        className="rounded-xl p-5 space-y-3"
                        style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Backup Now</p>
                                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                    Encrypt and upload your activity data to all connected providers.
                                    Only changed records are re-uploaded (incremental).
                                </p>
                            </div>
                            <button
                                onClick={() => backupNow.mutate({ data: [] })}
                                disabled={backupNow.isPending || !anyConnected}
                                className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-90 disabled:opacity-40"
                                style={{ background: 'var(--color-accent)', color: '#fff' }}
                            >
                                {backupNow.isPending
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Backing up…</>
                                    : <><UploadCloud className="w-4 h-4" /> Backup Now</>}
                            </button>
                        </div>
                        {!anyConnected && (
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                ⚠ Connect at least one provider above to enable backups.
                            </p>
                        )}
                    </div>

                    {/* ── Cloud Sync Schedule ── */}
                    <div
                        className="rounded-xl p-5 space-y-4"
                        style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                    >
                        <SyncScheduleSection />
                    </div>

                    {/* ── Cloud Sync (Push to cloud DBs) ── */}
                    <div
                        className="rounded-xl p-5 space-y-3"
                        style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                    >
                        <CloudSyncTriggerSection />
                    </div>

                    {/* ── Sync History ── */}
                    <SyncHistorySection />

                    {/* ── Restore from Cloud ── */}
                    <RestoreFromCloudSection />

                    {/* ── Export & Backup ── */}
                    <ExportBackupSection />
                </>
            )}


            <div className="space-y-3 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-primary)' }}>Account Data</h4>
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
    );
}


// ── Sync Schedule Section ─────────────────────────────────────────────────────

const FREQ_OPTIONS = [
    { value: 'daily', label: 'Daily' },
    { value: 'twice_daily', label: 'Twice Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
];

function SyncScheduleSection() {
    const { data: schedule, isError } = useSyncSchedule();
    const updateSchedule = useUpdateSchedule();
    const [freq, setFreq] = useState('daily');
    const [syncTime, setSyncTime] = useState('02:00');

    useEffect(() => {
        if (schedule) {
            setFreq(schedule.frequency);
            setSyncTime(schedule.sync_time);
        }
    }, [schedule]);

    if (isError) return null; // Not a pro user or backend down — hide section

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Sync Schedule</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Automatically push your local data to the cloud on a schedule.
                        {schedule?.last_synced_at && (
                            <> Last synced: {new Date(schedule.last_synced_at).toLocaleString()}</>
                        )}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {FREQ_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setFreq(opt.value)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                        style={{
                            background: freq === opt.value ? 'rgba(99,102,241,0.1)' : 'var(--color-base)',
                            color: freq === opt.value ? 'var(--color-accent)' : 'var(--color-secondary)',
                            border: `1px solid ${freq === opt.value ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <label className="text-xs" style={{ color: 'var(--color-muted)' }}>Preferred time:</label>
                <input
                    type="time"
                    value={syncTime}
                    onChange={(e) => setSyncTime(e.target.value)}
                    className="px-2 py-1 rounded-lg text-xs"
                    style={{ background: 'var(--color-base)', border: '1px solid var(--color-border)', color: 'var(--color-primary)' }}
                />
                <button
                    onClick={() => updateSchedule.mutate({ frequency: freq, sync_time: syncTime })}
                    disabled={updateSchedule.isPending}
                    className="ml-auto flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'var(--color-accent)' }}
                >
                    {updateSchedule.isPending
                        ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                        : <><Save className="w-3 h-3" /> Save Schedule</>}
                </button>
            </div>
        </>
    );
}


// ── Cloud Sync Trigger ────────────────────────────────────────────────────────

function CloudSyncTriggerSection() {
    const triggerSync = useTriggerSync();

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Cloud Database Sync</p>
                    <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        Push unsynced data to Supabase, Upstash, Neo4j AuraDB, and Qdrant Cloud.
                    </p>
                </div>
                <button
                    onClick={() => triggerSync.mutate()}
                    disabled={triggerSync.isPending}
                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl transition-all hover:opacity-90 disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
                >
                    {triggerSync.isPending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing…</>
                        : <><RefreshCcw className="w-4 h-4" /> Sync Now</>}
                </button>
            </div>
            {triggerSync.data && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(triggerSync.data.targets).map(([name, info]: [string, any]) => (
                        <span
                            key={name}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                            style={{
                                background: info.error ? 'rgba(239,68,68,0.08)' : info.skipped ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.08)',
                                color: info.error ? '#ef4444' : info.skipped ? '#d97706' : '#22c55e',
                                border: `1px solid ${info.error ? 'rgba(239,68,68,0.2)' : info.skipped ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)'}`,
                            }}
                        >
                            {info.error ? '✗' : info.skipped ? '⊘' : '✓'} {name}: {info.records ?? 0} records
                        </span>
                    ))}
                </div>
            )}
        </>
    );
}


// ── Sync History ──────────────────────────────────────────────────────────────

function SyncHistorySection() {
    const { data: historyData, isError } = useSyncHistory();
    const [expanded, setExpanded] = useState(false);

    if (isError || !historyData?.history?.length) return null;

    const items = historyData.history.slice(0, expanded ? 20 : 5);

    return (
        <div
            className="rounded-xl p-5 space-y-3"
            style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
        >
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Sync History</p>
                {historyData.history.length > 5 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs font-medium transition-colors"
                        style={{ color: 'var(--color-accent)' }}
                    >
                        {expanded ? 'Show less' : `Show all (${historyData.count})`}
                    </button>
                )}
            </div>
            <div className="space-y-2">
                {items.map((entry) => {
                    const statusColor = entry.status === 'completed' ? '#22c55e'
                        : entry.status === 'failed' ? '#ef4444' : '#f59e0b';
                    const isRunning = entry.status === 'running';
                    const duration = entry.completed_at && entry.started_at
                        ? Math.round((new Date(entry.completed_at).getTime() - new Date(entry.started_at).getTime()) / 1000)
                        : isRunning
                            ? Math.round((Date.now() - new Date(entry.started_at).getTime()) / 1000)
                            : null;

                    return (
                        <div
                            key={entry.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg"
                            style={{ background: 'var(--color-base)' }}
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`w-2 h-2 rounded-full flex-shrink-0${isRunning ? ' animate-pulse' : ''}`}
                                    style={{ background: statusColor }}
                                />
                                <span className="text-xs" style={{ color: 'var(--color-primary)' }}>
                                    {new Date(entry.started_at).toLocaleString()}
                                </span>
                                <span
                                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                                    style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--color-accent)' }}
                                >
                                    {entry.trigger}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs${isRunning ? ' font-medium' : ''}`} style={{ color: isRunning ? 'var(--color-accent)' : 'var(--color-muted)' }}>
                                    {entry.records_synced} records{isRunning ? '…' : ''}
                                </span>
                                {duration !== null && (
                                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                                        {duration}s
                                    </span>
                                )}
                                <span
                                    className={`text-xs font-medium${isRunning ? ' animate-pulse' : ''}`}
                                    style={{ color: statusColor }}
                                >
                                    {entry.status}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Restore from Cloud ────────────────────────────────────────────────────────

function RestoreFromCloudSection() {
    const restoreMutation = useRestoreFromCloudSync();

    return (
        <div
            className="rounded-xl p-5 space-y-3"
            style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Restore from Cloud</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                        Pull your data from the cloud to this device
                    </p>
                </div>
                <button
                    onClick={() => restoreMutation.mutate()}
                    disabled={restoreMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#fff',
                        opacity: restoreMutation.isPending ? 0.7 : 1,
                    }}
                    id="restore-cloud-btn"
                >
                    {restoreMutation.isPending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Restoring…</>
                        : <><Download className="w-4 h-4" /> Restore</>}
                </button>
            </div>
        </div>
    );
}

// ── Export & Backup ───────────────────────────────────────────────────────────

function ExportBackupSection() {
    const [exportPassword, setExportPassword] = useState('');
    const [importPassword, setImportPassword] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);
    const exportDownload = useExportDownload();
    const exportUpload = useExportUpload();

    return (
        <div
            className="rounded-xl p-5 space-y-5"
            style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
        >
            <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>Export & Backup</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>
                    Download or import your data as an encrypted .mmexport file
                </p>
            </div>

            {/* Download section */}
            <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>📦 Download Export</p>
                <div className="flex items-center gap-3">
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={exportPassword}
                        onChange={(e) => setExportPassword(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg text-sm"
                        style={{
                            background: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-primary)',
                        }}
                        id="export-password-input"
                    />
                    <button
                        onClick={() => { exportDownload.mutate(exportPassword); setExportPassword(''); }}
                        disabled={!exportPassword || exportDownload.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                            background: !exportPassword ? 'var(--color-border)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            opacity: exportDownload.isPending ? 0.7 : 1,
                        }}
                        id="export-download-btn"
                    >
                        {exportDownload.isPending
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Exporting…</>
                            : <><Download className="w-4 h-4" /> Download .mmexport</>}
                    </button>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                    ⚠️ Remember the password you use — it&apos;s required to decrypt this file later.
                </p>
            </div>

            {/* Divider */}
            <div style={{ borderTop: '1px solid var(--color-border)' }} />

            {/* Upload section */}
            <div className="space-y-3">
                <p className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>📥 Import from File</p>
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        accept=".mmexport"
                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                        className="flex-1 text-sm"
                        style={{ color: 'var(--color-muted)' }}
                        id="import-file-input"
                    />
                </div>
                {importFile && (
                    <div className="flex items-center gap-3">
                        <input
                            type="password"
                            placeholder="Password used during export"
                            value={importPassword}
                            onChange={(e) => setImportPassword(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg text-sm"
                            style={{
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-primary)',
                            }}
                            id="import-password-input"
                        />
                        <button
                            onClick={() => {
                                if (importFile && importPassword) {
                                    exportUpload.mutate({ password: importPassword, file: importFile });
                                    setImportPassword('');
                                    setImportFile(null);
                                }
                            }}
                            disabled={!importPassword || exportUpload.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                                background: !importPassword ? 'var(--color-border)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                opacity: exportUpload.isPending ? 0.7 : 1,
                            }}
                            id="import-upload-btn"
                        >
                            {exportUpload.isPending
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                                : <><Upload className="w-4 h-4" /> Import</>}
                        </button>
                    </div>
                )}
                {exportUpload.data && (
                    <p className="text-xs font-medium" style={{ color: '#10b981' }}>
                        ✅ Imported {exportUpload.data.total_imported} records successfully
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Delete Data Modal (with own local state) ──────────────────────────────────

function DeleteDataModal({ onDelete, onCancel }: { onDelete: () => void; onCancel: () => void }) {
    const [text, setText] = useState('');
    const isMatch = text.trim() === 'DELETE';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full max-w-md rounded-2xl p-6 shadow-xl" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-danger)' }}>Delete All Data</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-muted)' }}>
                    This will permanently delete all your data across all databases. Your account will remain active.
                    Type <strong>DELETE</strong> to confirm.
                </p>
                <input
                    type="text"
                    autoComplete="off"
                    autoFocus
                    placeholder='Type "DELETE" to confirm'
                    value={text}
                    onChange={e => setText(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl outline-none"
                    style={{ background: 'var(--color-shell)', color: 'var(--color-primary)', border: '1px solid rgba(239,68,68,0.3)' }}
                    id="delete-confirm-input"
                />
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm rounded-xl hover:opacity-80"
                        style={{ color: 'var(--color-secondary)' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onDelete}
                        disabled={!isMatch}
                        className="px-4 py-2 text-sm font-medium rounded-xl transition-all"
                        style={{
                            background: isMatch ? '#ef4444' : 'rgba(239,68,68,0.3)',
                            color: '#fff',
                            cursor: isMatch ? 'pointer' : 'not-allowed',
                            opacity: isMatch ? 1 : 0.5,
                        }}
                        id="delete-confirm-btn"
                    >
                        Delete All Data
                    </button>
                </div>
            </div>
        </div>
    );
}
