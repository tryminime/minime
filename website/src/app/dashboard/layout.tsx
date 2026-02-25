'use client';

import { ReactNode } from 'react';
import Image from 'next/image';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLocalBackend } from '@/lib/hooks/useLocalBackend';
import { InstallPromptBanner } from '@/components/InstallPromptBanner';
import Link from 'next/link';
import {
    LayoutDashboard,
    Activity,
    Sparkles,
    TrendingUp,
    Network,
    Users,
    Zap,
    FileText,
    MessageSquare,
    Settings,
    CreditCard,
    LogOut,
    Menu,
    X,
    Heart,
    Briefcase,
    Target,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
    { name: 'Activities', href: '/dashboard/activities', icon: Activity },
    { name: 'Enrichment', href: '/dashboard/enrichment', icon: Sparkles },
    { name: 'Productivity', href: '/dashboard/productivity', icon: TrendingUp },
    { name: 'Graph Explorer', href: '/dashboard/graph', icon: Network },
    { name: 'Collaboration', href: '/dashboard/collaboration', icon: Users },
    { name: 'Skills', href: '/dashboard/skills', icon: Zap },
    { name: 'Wellness', href: '/dashboard/wellness', icon: Heart },
    { name: 'Career', href: '/dashboard/career', icon: Briefcase },
    { name: 'Goals', href: '/dashboard/goals', icon: Target },
    { name: 'Weekly Digest', href: '/dashboard/weekly-digest', icon: FileText },
    { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const { isDetecting, isRunning, retry } = useLocalBackend();
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-shell)' }}>
                <div className="w-12 h-12 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        router.push('/auth/login');
        return null;
    }

    return (
        <div className="flex h-screen" style={{ background: 'var(--color-shell)' }}>
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-30 w-64
                    transform transition-transform duration-300
                    lg:translate-x-0 lg:static lg:inset-auto
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{
                    background: 'var(--color-sidebar)',
                    borderRight: '1px solid var(--color-border)',
                    transitionTimingFunction: 'var(--ease-smooth)',
                }}
            >
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center justify-between h-16 px-6" style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-2.5">
                            <Image
                                src="/icon.png"
                                alt="MiniMe"
                                width={32}
                                height={32}
                                className="rounded-lg"
                                priority
                            />
                            <h1 className="text-xl font-semibold" style={{ color: 'var(--color-primary)', letterSpacing: '-0.01em' }}>
                                MiniMe
                            </h1>
                        </div>

                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`ds-nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <Icon className="w-5 h-5" style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-muted)' }} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* User profile */}
                    <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
                                style={{ background: 'linear-gradient(135deg, var(--color-accent), #818CF8)' }}
                            >
                                {user?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--color-primary)' }}>
                                    {user?.username || user?.email}
                                </p>
                                <p className="text-xs capitalize" style={{ color: 'var(--color-muted)' }}>
                                    {user?.subscription_status || 'Free'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-[var(--radius-card)] transition-colors"
                            style={{ color: 'var(--color-danger)' }}
                            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header
                    className="h-16 flex items-center px-6"
                    style={{
                        background: 'var(--color-surface)',
                        borderBottom: '1px solid var(--color-border)',
                    }}
                >
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden mr-4"
                        style={{ color: 'var(--color-muted)' }}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex-1">
                        <h2
                            className="text-lg font-semibold"
                            style={{ color: 'var(--color-primary)', letterSpacing: '-0.01em' }}
                        >
                            {navItems.find((item) => item.href === pathname)?.name || 'Dashboard'}
                        </h2>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>

            {/* Install prompt — shown when local backend is not running */}
            {!isDetecting && !isRunning && (
                <InstallPromptBanner onRetry={retry} isRetrying={isDetecting} />
            )}
        </div>
    );
}
