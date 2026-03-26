'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Check, Zap, Sparkles, Building2, HelpCircle, ShieldCheck, Heart, ArrowRight, Minus, Lock } from 'lucide-react';

const FAQS = [
    {
        q: "How does the local-first privacy model work?",
        a: "All your activity data—window titles, browser tabs, and application usage—is captured and stored locally in an encrypted SQLite database on your machine. We never send raw data to our servers."
    },
    {
        q: "Can I delete my data?",
        a: "Yes. Since your data is stored locally, you have full control. You can delete specific timeframes, clear the entire database, or use the 'Forget Mode' which pauses tracking for a set period."
    },
    {
        q: "Do you offer refunds?",
        a: "Absolutely. We offer a 30-day no-questions-asked money-back guarantee on all Pro annual and monthly subscriptions."
    },
    {
        q: "Can I self-host the cloud sync infrastructure?",
        a: "Yes, Enterprise customers receive Docker containers and Kubernetes manifests to self-host the entirety of the sync and backup infrastructure on their own AWS/GCP/Azure environments."
    },
    {
        q: "Is there an API available?",
        a: "Both Free and Pro plans include full HTTP and WebSocket access to your local MiniMe instance, allowing you to query your own knowledge graph or pipe data into other tools like Obsidian."
    },
    {
        q: "Does it slow down my computer?",
        a: "No. MiniMe is written in Rust and typically consumes less than 40MB of RAM and <1% CPU in the background. Generating insights via the local LLM will temporarily use more resources."
    },
    {
        q: "What happens after the 14-day Pro trial?",
        a: "You will not be charged unless you explicitly subscribe. Your account automatically gracefully downgrades to the Free plan, retaining all local data up to 7 days."
    },
    {
        q: "Can my employer see my data?",
        a: "No. The data is locally encrypted. Even on company machines, without your password, the SQLite database cannot be decrypted. MiniMe is designed for the individual, not the employer."
    }
];

export default function PricingPage() {
    const [annual, setAnnual] = useState(true);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    return (
        <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
            <MarketingNav />

            <main>
                {/* Header */}
                <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
                    <h1 className="text-display-h1 font-display font-bold tracking-tight mb-6">Invest in your <span className="text-gradient">intelligence</span></h1>
                    <p className="text-xl text-text-secondary mb-10 max-w-2xl mx-auto">Start free. Upgrade when your graph grows. Pay only for what you need.</p>

                    {/* Toggle */}
                    <div className="inline-flex items-center p-1.5 bg-elevated border border-border rounded-xl relative">
                        <div
                            className="absolute inset-y-1.5 w-[calc(50%-6px)] bg-indigo-600 rounded-lg transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-sm"
                            style={{ transform: annual ? 'translateX(calc(100% + 4px))' : 'translateX(2px)' }}
                        />
                        <button
                            onClick={() => setAnnual(false)}
                            className={`w-36 relative z-10 px-2 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center ${!annual ? 'text-white' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setAnnual(true)}
                            className={`w-36 relative z-10 px-2 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${annual ? 'text-white' : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            Annually
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${annual ? 'bg-indigo-500 text-white' : 'bg-green-500/20 text-green-500'}`}>
                                -20%
                            </span>
                        </button>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                        {/* Free */}
                        <div className="bg-bg-surface rounded-3xl p-8 border border-border shadow-soft hover:-translate-y-1 transition-transform">
                            <div className="w-12 h-12 bg-elevated rounded-xl flex items-center justify-center mb-6">
                                <Sparkles className="w-6 h-6 text-text-secondary" />
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary mb-2 flex items-center justify-between">
                                Free
                                <span className="text-xs font-semibold px-2 py-1 bg-green-500/10 text-green-500 rounded-md">No credit card required</span>
                            </h3>
                            <p className="text-text-secondary text-sm mb-6 h-10">Forever free local tracking. Perfect for individuals.</p>
                            <div className="mb-6 h-[72px] flex items-end">
                                <span className="text-5xl font-black text-text-primary">$0</span>
                                <span className="text-text-muted mb-1 ml-1">/month</span>
                            </div>
                            <Link href="/install" className="block w-full py-3 px-4 bg-elevated text-text-primary border border-border text-center font-medium rounded-xl hover:bg-border transition-colors mb-4">
                                Download Free
                            </Link>
                            <p className="text-center text-xs text-text-muted font-medium mb-6">12,847 people on Free plan</p>

                            <ul className="space-y-4 text-sm text-text-secondary font-medium border-t border-border pt-6">
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Local Desktop App</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Basic Knowledge Graph</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 7-day History</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Community Support</li>
                            </ul>
                        </div>

                        {/* Pro */}
                        <div className="bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.15)] relative transform md:-translate-y-4 flex flex-col">
                            {/* Ribbons */}
                            <div className="absolute -top-4 inset-x-0 flex justify-center">
                                <span className="bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                                    <Heart className="w-3.5 h-3.5" /> Most loved
                                </span>
                            </div>
                            <div className="absolute top-4 right-4 rotate-12 origin-top-right">
                                <span className="bg-green-500 text-white text-[10px] uppercase font-bold py-1 px-3 shadow-md rounded-sm whitespace-nowrap">
                                    30-Day Money Back
                                </span>
                            </div>

                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
                                <Zap className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary mb-2">Pro</h3>
                            <p className="text-text-secondary text-sm mb-6 h-10">Unlimited history, sync, and advanced AI insights.</p>

                            <div className="mb-6 h-[72px] flex items-end relative overflow-hidden">
                                <span className="text-5xl font-black text-text-primary inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                                    <span className={`absolute bottom-0 transition-all duration-500 ${annual ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0'}`}>$15</span>
                                    <span className={`absolute bottom-0 transition-all duration-500 ${!annual ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>$19</span>
                                    {/* Dummy spacer */}
                                    <span className="invisible">$19</span>
                                </span>
                                <span className="text-text-muted mb-1 ml-1">/month</span>
                            </div>
                            <Link href="/auth/register?plan=pro" className="group block w-full py-3 px-4 bg-indigo-600 text-white text-center font-medium rounded-xl hover:bg-indigo-500 transition-colors mb-8 shadow-lg shadow-indigo-500/25">
                                <span className="flex items-center justify-center gap-2">
                                    Start 14-day Free Trial <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>

                            <ul className="space-y-4 text-sm text-text-primary font-medium border-t border-border pt-6">
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Everything in Free</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Unlimited Tracking History</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Advanced AI Copilot</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Cross-device Cloud Sync</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Priority Email Support</li>
                            </ul>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-bg-surface rounded-3xl p-8 border border-border shadow-soft transition-transform relative flex flex-col">
                            {/* Coming Soon Ribbon */}
                            <div className="absolute -top-4 inset-x-0 flex justify-center">
                                <span className="bg-text-muted/20 text-text-primary text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm backdrop-blur-md border border-border">
                                    Coming June 2026
                                </span>
                            </div>

                            <div className="w-12 h-12 bg-elevated rounded-xl flex items-center justify-center mb-6 mt-2">
                                <Building2 className="w-6 h-6 text-text-secondary" />
                            </div>
                            <h3 className="text-2xl font-bold text-text-muted mb-2">Enterprise</h3>
                            <p className="text-text-muted text-sm mb-6 h-10">Custom deployment and team aggregations.</p>
                            <div className="mb-6 h-[72px] flex items-end">
                                <span className="text-4xl font-black text-text-muted">Waitlist</span>
                            </div>
                            <Link href="/contact" className="block w-full py-3 px-4 bg-transparent border border-border text-center font-medium rounded-xl hover:bg-elevated text-text-muted hover:text-text-primary transition mb-8 mt-6">
                                Join Waitlist
                            </Link>
                            <ul className="space-y-4 text-sm text-text-secondary font-medium border-t border-border pt-6">
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Self-hosted Options</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Team Privacy Controls</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Custom Integrations</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Dedicated Account Manager</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Trust Badges */}
                <section className="py-8 mb-16 border-y border-border bg-bg-surface">
                    <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16 items-center text-text-muted text-sm font-semibold tracking-wide uppercase">
                        <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Zero raw cloud storage</span>
                        <span className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> GDPR Ready</span>
                        <span className="flex items-center gap-2"><Lock className="w-5 h-5" /> Local-first</span>
                        <span className="flex items-center gap-2"><Terminal className="w-5 h-5" /> Self-hostable</span>
                    </div>
                </section>

                {/* Feature Comparison Table */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-24">
                    <h2 className="text-3xl font-display font-bold text-text-primary mb-10 text-center">Compare features</h2>
                    <div className="overflow-x-auto rounded-2xl border border-border bg-bg-surface shadow-soft">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border bg-elevated/50">
                                    <th className="py-4 px-6 font-semibold text-text-primary w-1/3">Features</th>
                                    <th className="py-4 px-6 font-semibold text-text-primary text-center w-1/5">Free</th>
                                    <th className="py-4 px-6 font-semibold text-indigo-500 text-center w-1/5">Pro</th>
                                    <th className="py-4 px-6 font-semibold text-text-primary text-center w-1/5">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {[
                                    ['Desktop Tracking', true, true, true],
                                    ['Browser Extensions', true, true, true],
                                    ['Social Media & Video Tracking', true, true, true],
                                    ['Data History', '7 Days', 'Unlimited', 'Unlimited'],
                                    ['Semantic Knowledge Graph', 'Basic', 'Advanced', 'Organization'],
                                    ['Local HTTP API', true, true, true],
                                    ['RAG AI Copilot', false, true, true],
                                    ['Local LLM Support', false, true, true],
                                    ['Cloud Sync', false, true, true],
                                    ['Custom Themes', false, true, true],
                                    ['SAML / SSO', false, false, true],
                                    ['Priority Support', false, 'Email', '24/7 Priority'],
                                ].map((row, i) => (
                                    <tr key={i} className="border-b border-border/50 hover:bg-elevated/30 transition-colors">
                                        <td className="py-4 px-6 font-medium text-text-primary">{row[0]}</td>
                                        <td className="py-4 px-6 text-center text-text-secondary">
                                            {typeof row[1] === 'boolean' ? (row[1] ? <Check className="w-5 h-5 mx-auto text-text-secondary" /> : <Minus className="w-4 h-4 mx-auto text-text-muted" />) : row[1]}
                                        </td>
                                        <td className="py-4 px-6 text-center text-indigo-400 bg-indigo-500/5 font-medium border-x border-indigo-500/10">
                                            {typeof row[2] === 'boolean' ? (row[2] ? <Check className="w-5 h-5 mx-auto text-indigo-500" /> : <Minus className="w-4 h-4 mx-auto text-indigo-500/30" />) : row[2]}
                                        </td>
                                        <td className="py-4 px-6 text-center text-text-secondary">
                                            {typeof row[3] === 'boolean' ? (row[3] ? <Check className="w-5 h-5 mx-auto text-text-secondary" /> : <Minus className="w-4 h-4 mx-auto text-text-muted" />) : row[3]}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* FAQs */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-32" id="faq">
                    <div className="flex flex-col items-center mb-12">
                        <div className="w-12 h-12 bg-elevated rounded-xl flex items-center justify-center mb-4">
                            <HelpCircle className="w-6 h-6 text-text-primary" />
                        </div>
                        <h2 className="text-3xl font-display font-bold text-text-primary">Frequently Asked Questions</h2>
                    </div>

                    <div className="space-y-4">
                        {FAQS.map((faq, i) => (
                            <div key={i} className="bg-bg-surface border border-border rounded-xl overflow-hidden transition-colors hover:border-indigo-500/30">
                                <button
                                    className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none"
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                >
                                    <span className="font-semibold text-text-primary pr-8">{faq.q}</span>
                                    <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                                </button>
                                <div
                                    className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === i ? 'pb-5 max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <p className="text-sm text-text-secondary leading-relaxed">{faq.a}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

// Ensure ChevronDown & Terminal are imported
import { ChevronDown, Terminal } from 'lucide-react';
