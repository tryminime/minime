import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

const FOOTER_LINKS = {
    Product: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Installation', href: '/install' },
        { label: 'Changelog', href: '/changelog' },
    ],
    Developers: [
        { label: 'API Reference', href: '/docs' },
        { label: 'Whitepaper', href: '/whitepaper' },
        { label: 'GitHub', href: 'https://github.com/tryminime' },
    ],
    Company: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Investors', href: '/investors' },
        { label: 'Contact', href: '/contact' },
        { label: 'FAQ', href: '/faq' },
    ],
    Legal: [
        { label: 'Privacy Policy', href: '/legal/privacy' },
        { label: 'Terms of Service', href: '/legal/terms' },
    ],
};

export default function Footer() {
    return (
        <footer className="bg-gray-950 text-gray-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
                {/* Top section */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2.5 mb-4">
                            <Image src="/icon.png" alt="MiniMe" width={32} height={32} className="rounded-lg" />
                            <span className="text-xl font-bold text-white">MiniMe</span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-6 text-gray-400">
                            Intelligence from action. MiniMe turns your daily work into
                            deep personal insights — privately, locally, automatically.
                        </p>
                        <div className="flex items-center gap-3">
                            <a href="https://github.com/tryminime" target="_blank" rel="noreferrer" aria-label="GitHub"
                                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="https://twitter.com/tryminime" target="_blank" rel="noreferrer" aria-label="Twitter"
                                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="https://linkedin.com/company/tryminime" target="_blank" rel="noreferrer" aria-label="LinkedIn"
                                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                            <a href="mailto:hello@tryminime.com" aria-label="Email"
                                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
                                <Mail className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(FOOTER_LINKS).map(([category, links]) => (
                        <div key={category}>
                            <h4 className="text-sm font-semibold text-white mb-4">{category}</h4>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.href}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-gray-400 hover:text-white transition-colors"
                                            {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
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
                <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                        © 2025 MiniMe Technologies, Inc. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-900/30 text-green-400 text-xs rounded-full border border-green-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            All systems operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
