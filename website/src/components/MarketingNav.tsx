'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';

const NAV_LINKS = [
    {
        label: 'Product',
        children: [
            { label: 'Features', href: '/features', desc: 'Everything MiniMe can do' },
            { label: 'Installation', href: '/install', desc: 'Get running in minutes' },
            { label: 'Changelog', href: '/changelog', desc: 'What\'s new' },
        ],
    },
    {
        label: 'Developers',
        children: [
            { label: 'API Reference', href: '/docs', desc: 'REST API documentation' },
            { label: 'Whitepaper', href: '/whitepaper', desc: 'Technical deep-dive' },
        ],
    },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Blog', href: '/blog' },
    {
        label: 'Company',
        children: [
            { label: 'About', href: '/about', desc: 'Our mission & team' },
            { label: 'Investors', href: '/investors', desc: 'Investor relations' },
            { label: 'Contact', href: '/contact', desc: 'Get in touch' },
            { label: 'FAQ', href: '/faq', desc: 'Common questions' },
        ],
    },
];

export default function MarketingNav() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
                        <Image src="/icon.png" alt="MiniMe" width={32} height={32} className="rounded-lg" priority />
                        <span className="text-xl font-bold text-gray-900">MiniMe</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden lg:flex items-center gap-1">
                        {NAV_LINKS.map((item) =>
                            item.children ? (
                                <div
                                    key={item.label}
                                    className="relative"
                                    onMouseEnter={() => setActiveDropdown(item.label)}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                                        {item.label}
                                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`} />
                                    </button>
                                    {activeDropdown === item.label && (
                                        <div className="absolute top-full left-0 pt-2 w-56">
                                            <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-2">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600">{child.label}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{child.desc}</p>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    key={item.label}
                                    href={item.href!}
                                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            )
                        )}
                    </div>

                    {/* CTA */}
                    <div className="hidden lg:flex items-center gap-3">
                        <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            Sign in
                        </Link>
                        <Link
                            href="/auth/login"
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
                        >
                            Get Started Free
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
                        aria-label="Toggle menu"
                    >
                        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
                        {NAV_LINKS.flatMap((item) =>
                            item.children
                                ? item.children.map((child) => (
                                    <Link
                                        key={child.href}
                                        href={child.href}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                                    >
                                        {child.label}
                                    </Link>
                                ))
                                : [
                                    <Link
                                        key={item.href}
                                        href={item.href!}
                                        onClick={() => setOpen(false)}
                                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                                    >
                                        {item.label}
                                    </Link>,
                                ]
                        )}
                        <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                            <Link href="/auth/login" className="w-full text-center py-2.5 text-sm font-medium text-gray-700 rounded-lg border border-gray-200">Sign In</Link>
                            <Link href="/auth/login" className="w-full text-center py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg">Get Started</Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
