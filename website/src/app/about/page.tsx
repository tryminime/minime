import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { Target, Shield, Heart, Code2, Database, Globe } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-bg-base">
            <MarketingNav />

            <main>
                {/* Hero */}
                <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 bg-elevated/30 border-b border-border">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl font-extrabold text-text-primary tracking-tight mb-6">Building a better memory for people who work digitally.</h1>
                        <p className="text-xl text-text-secondary leading-relaxed mb-10">Human attention is finite. MiniMe exists to help you understand where it actually goes, so you can direct it more honestly.</p>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-text-primary mb-6">Our Story</h2>
                            <div className="space-y-4 text-lg text-text-secondary leading-relaxed">
                                <p>We used to work across a dozen apps and tabs every day. At the end of the week, we&apos;d lost track of what we actually shipped. Time trackers felt like surveillance. AI tools needed your data in the cloud.</p>
                                <p>So we built something that stays on your machine and learns how you work. We didn't stop at an MVP. Over intense development sprints, we've delivered a full 14-module platform with over 150 features.</p>
                                <p>Today, the desktop app watches active windows. The browser extensions track web activity locally. We extract entities, build a unified Neo4j knowledge graph, and provide a fully integrated RAG AI Assistant that you can talk to right now — no waitlists, no "coming soon" tags.</p>
                                <p>The data is yours. You can export it, delete it, or self-host the whole stack. That&apos;s not a feature, it&apos;s the foundation.</p>
                            </div>
                        </div>
                        <div className="bg-subdued rounded-3xl aspect-square relative overflow-hidden flex items-center justify-center border border-border">
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-50 dark:from-indigo-900/40 dark:to-purple-900/40 opacity-50" />
                            <div className="w-64 h-64 border border-border rounded-full flex items-center justify-center bg-bg-base shadow-xl relative z-10">
                                <Image src="/icon.png" alt="MiniMe" width={100} height={100} className="opacity-80 drop-shadow-lg rounded-3xl" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Tech Stack */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 border-y border-border bg-bg-surface">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-bold text-text-primary text-center mb-12">How it&apos;s built</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-bg-base border border-border rounded-2xl">
                                <Code2 className="w-7 h-7 text-orange-500 mb-4" />
                                <h3 className="text-lg font-bold text-text-primary mb-2">Desktop App</h3>
                                <p className="text-text-secondary text-sm">Built with Tauri and Rust. Runs natively on macOS, Windows, and Linux. Under 40MB RAM, less than 1% CPU in the background.</p>
                            </div>
                            <div className="p-6 bg-bg-base border border-border rounded-2xl">
                                <Database className="w-7 h-7 text-indigo-500 mb-4" />
                                <h3 className="text-lg font-bold text-text-primary mb-2">Backend</h3>
                                <p className="text-text-secondary text-sm">FastAPI on Python 3.10+. PostgreSQL for relational data, Qdrant for vector embeddings, Neo4j for the knowledge graph. JWT auth throughout.</p>
                            </div>
                            <div className="p-6 bg-bg-base border border-border rounded-2xl">
                                <Globe className="w-7 h-7 text-cyan-500 mb-4" />
                                <h3 className="text-lg font-bold text-text-primary mb-2">Browser Extensions</h3>
                                <p className="text-text-secondary text-sm">Chrome MV3, Firefox MV2, and Edge. Each extension batches activity locally before syncing. Content extraction runs as a content script, not in the background.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="py-24 bg-[#111111] dark:bg-black/50 text-white dark:text-text-primary px-4 sm:px-6 lg:px-8 border-y border-border">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-16">Core beliefs</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Shield className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Privacy is the default</h3>
                                <p className="text-gray-400 leading-relaxed">Your data is your property. We don&apos;t sell it, we don&apos;t train on it, and you can delete everything with one click — including your account and all associated records.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Target className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Built for the individual</h3>
                                <p className="text-gray-400 leading-relaxed">MiniMe is a tool for you, not for your employer. There are no manager dashboards, no team surveillance features, and no reports that leave your control.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Heart className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Honest about what we are</h3>
                                <p className="text-gray-400 leading-relaxed">We&apos;re a small team. We ship real features, document what&apos;s actually built, and say no to inflated claims. The changelog is accurate. The docs match the code.</p>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <Footer />
        </div>
    );
}
