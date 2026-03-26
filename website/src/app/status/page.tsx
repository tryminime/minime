'use client';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { CheckCircle2, Monitor, Globe, Server } from 'lucide-react';

const COMPONENTS = [
    {
        name: 'Desktop App',
        description: 'Tauri/Rust background daemon',
        detail: 'Activity tracking runs locally on your machine. No external dependency.',
        icon: Monitor,
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
    },
    {
        name: 'Backend API',
        description: 'FastAPI at localhost:8000',
        detail: 'Processes activity data, runs knowledge graph enrichment, serves the dashboard.',
        icon: Server,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
    },
    {
        name: 'Web Dashboard',
        description: 'Next.js at localhost:3000',
        detail: 'Your full analytics interface — activities, graph, chat, wellness, and more.',
        icon: Globe,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
    },
    {
        name: 'Chrome & Brave Extension',
        description: 'Chrome Web Store',
        detail: 'Tracks tab activity locally before syncing to the backend.',
        icon: Globe,
        color: 'text-green-500',
        bg: 'bg-green-500/10',
    },
    {
        name: 'Firefox Extension',
        description: 'Firefox Add-ons',
        detail: 'Self-contained MV2 extension with background.js tracking.',
        icon: Globe,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
    },
    {
        name: 'Edge Extension',
        description: 'Microsoft Edge Add-ons',
        detail: 'Mirrors the Chrome extension with Edge-specific packaging.',
        icon: Globe,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
    },
];

export default function StatusPage() {
    return (
        <div className="min-h-screen bg-bg-base text-text-primary">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-16 text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-sm font-semibold mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            All components operational
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-4">Status</h1>
                        <p className="text-xl text-text-secondary max-w-xl mx-auto">MiniMe runs locally on your machine — this page documents the active components and their current maintenance status.</p>
                    </div>

                    <div className="space-y-4 mb-16">
                        {COMPONENTS.map((comp) => (
                            <div key={comp.name} className="flex items-center gap-6 p-6 bg-bg-surface border border-border rounded-2xl hover:border-indigo-500/20 transition-colors">
                                <div className={`w-12 h-12 ${comp.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                                    <comp.icon className={`w-6 h-6 ${comp.color}`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-text-primary">{comp.name}</h3>
                                        <span className="text-xs text-text-muted">{comp.description}</span>
                                    </div>
                                    <p className="text-sm text-text-secondary">{comp.detail}</p>
                                </div>
                                <div className="flex items-center gap-2 text-green-500 flex-shrink-0">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-semibold">Live</span>
                                </div>
                            </div>
                        ))}
                        {/* Safari placeholder */}
                        <div className="flex items-center gap-6 p-6 bg-bg-surface border border-border/50 rounded-2xl opacity-50">
                            <div className="w-12 h-12 bg-gray-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Globe className="w-6 h-6 text-text-muted" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-text-primary">Safari Extension</h3>
                                    <span className="text-xs text-text-muted">App Store</span>
                                </div>
                                <p className="text-sm text-text-secondary">In development. MV3 API constraints on Safari require a separate implementation.</p>
                            </div>
                            <span className="text-xs font-semibold px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-full">In Progress</span>
                        </div>
                    </div>

                    <div className="p-8 bg-bg-surface border border-border rounded-3xl text-center">
                        <h2 className="text-xl font-bold text-text-primary mb-2">Something not working?</h2>
                        <p className="text-text-secondary text-sm mb-4">File an issue on GitHub or reach out directly.</p>
                        <a href="mailto:support@tryminime.com" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition text-sm">
                            Contact support
                        </a>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
