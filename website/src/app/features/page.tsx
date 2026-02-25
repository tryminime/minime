import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Activity, Lock, Network, Brain, Zap, Blocks, Target, CalendarDays, BarChart3, Database } from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
    const features = [
        {
            title: 'Automatic Activity Tracking',
            description: 'MiniMe runs silently in the background, capturing active window titles, application usage, and browser URLs without manual entry.',
            icon: <Activity className="w-6 h-6 text-indigo-500" />
        },
        {
            title: 'Local-First Privacy Architecture',
            description: 'Your raw data never leaves your machine. Processing happens via local LLMs before hitting our secure cloud environment—ensuring complete privacy.',
            icon: <Lock className="w-6 h-6 text-purple-500" />
        },
        {
            title: 'Semantic Knowledge Graph',
            description: 'We convert your raw activity logs into an interactive, visual graph mapping your projects, skills, documents, and people you worked with.',
            icon: <Network className="w-6 h-6 text-blue-500" />
        },
        {
            title: 'Personal AI Copilot',
            description: 'Chat with your work history. Ask "What did I work on last Tuesday?" or "Summarize my contributions to the React migration project."',
            icon: <Brain className="w-6 h-6 text-pink-500" />
        },
        {
            title: 'Productivity Analytics',
            description: 'Understand your deep work vs shallow work ratio. Get insights on what times of day you are most productive and what apps distract you the most.',
            icon: <BarChart3 className="w-6 h-6 text-orange-500" />
        },
        {
            title: 'Skill Development Tracking',
            description: 'MiniMe automatically infers the skills you are using from the applications and code you interact with, building a real-time portfolio.',
            icon: <Zap className="w-6 h-6 text-yellow-500" />
        }
    ];

    const deepDives = [
        {
            title: 'The Local-First Architecture',
            description: 'We built MiniMe around a core principle: your work data is highly sensitive. By utilizing a local FastAPI backend and SQLite database bundled inside the desktop application, we ensure raw logs (like specific document titles or chat snippets) remain on your hard drive. Only aggregated, anonymized insights are optionally synced if you choose to enable cloud features.',
            icon: <Database className="w-8 h-8 text-slate-700" />
        },
        {
            title: 'Entity Extraction via Local Models',
            description: 'MiniMe integrates directly with Ollama, downloading small, highly-optimized open-source LLMs (like Llama 3 8B) straight to your machine. These models run locally to extract projects, organizations, and concepts from your activity stream, mapping them into the Knowledge Graph securely.',
            icon: <Blocks className="w-8 h-8 text-slate-700" />
        },
        {
            title: 'Goal & Sprint Alignment',
            description: 'For engineers and product teams, MiniMe can cross-reference your actual daily activity against your stated Jira tickets or personal goals. The "Focus Score" metric gives you a daily evaluation of how closely your time expenditure aligned with your high-priority targets.',
            icon: <Target className="w-8 h-8 text-slate-700" />
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <MarketingNav />

            <main>
                {/* Header */}
                <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 text-center bg-gray-50 border-b border-gray-100">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">Intelligence from every idle moment.</h1>
                        <p className="text-xl text-gray-600">MiniMe isn’t just a time tracker. It’s an automated intelligence layer sitting on top of your daily workflows.</p>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-sm font-semibold text-indigo-600 tracking-wide uppercase">Core Capabilities</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">Everything you need to understand your work</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {features.map((feature, idx) => (
                            <div key={idx} className="relative group p-8 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all">
                                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-50 mb-6 group-hover:scale-110 transition-transform">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Deep Dives */}
                <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Under the hood</h2>
                            <p className="text-lg text-gray-400 max-w-2xl">We engineered MiniMe from the ground up to solve the hardest problems in personal intelligence: data privacy and context extraction.</p>
                        </div>

                        <div className="space-y-16">
                            {deepDives.map((dive, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex-shrink-0 w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                        <div className="text-white">
                                            {dive.icon}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold mb-4">{dive.title}</h3>
                                        <p className="text-gray-400 text-lg leading-relaxed max-w-4xl">{dive.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-24 text-center px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-6">Experience the difference</h2>
                    <div className="flex justify-center gap-4">
                        <Link href="/install" className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition shadow-lg">Download App</Link>
                        <Link href="/docs" className="px-8 py-4 bg-gray-50 text-gray-900 font-semibold rounded-xl border border-gray-200 hover:bg-gray-100 transition">Read the Docs</Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
