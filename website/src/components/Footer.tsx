'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Linkedin, MessageSquare } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { FooterNewsletter } from './FooterNewsletter';

const FOOTER_LINKS = {
    Product: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Changelog', href: '/changelog' },
        { label: 'Download App', href: '/download' },
        { label: 'Extensions', href: '/install' },
    ],
    Resources: [
        { label: 'Docs', href: '/docs' },
        { label: 'Blog', href: '/blog' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Whitepaper', href: '/whitepaper' },
        { label: 'Privacy', href: '/privacy' },
        { label: 'Status', href: '/status' },
    ],
    Company: [
        { label: 'About', href: '/about' },
        { label: 'Investors', href: '/investors' },
        { label: 'Careers', href: '/about#careers' },
        { label: 'Contact', href: '/contact' },
    ],
};

export default function Footer() {
    return (
        <footer className="bg-bg-base border-t border-border pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Column 1: Brand & Utilities */}
                    <div className="flex flex-col gap-6">
                        <Link href="/" className="flex items-center gap-2.5">
                            <Image src="/icon.png" alt="MiniMe" width={32} height={32} className="rounded-lg" />
                            <span className="text-xl font-display font-bold text-text-primary tracking-tight">MiniMe</span>
                        </Link>

                        <p className="text-sm text-text-secondary leading-relaxed">
                            Your work, captured quietly. Your patterns, understood deeply. Your history, always private and always on your machine.
                        </p>

                        {/* Newsletter — fully wired */}
                        <FooterNewsletter />

                        <div className="flex items-center justify-between mt-2">
                            <ThemeToggle />

                            <div className="flex items-center gap-2 px-3 py-1.5 bg-elevated border border-border rounded-full shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-medium text-text-secondary">All systems operational</span>
                            </div>
                        </div>
                    </div>

                    {/* Links Columns */}
                    {Object.entries(FOOTER_LINKS).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="text-sm font-semibold text-text-primary mb-6">{category}</h4>
                            <ul className="space-y-4">
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-text-secondary hover:text-indigo-500 hover:translate-x-1 inline-block transition-all"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
                    <p className="text-sm text-text-muted flex flex-wrap gap-2">
                        <span>© 2026 MiniMe Technologies, Inc.</span>
                        <span>·</span>
                        <Link href="/privacy" className="hover:text-text-primary transition-colors">Privacy Policy</Link>
                        <span>·</span>
                        <Link href="/terms" className="hover:text-text-primary transition-colors">Terms of Service</Link>
                        <span>·</span>
                        <span>Made in USA</span>
                    </p>

                    <div className="flex items-center gap-4">
                        <a href="https://twitter.com/tryminime" target="_blank" rel="noreferrer" aria-label="Twitter"
                            className="text-text-muted hover:text-indigo-400 transition-colors">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <a href="https://github.com/tryminime" target="_blank" rel="noreferrer" aria-label="GitHub"
                            className="text-text-muted hover:text-text-primary transition-colors">
                            <Github className="w-5 h-5" />
                        </a>
                        <a href="https://linkedin.com/company/tryminime" target="_blank" rel="noreferrer" aria-label="LinkedIn"
                            className="text-text-muted hover:text-blue-500 transition-colors">
                            <Linkedin className="w-5 h-5" />
                        </a>
                        <a href="https://discord.gg/minime" target="_blank" rel="noreferrer" aria-label="Discord"
                            className="text-text-muted hover:text-indigo-500 transition-colors">
                            <MessageSquare className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
