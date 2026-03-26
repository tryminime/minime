'use client';

import { ReactNode } from 'react';
import Image from 'next/image';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useLocalBackend } from '@/lib/hooks/useLocalBackend';
import { InstallPromptBanner } from '@/components/InstallPromptBanner';
import { UsageWarningBanner } from '@/components/UsageWarningBanner';
import { OfflineBanner } from '@/components/OfflineBanner';
import RestoreDialog from '@/components/RestoreDialog';
import { ChatPopup } from '@/components/ChatPopup';
import { ThemeToggle } from '@/components/ThemeToggle';
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
    BookOpen,
    CheckSquare,
    Shield,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
    { name: 'Overview', href: '/dashboard/overview', icon: LayoutDashboard },
    { name: 'Activities', href: '/dashboard/activities', icon: Activity },
    { name: 'Enrichment', href: '/dashboard/enrichment', icon: Sparkles },
    { name: 'Productivity', href: '/dashboard/productivity', icon: TrendingUp },
    { name: 'Graph Explorer', href: '/dashboard/graph', icon: Network },
    { name: 'Knowledge', href: '/dashboard/knowledge', icon: BookOpen },
    { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
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

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/auth/login');
        }
    }, [isLoading, isAuthenticated, router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-shell)' }}>
                <div className="w-12 h-12 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin"></div>
            </div>
        );
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
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-indigo-500/10 text-indigo-500' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-100'}`}
                                >
                                    <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-muted)' }} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}

                        {/* Admin Link (Conditional) */}
                        {user?.is_superadmin && (
                            <Link
                                href="/dashboard/admin"
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10`}
                            >
                                <Shield className="w-5 h-5 flex-shrink-0" />
                                <span>Admin Panel</span>
                            </Link>
                        )}
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
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                    </div>
                </header>

                {/* Offline banner — shown when network is unavailable */}
                <OfflineBanner />

                {/* Usage warning — shown when approaching plan limits */}
                <UsageWarningBanner />

                <main className="flex-1 overflow-auto p-6 flex flex-col relative">
                    <div className="flex-1">
                        {children}
                    </div>
                    {/* Compact Dashboard Footer */}
                    <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid var(--color-border)' }}>
                        <p className="text-sm flex items-center justify-center flex-wrap gap-2" style={{ color: 'var(--color-muted)' }}>
                            <span>© 2026 MiniMe</span>
                            <span>·</span>
                            <Link href="/legal/privacy" className="hover:opacity-80 transition-colors" style={{ color: 'var(--color-text)' }}>Privacy</Link>
                            <span>·</span>
                            <Link href="/legal/terms" className="hover:opacity-80 transition-colors" style={{ color: 'var(--color-text)' }}>Terms</Link>
                            <span>·</span>
                            <span>Made with <span className="text-red-500">♥</span> in SF</span>
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="https://twitter.com/tryminime" target="_blank" rel="noreferrer" aria-label="Twitter"
                                className="hover:text-indigo-400 transition-colors" style={{ color: 'var(--color-muted)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
                            </a>
                            <a href="https://github.com/tryminime" target="_blank" rel="noreferrer" aria-label="GitHub"
                                className="hover:opacity-80 transition-colors" style={{ color: 'var(--color-muted)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                            </a>
                        </div>
                    </div>
                </main>
            </div>

            {/* Install prompt — shown when local backend is not running */}
            {!isDetecting && !isRunning && (
                <InstallPromptBanner onRetry={retry} isRetrying={isDetecting} />
            )}

            {/* Floating AI Chat Popup — available on all dashboard pages */}
            <ChatPopup />

            {/* Cloud Restore Dialog — shown after login when cloud backup exists */}
            <RestoreDialog />
        </div>
    );
}
