import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { TrendingUp, Users, Target, ArrowRight, MapPin, Mail } from 'lucide-react';

export default function InvestorsPage() {
    return (
        <div className="min-h-screen bg-bg-surface">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-bold rounded-full uppercase tracking-wide mb-6">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Seed Round
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-text-primary tracking-tight mb-6">Building the intelligence layer for how people actually work.</h1>
                        <p className="text-xl text-text-secondary">MiniMe is a privacy-first personal AI platform. It runs locally, learns from your daily activity, and gives you a knowledge graph you own — not a cloud company.</p>
                    </div>

                    {/* Traction Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                        <div className="bg-bg-base p-8 rounded-3xl border border-border/50 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="text-4xl font-black text-text-primary mb-2">Beta</div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">Early Access Phase</h3>
                            <p className="text-text-muted text-sm leading-relaxed">Desktop app, web dashboard, and browser extensions are live. Currently in closed beta with active users across the US and Europe.</p>
                        </div>

                        <div className="bg-bg-base p-8 rounded-3xl border border-border/50 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6">
                                <TrendingUp className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="text-4xl font-black text-text-primary mb-2">14</div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">Dashboard Views Built</h3>
                            <p className="text-text-muted text-sm leading-relaxed">Activities, knowledge graph, AI chat, wellness, skills, goals, career, collaboration, productivity, and more — all shipped.</p>
                        </div>

                        <div className="bg-bg-base p-8 rounded-3xl border border-border/50 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-6">
                                <Target className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="text-4xl font-black text-text-primary mb-2">$47B</div>
                            <h3 className="text-lg font-bold text-text-primary mb-2">Addressable Market</h3>
                            <p className="text-text-muted text-sm leading-relaxed">The intersection of personal productivity software, enterprise people analytics, and AI copilots is one of the largest emerging categories.</p>
                        </div>
                    </div>

                    {/* Investment Thesis */}
                    <div className="bg-gray-900 rounded-[3rem] p-10 md:p-20 text-white relative overflow-hidden mb-16">
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/20 to-transparent blur-3xl pointer-events-none" />

                        <div className="relative z-10 max-w-3xl">
                            <h2 className="text-4xl font-bold mb-8">The thesis</h2>
                            <div className="space-y-8 text-lg text-gray-300 leading-relaxed">
                                <p>
                                    <strong className="text-white">The problem:</strong> Time-tracking and employee monitoring software is universally despised. It measures mouse clicks, not cognitive output. It serves employers, not people.
                                </p>
                                <p>
                                    <strong className="text-white">The approach:</strong> MiniMe is built for the individual first. Data lives locally, encrypted on their machine. There is no employer dashboard, no surveillance mode. The product earns trust by putting the user in control — which is exactly why adoption is organic.
                                </p>
                                <p>
                                    <strong className="text-white">The business:</strong> Free local access drives adoption. Pro subscriptions unlock cloud sync, unlimited history, and full AI capabilities. Enterprise tiers provide high-level anonymized team insights — without exposing individual data.
                                </p>
                            </div>

                            <div className="mt-12 pt-12 border-t border-gray-800">
                                <a href="mailto:invest@tryminime.com" className="inline-flex items-center px-8 py-4 bg-bg-base text-text-primary font-bold rounded-xl hover:bg-elevated transition shadow-xl">
                                    Request Pitch Deck <ArrowRight className="w-5 h-5 ml-2" />
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-bg-base border border-border rounded-3xl flex items-start gap-4">
                            <MapPin className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-text-primary mb-1">Headquarters</h3>
                                <p className="text-text-secondary text-sm">MiniMe Technologies, Inc.<br />San Francisco, CA 94107<br />United States</p>
                            </div>
                        </div>
                        <div className="p-8 bg-bg-base border border-border rounded-3xl flex items-start gap-4">
                            <Mail className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-text-primary mb-1">Investor inquiries</h3>
                                <p className="text-text-secondary text-sm mb-3">Reach out directly — no gatekeeping, no IR team.</p>
                                <a href="mailto:invest@tryminime.com" className="text-indigo-500 hover:underline text-sm font-medium">invest@tryminime.com</a>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
