'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Database, BarChart3, Sparkles, Monitor, Globe, ShieldCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const FEATURE_LINKS = [
    {
        title: 'Intelligence Graph',
        description: 'Your Digital Brain, Mapped.',
        href: '/features/knowledge-graph',
        icon: Database
    },
    {
        title: 'Deep Analytics',
        description: 'Master Your Deep Work.',
        href: '/features/analytics',
        icon: BarChart3
    },
    {
        title: 'AI Copilot',
        description: 'Your Private Chief of Staff.',
        href: '/features/ai-assistant',
        icon: Sparkles
    }
];

const PLATFORM_LINKS = [
    {
        title: 'Desktop Guardian',
        description: 'The native Tauri agent.',
        href: '/platform/desktop',
        icon: Monitor
    },
    {
        title: 'Browser Intelligence',
        description: 'Chrome, Firefox & Edge.',
        href: '/platform/extensions',
        icon: Globe
    },
    {
        title: 'Zero-Trust Security',
        description: 'Local-first architecture.',
        href: '/platform/security',
        icon: ShieldCheck
    }
];

const NAV_LINKS = [
    { label: 'Features', isDropdown: true, items: FEATURE_LINKS },
    { label: 'Platform', isDropdown: true, items: PLATFORM_LINKS },
    { label: 'Pricing', href: '/pricing' },
];

export default function MarketingNav() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    // Prevent scrolling when mobile menu is open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    return (
        <>
            <nav
                className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-bg-base/95 backdrop-blur-md shadow-sm border-b border-border'
                    : 'bg-transparent border-b border-transparent'
                    }`}
            >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Logo & Badge */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <Link href="/" className="flex items-center gap-2.5 outline-none focus-visible:ring-2 ring-indigo-500 rounded-lg">
                            <Image src="/icon.png" alt="MiniMe" width={32} height={32} className="rounded-lg" priority />
                            <span className="text-xl font-display font-bold text-text-primary tracking-tight">MiniMe</span>
                        </Link>
                        <div className="hidden sm:flex items-center px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-full">
                            v0.2 ✦ Now in Beta
                        </div>
                    </div>

                    {/* Center: Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {NAV_LINKS.map((item) => (
                            item.isDropdown ? (
                                <div key={item.label} className="relative group">
                                    <button
                                        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-elevated transition-colors"
                                    >
                                        {item.label}
                                        <ChevronDown className="w-4 h-4 text-text-muted group-hover:text-text-primary transition-transform group-hover:rotate-180" />
                                    </button>
                                    
                                    {/* Dropdown Menu */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100]">
                                        <div className="w-[320px] bg-bg-surface border border-border rounded-2xl shadow-xl overflow-hidden p-2">
                                            {item.items?.map((subItem) => (
                                                <Link
                                                    key={subItem.title}
                                                    href={subItem.href}
                                                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-elevated transition-colors group/item"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-elevated flex items-center justify-center flex-shrink-0 group-hover/item:bg-indigo-500/10 transition-colors">
                                                        <subItem.icon className="w-5 h-5 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-text-primary group-hover/item:text-indigo-500 transition-colors">
                                                            {subItem.title}
                                                        </div>
                                                        <div className="text-xs text-text-secondary mt-0.5">
                                                            {subItem.description}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    key={item.label}
                                    href={item.href || '#'}
                                    className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary rounded-lg hover:bg-elevated transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )
                        ))}
                    </div>

                    {/* Right: Actions */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle />
                        <Link
                            href="/auth/login"
                            className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-3 py-2"
                        >
                            Sign in
                        </Link>
                        <Link
                            href="/download"
                            className="group relative inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-full overflow-hidden transition-all shadow-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                            <span className="relative">Download App</span>
                        </Link>
                    </div>

                    {/* Mobile menu toggle */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <button
                            onClick={() => setOpen(!open)}
                            className="p-2 -mr-2 rounded-lg text-text-secondary hover:bg-elevated transition-colors"
                            aria-label="Toggle menu"
                        >
                            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </nav>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 top-16 z-40 bg-bg-base/95 backdrop-blur-xl transition-transform duration-300 md:hidden ${open ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                <div className="flex flex-col h-full p-6 space-y-2 overflow-y-auto w-full">
                    {NAV_LINKS.map((item) => (
                        item.isDropdown ? (
                            <div key={item.label} className="py-2">
                                <div className="px-4 py-2 text-lg font-bold text-text-primary">{item.label}</div>
                                <div className="flex flex-col gap-1 mt-2 pl-4">
                                    {item.items?.map((subItem) => (
                                        <Link
                                            key={subItem.title}
                                            href={subItem.href}
                                            onClick={() => setOpen(false)}
                                            className="px-4 py-3 text-base text-text-secondary hover:text-text-primary rounded-xl hover:bg-elevated transition-colors flex items-center gap-3"
                                        >
                                            <subItem.icon className="w-5 h-5 text-indigo-500" />
                                            {subItem.title}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <Link
                                key={item.label}
                                href={item.href || '#'}
                                onClick={() => setOpen(false)}
                                className="flex items-center px-4 py-4 text-lg font-bold text-text-primary rounded-xl hover:bg-elevated transition-colors"
                            >
                                {item.label}
                            </Link>
                        )
                    ))}
                    <div className="mt-auto pt-6 border-t border-border flex flex-col gap-3 pb-8">
                        <Link
                            href="/auth/login"
                            className="w-full text-center py-3.5 text-base font-medium text-text-primary rounded-xl hover:bg-elevated transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/download"
                            className="w-full text-center py-3.5 text-base font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20"
                        >
                            Download App
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
