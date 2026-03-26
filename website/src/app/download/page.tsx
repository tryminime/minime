'use client';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Download, Monitor, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

type Platform = 'mac' | 'windows' | 'linux';

export default function DownloadPage() {
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
            'Download the .dmg file from our releases.',
            'Open the downloaded file and drag MiniMe into your Applications folder.',
            'Launch MiniMe from Spotlight or the Applications folder.',
            'Grant Accessibility and Screen Recording permissions when prompted. These are required to capture active window titles.',
        ],
        windows: [
            'Download the .exe installer from our releases.',
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

    return (
        <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
            <MarketingNav />

            <main>
                {/* Header */}
                <section className="pt-40 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-bg-surface to-bg-base border-b border-border">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="w-16 h-16 bg-elevated rounded-2xl flex items-center justify-center mx-auto mb-6 border border-border">
                            <Download className="w-8 h-8 text-indigo-500" />
                        </div>
                        <h1 className="text-display-h1 font-display font-bold tracking-tight mb-6">Download <span className="text-gradient">MiniMe Desktop</span></h1>
                        <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-8">The core engine for your personal intelligence. Native speed, local-first privacy, zero data collection.</p>
                        
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted font-medium">
                            <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-green-500" /> AES-256 Encrypted</span>
                            <span className="flex items-center gap-2"><Monitor className="w-4 h-4 text-indigo-500" /> Native Tauri 2.0 App</span>
                            <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> No cloud sync by default</span>
                        </div>
                    </div>
                </section>

                {/* Main Download Section */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="bg-bg-surface rounded-[2rem] border border-border shadow-soft overflow-hidden">
                        <div className="flex border-b border-border">
                            {(['mac', 'windows', 'linux'] as Platform[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPlatform(p)}
                                    className={`flex-1 py-4 text-sm font-semibold transition-colors ${platform === p ? 'text-indigo-400 border-b-2 border-indigo-500 bg-indigo-500/5' : 'text-text-secondary hover:bg-elevated/50'}`}
                                >
                                    {p === 'mac' ? 'macOS' : p === 'windows' ? 'Windows' : 'Linux'}
                                </button>
                            ))}
                        </div>

                        <div className="p-8 md:p-12 relative overflow-hidden">
                            <div className="flex flex-col md:flex-row gap-12 items-start justify-between">
                                <div className="flex-1 space-y-8">
                                    <h3 className="text-2xl font-bold">
                                        {platform === 'mac' ? 'macOS' : platform === 'windows' ? 'Windows' : 'Linux'} specific setup
                                    </h3>
                                    <div className="space-y-6">
                                        {instructions[platform].map((step, idx) => (
                                            <div key={idx} className="flex gap-4 group">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold flex-shrink-0 border border-indigo-500/20 group-hover:scale-110 transition-transform">{idx + 1}</div>
                                                <p className="text-text-secondary leading-relaxed pt-1">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="pt-6 border-t border-border flex items-center gap-3">
                                        <p className="text-sm text-text-muted">Need the browser extensions instead?</p>
                                        <Link href="/install" className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 group">
                                            Go to Extensions <ExternalLink className="w-3 h-3 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="w-full md:w-80 flex-shrink-0 bg-elevated rounded-2xl p-8 border border-border text-center hover:border-indigo-500/30 transition-colors group shadow-sm flex flex-col items-center">
                                    <div className="w-20 h-20 bg-bg-surface rounded-2xl shadow-sm border border-border flex items-center justify-center mx-auto mb-6 group-hover:-translate-y-2 group-hover:shadow-[0_10px_40px_-10px_rgba(99,102,241,0.5)] transition-all duration-300 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent" />
                                        <Download className="w-10 h-10 text-indigo-500 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-text-primary mb-2">Download v0.2.0</h3>
                                    <p className="text-sm text-text-muted mb-8">Universal Binary • 42 MB</p>
                                    <a
                                        href="https://github.com/tryminime/minime/releases/latest"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full py-4 px-6 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-1 active:translate-y-0 active:scale-95 duration-200"
                                    >
                                        Get Latest Release
                                    </a>
                                    <p className="text-xs text-text-muted mt-4">Downloads directly from GitHub Releases</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Build from source CTA for nerds */}
                <section className="py-12 px-4 border-t border-border flex justify-center">
                   <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-elevated border border-border hover:border-indigo-500/30 transition-colors">
                      <Terminal className="w-5 h-5 text-text-muted" />
                      <span className="text-sm text-text-secondary">Want to build from source instead?</span>
                      <Link href="/docs#build-from-source" className="text-sm font-semibold text-indigo-400 hover:text-indigo-300">Read the guide</Link>
                   </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
