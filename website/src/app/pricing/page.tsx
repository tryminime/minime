'use client';

import { useState } from 'react';
import Link from 'next/link';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Check, Zap, Sparkles, Building2, HelpCircle } from 'lucide-react';

export default function PricingPage() {
    const [annual, setAnnual] = useState(true);

    return (
        <div className="min-h-screen bg-gray-50 selection:bg-indigo-100 selection:text-indigo-900">
            <MarketingNav />

            <main>
                {/* Header */}
                <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 text-center max-w-4xl mx-auto">
                    <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">Invest in your intelligence</h1>
                    <p className="text-xl text-gray-600 mb-10">Start free. Upgrade when your graph grows. Pay only for what you need.</p>

                    {/* Toggle */}
                    <div className="inline-flex items-center p-1.5 bg-gray-200/50 rounded-xl">
                        <button
                            onClick={() => setAnnual(false)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${!annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setAnnual(true)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${annual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            Annually <span className="ml-1 text-xs text-green-600 font-bold tracking-wide uppercase">-20%</span>
                        </button>
                    </div>
                </section>

                {/* Pricing Cards */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                        {/* Free */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-6">
                                <Sparkles className="w-6 h-6 text-gray-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                            <p className="text-gray-500 text-sm mb-6 h-10">Forever free local tracking. Perfect for individuals.</p>
                            <div className="mb-6">
                                <span className="text-5xl font-black text-gray-900">$0</span>
                                <span className="text-gray-500">/month</span>
                            </div>
                            <Link href="/auth/login" className="block w-full py-3 px-4 bg-gray-900 text-white text-center font-medium rounded-xl hover:bg-gray-800 transition mb-8">
                                Get Started
                            </Link>
                            <ul className="space-y-4 text-sm text-gray-600 font-medium">
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Local Desktop App</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Basic Knowledge Graph</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> 7-day History</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Community Support</li>
                            </ul>
                        </div>

                        {/* Pro */}
                        <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-2xl relative transform md:-translate-y-4">
                            <div className="absolute top-0 right-8 transform -translate-y-1/2">
                                <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
                            </div>
                            <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-6 border border-gray-700">
                                <Zap className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                            <p className="text-gray-400 text-sm mb-6 h-10">Unlimited history and advanced AI insights.</p>
                            <div className="mb-6">
                                <span className="text-5xl font-black text-white">${annual ? '15' : '19'}</span>
                                <span className="text-gray-400">/month</span>
                            </div>
                            <Link href="/auth/login?upgrade=pro" className="block w-full py-3 px-4 bg-indigo-600 text-white text-center font-medium rounded-xl hover:bg-indigo-700 transition mb-8 shadow-lg shadow-indigo-900/50">
                                Start 14-day Free Trial
                            </Link>
                            <ul className="space-y-4 text-sm text-gray-300 font-medium">
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Everything in Free</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Unlimited Tracking History</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Advanced AI Copilot</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Cross-device Cloud Sync</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-400 flex-shrink-0" /> Priority Email Support</li>
                            </ul>
                        </div>

                        {/* Enterprise */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                <Building2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                            <p className="text-gray-500 text-sm mb-6 h-10">Custom deployment and team aggregations.</p>
                            <div className="mb-6">
                                <span className="text-5xl font-black text-gray-900">Custom</span>
                            </div>
                            <Link href="/contact" className="block w-full py-3 px-4 bg-gray-50 text-gray-900 text-center font-medium rounded-xl border border-gray-200 hover:bg-gray-100 transition mb-8">
                                Contact Sales
                            </Link>
                            <ul className="space-y-4 text-sm text-gray-600 font-medium">
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Self-hosted Options</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Team Privacy Controls</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Custom Integrations</li>
                                <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 flex-shrink-0" /> Dedicated Account Manager</li>
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Feature Comparison Table */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pb-24">
                    <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Compare Plans</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-200">
                                    <th className="py-4 px-6 font-semibold text-gray-900 w-1/3">Features</th>
                                    <th className="py-4 px-6 font-semibold text-gray-900 text-center w-1/5">Free</th>
                                    <th className="py-4 px-6 font-semibold text-indigo-600 text-center w-1/5 bg-indigo-50/30 rounded-t-xl">Pro</th>
                                    <th className="py-4 px-6 font-semibold text-gray-900 text-center w-1/5">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {[
                                    ['Desktop Tracking', true, true, true],
                                    ['Browser Extensions', true, true, true],
                                    ['Data History', '7 Days', 'Unlimited', 'Unlimited'],
                                    ['Knowledge Graph Nodes', '100', 'Unlimited', 'Unlimited'],
                                    ['AI Chat Copilot', false, true, true],
                                    ['Cloud Sync', false, true, true],
                                    ['Custom Themes', false, true, true],
                                    ['SAML / SSO', false, false, true],
                                    ['Priority Support', false, 'Email', '24/7 Phone + Email'],
                                ].map((row, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="py-4 px-6 font-medium text-gray-700">{row[0]}</td>
                                        <td className="py-4 px-6 text-center text-gray-500">
                                            {typeof row[1] === 'boolean' ? (row[1] ? <Check className="w-5 h-5 mx-auto text-green-500" /> : '-') : row[1]}
                                        </td>
                                        <td className="py-4 px-6 text-center text-indigo-900 bg-indigo-50/30 font-medium">
                                            {typeof row[2] === 'boolean' ? (row[2] ? <Check className="w-5 h-5 mx-auto text-indigo-600" /> : '-') : row[2]}
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-500">
                                            {typeof row[3] === 'boolean' ? (row[3] ? <Check className="w-5 h-5 mx-auto text-green-500" /> : '-') : row[3]}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* FAQs in Pricing */}
                <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-32">
                    <div className="flex items-center gap-3 justify-center mb-10">
                        <HelpCircle className="w-8 h-8 text-gray-400" />
                        <h2 className="text-2xl font-bold text-gray-900">Billing FAQs</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-2">What happens when my 14-day Pro trial ends?</h4>
                            <p className="text-gray-600 text-sm">If you don't enter a payment method, your account will automatically downgrade to the Free plan. You won't be charged, but you'll lose access to history beyond 7 days.</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-2">Can I switch from monthly to annual later?</h4>
                            <p className="text-gray-600 text-sm">Yes, you can upgrade to annual billing at any time from your dashboard settings. Your unused monthly balance will be prorated.</p>
                        </div>
                    </div>
                    <div className="text-center mt-8">
                        <Link href="/faq" className="text-indigo-600 font-medium hover:underline text-sm">Read all FAQs &rarr;</Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
