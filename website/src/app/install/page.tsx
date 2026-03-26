'use client';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Terminal, Download, Monitor, CheckCircle2, Copy, Check, ChevronRight, Chrome, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Platform = 'mac' | 'windows' | 'linux';

export default function InstallPage() {
    const [platform, setPlatform] = useState<Platform>('mac');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    useEffect(() => {
        const ua = window.navigator.userAgent.toLowerCase();
        if (ua.indexOf('win') > -1) setPlatform('windows');
        else if (ua.indexOf('linux') > -1) setPlatform('linux');
        else setPlatform('mac');
    }, []);

    const copy = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const instructions: Record<Platform, string[]> = {
        mac: [
            'Download the .dmg file from our releases page.',
            'Open the downloaded file and drag MiniMe into your Applications folder.',
            'Launch MiniMe from Spotlight or the Applications folder.',
            'Grant Accessibility and Screen Recording permissions when prompted. These are required to capture active window titles.',
        ],
        windows: [
            'Download the .exe installer from our releases page.',
            'Run the installer and follow the setup wizard.',
            'Launch MiniMe from the Start menu.',
            'A system tray icon confirms MiniMe is running in the background.',
        ],
        linux: [
            'Download the .AppImage or .deb package.',
            'Make the AppImage executable: chmod +x MiniMe*.AppImage',
            'Run the application directly or install the .deb via your package manager.',
            'Requires libwebkit2gtk-4.0-37 for the Tauri runtime.',
        ],
    };

    const blocks = [
        {
            id: 'clone',
            label: '# Clone the repository',
            command: `git clone https://github.com/tryminime/minime.git
cd minime`,
            color: 'text-indigo-300',
        },
        {
            id: 'backend',
            label: '# Start the backend',
            command: `cd backend
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
fastapi dev main.py`,
            color: 'text-emerald-400',
        },
        {
            id: 'frontend',
            label: '# In a new terminal — start the desktop app',
            command: `cd desktop
npm install
npm run tauri dev`,
            color: 'text-purple-400',
        },
    ];

    const extensions = [
        { name: 'Chrome & Brave', store: 'Chrome Web Store', status: 'live', href: '#' },
        { name: 'Firefox', store: 'Firefox Add-ons', status: 'live', href: '#' },
        { name: 'Edge', store: 'Microsoft Edge Add-ons', status: 'live', href: '#' },
        { name: 'Safari', store: 'App Store', status: 'coming-soon', href: null },
    ];

    return (
        <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
            <MarketingNav />

            <main>
                {/* Header */}
                <section className="pt-40 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-bg-surface to-bg-base border-b border-border">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-display-h1 font-display font-bold tracking-tight mb-6">Install <span className="text-gradient">Extensions</span></h1>
                        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-6">Browser extensions to capture your web reading habits safely and privately.</p>
                        <Link href="/download" className="text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1.5 transition-colors group">
                            Looking for the Desktop App? <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                </section>

                {/* Browser Extensions */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <Chrome className="w-8 h-8 text-indigo-500" />
                        <h2 className="text-3xl font-display font-bold text-text-primary">Browser Extensions</h2>
                    </div>
                    <p className="text-text-secondary mb-10">The extension securely tracks web activity, including deep work on documents/PDFs, read time, and contextual categorization of social media and video streaming. All data batches locally before syncing. No keystroke logging, no form data.</p>


                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {extensions.map((ext) => (
                            <div key={ext.name} className={`p-6 border rounded-[2xl] flex flex-col items-center text-center transition-colors ${ext.status === 'live' ? 'border-border bg-elevated hover:border-indigo-500/30' : 'border-border/50 bg-bg-surface opacity-60'}`}>
                                <div className="w-12 h-12 bg-bg-base border border-border rounded-xl mb-4 flex items-center justify-center shadow-soft">
                                    {ext.status === 'live'
                                        ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                                        : <Globe className="w-6 h-6 text-text-muted" />}
                                </div>
                                <h3 className="font-bold text-text-primary mb-1">{ext.name}</h3>
                                <p className="text-xs text-text-muted mb-4">{ext.store}</p>
                                {ext.status === 'live' && ext.href ? (
                                    <a href={ext.href} className="w-full px-3 py-2 bg-indigo-600 text-white font-medium rounded-lg text-sm hover:bg-indigo-500 transition text-center">
                                        Add to browser
                                    </a>
                                ) : (
                                    <span className="w-full px-3 py-2 text-center text-text-muted text-sm border border-border/50 rounded-lg">Coming soon</span>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Build from Source */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-border mb-20">
                    <div className="flex items-center gap-3 mb-8">
                        <Terminal className="w-8 h-8 text-text-primary" />
                        <h2 className="text-3xl font-display font-bold text-text-primary">Build from Source</h2>
                    </div>
                    <p className="text-text-secondary mb-8">Requires Rust, Node.js 18+, and Python 3.10+.</p>

                    <div className="bg-[#0d0d1f] rounded-3xl p-8 border border-border shadow-soft space-y-6 relative">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-40">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                        {blocks.map((block) => (
                            <div key={block.id} className="relative group/code">
                                <button
                                    onClick={() => copy(block.command, block.id)}
                                    className="absolute right-2 top-2 p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-colors opacity-0 group-hover/code:opacity-100"
                                >
                                    {copiedId === block.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <pre className={`text-sm font-mono overflow-x-auto whitespace-pre ${block.color}`}>
                                    <code>
                                        <span className="text-slate-500">{block.label}</span>{'\n'}
                                        {block.command}
                                    </code>
                                </pre>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
