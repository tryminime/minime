import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { TrendingUp, Users, Target, Lock, ArrowRight } from 'lucide-react';

export default function InvestorsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full uppercase tracking-wide mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Series A Fundraising Active
                        </div>
                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">Invest in the future of work intelligence.</h1>
                        <p className="text-xl text-gray-600">MiniMe is pioneering the Local-First Enterprise Intelligence category. We're replacing invasive employee surveillance with empowering, private-by-design personal AI.</p>
                    </div>

                    {/* Traction Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="text-4xl font-black text-gray-900 mb-2">55k+</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Active Users</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">Grew organically from 0 to 55,000+ engineers, designers, and PMs in 5 months. Excellent retention curves.</p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                <TrendingUp className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="text-4xl font-black text-gray-900 mb-2">56</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Net Promoter Score</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">Exceptionally high NPS for a productivity tool, driven by our fierce commitment to user privacy and local-first data ownership.</p>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                <Target className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="text-4xl font-black text-gray-900 mb-2">$47B</div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Addressable Market</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">The intersection of Enterprise Performance Management, BI, and AI Copilots. Companies are desperate for data-driven insights.</p>
                        </div>
                    </div>

                    {/* Investment Thesis */}
                    <div className="bg-gray-900 rounded-[3rem] p-10 md:p-20 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-600/20 to-transparent blur-3xl pointer-events-none" />

                        <div className="relative z-10 max-w-3xl">
                            <h2 className="text-4xl font-bold mb-8">The Investment Thesis</h2>
                            <div className="space-y-8 text-lg text-gray-300 leading-relaxed">
                                <p>
                                    <strong className="text-white">The Problem:</strong> The traditional "time-tracking" and "employee monitoring" software market is universally hated by employees. It creates perverse incentives, destroys morale, and only measures superficial metrics (like mouse clicks), failing entirely to measure <em>cognitive output</em>.
                                </p>
                                <p>
                                    <strong className="text-white">The Solution:</strong> MiniMe flips the paradigm. By building a tool that strictly serves the employee first—using local LLMs to guarantee privacy—we achieve unprecedented adoption rates.
                                </p>
                                <p>
                                    <strong className="text-white">The Business Model:</strong> Once individual adoption reaches critical mass within an organization, we sell Enterprise aggregation licenses. These licenses provide leadership with high-level anonymized insights (e.g., "Engineering spent 40% of time on maintenance this week") without ever exposing individual worker data.
                                </p>
                            </div>

                            <div className="mt-12 pt-12 border-t border-gray-800">
                                <a href="mailto:invest@tryminime.com" className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition shadow-xl">
                                    Request Full Pitch Deck <ArrowRight className="w-5 h-5 ml-2" />
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
