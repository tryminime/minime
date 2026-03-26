'use client';

import { Lock, Shield, ArrowRight, Activity, Database, Sparkles, BarChart3, Cloud } from 'lucide-react';
import { useState, useEffect } from 'react';

const ACTIVITIES = [
    'Word · Q3_Report.docx',
    'Chrome · Marketing Plan',
    'Slack · #general',
    'Excel · Financial_Model_v2.xlsx',
    'Figma · Redesign V2',
];

export function BentoGrid() {
    const [activeItem, setActiveItem] = useState(0);

    useEffect(() => {
        const int = setInterval(() => {
            setActiveItem((prev) => (prev + 1) % ACTIVITIES.length);
        }, 2500);
        return () => clearInterval(int);
    }, []);

    return (
        <div className="py-24 bg-bg-base relative">
            {/* Background glow for bento section */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        Everything you need. <br className="hidden md:block" /> Nothing you don't.
                    </h2>
                    <p className="text-text-secondary text-lg">
                        A comprehensive suite of tools built specifically for makers who value their time and privacy.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 md:gap-6 auto-rows-[300px]">

                    {/* Card A: Auto Tracking (Wide) */}
                    <div className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 shadow-soft hover:shadow-[0_8px_30px_rgba(99,102,241,0.1)] p-8 flex flex-col md:flex-row gap-8">
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                                <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary mb-2">Passive Auto-Tracking</h3>
                            <p className="text-text-secondary">MiniMe logs your active window, browser tabs, and IDE files without ever needing a start/stop button.</p>
                        </div>
                        {/* Interactive Element */}
                        <div className="flex-1 bg-bg-base/50 rounded-2xl border border-border p-4 flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-bg-base/50 to-transparent z-10 pointer-events-none" />
                            <div className="space-y-3 relative z-0">
                                {ACTIVITIES.map((act, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${idx === activeItem
                                                ? 'bg-elevated border-indigo-500/30 opacity-100 translate-x-0'
                                                : 'bg-transparent border-transparent opacity-40 translate-x-4'
                                            }`}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${idx === activeItem ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]' : 'bg-gray-400'}`} />
                                        <span className="font-mono text-sm text-text-primary">{act}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Card B: Privacy */}
                    <div className="group relative overflow-hidden rounded-[2rem] bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border hover:border-green-500/30 transition-all duration-300 hover:-translate-y-1 shadow-soft hover:shadow-[0_8px_30px_rgba(16,185,129,0.1)] p-8 flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mb-4">
                            <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">Local-First Privacy</h3>
                        <p className="text-text-secondary text-sm mb-6">Your data encrypted entirely on your machine. We couldn't read it even if we wanted to.</p>

                        <div className="mt-auto relative w-full aspect-square max-h[120px] rounded-2xl bg-bg-base border border-border flex items-center justify-center group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                            <Shield className="w-12 h-12 text-border group-hover:text-green-500 transition-colors duration-500" />
                            <div className="absolute inset-0 border-2 border-green-500 rounded-2xl scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500" />
                        </div>
                    </div>

                    {/* Card C: Knowledge Graph */}
                    <div className="md:col-span-1 group relative overflow-hidden rounded-[2rem] bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border hover:border-purple-500/30 transition-all duration-300 hover:-translate-y-1 shadow-soft hover:shadow-[0_8px_30px_rgba(168,85,247,0.1)] p-8 flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center mb-4 relative z-10">
                            <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2 relative z-10">Connect the Dots</h3>
                        <p className="text-text-secondary text-sm relative z-10">Watch your 3D Knowledge Graph naturally group your Slack messages, document edits, and calendar events into clusters based on your actual behavior.</p>

                        {/* SVG Node Graph Mockup */}
                        <div className="absolute -bottom-10 -right-10 w-64 h-64 text-purple-500/20 group-hover:text-purple-500/40 transition-colors">
                            <svg viewBox="0 0 100 100" className="w-full h-full fill-current stroke-current">
                                <circle cx="50" cy="50" r="8" className="animate-pulse" />
                                <circle cx="20" cy="30" r="4" />
                                <circle cx="80" cy="40" r="5" />
                                <circle cx="30" cy="80" r="6" />
                                <circle cx="70" cy="80" r="4" />
                                <line x1="50" y1="50" x2="20" y2="30" strokeWidth="1" className="opacity-50" />
                                <line x1="50" y1="50" x2="80" y2="40" strokeWidth="1" className="opacity-50" />
                                <line x1="50" y1="50" x2="30" y2="80" strokeWidth="1" className="opacity-50" />
                                <line x1="50" y1="50" x2="70" y2="80" strokeWidth="1" className="opacity-50" />
                                <line x1="20" y1="30" x2="30" y2="80" strokeWidth="1" className="opacity-30" />
                                <line x1="80" y1="40" x2="70" y2="80" strokeWidth="1" className="opacity-30" />
                            </svg>
                        </div>
                    </div>

                    {/* Card D: AI Copilot */}
                    <div className="md:col-span-1 group relative overflow-hidden rounded-[2rem] bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border hover:border-cyan-500/30 transition-all duration-300 hover:-translate-y-1 shadow-soft hover:shadow-[0_8px_30px_rgba(34,211,238,0.1)] p-8 flex flex-col">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center mb-4">
                            <Sparkles className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">Converse with your History</h3>
                        <p className="text-text-secondary text-sm mb-6">Talk to your voice-enabled Productivity Coach and extend its capabilities with agentic plugins.</p>

                        <div className="mt-auto space-y-3">
                            <div className="bg-bg-base border border-border rounded-lg p-3 rounded-br-none max-w-[85%] ml-auto shadow-sm">
                                <p className="text-xs text-text-primary">What did I work on yesterday?</p>
                            </div>
                            <div className="bg-elevated border border-border rounded-lg p-3 rounded-bl-none max-w-[95%] shadow-sm overflow-hidden relative">
                                {/* Typing line effect on hover */}
                                <div className="absolute top-0 left-0 w-1 p-3 flex flex-col gap-1 items-center justify-center h-full bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-0.5 h-full bg-cyan-500"></div>
                                </div>
                                <p className="text-xs text-text-secondary pl-2 group-hover:text-text-primary transition-colors">
                                    You spent 4 hours on the Q3 Report in Word and had a 1hr meet with Sarah.
                                </p>
                                <div className="w-1.5 h-3 bg-cyan-500 inline-block ml-1 animate-pulse mt-1" />
                            </div>
                        </div>
                    </div>

                    {/* Card E & F Stacked horizontally via flex on mobile, or 1 col on desktop... wait it's a 3x2 grid. Let's make the last one a split card or just one card */}
                    <div className="md:col-span-1 flex flex-col gap-4 md:gap-6">
                        {/* Card E: Analytics */}
                        <div className="flex-1 group relative overflow-hidden rounded-[2rem] bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-1 shadow-soft hover:shadow-[0_8px_30px_rgba(249,115,22,0.1)] p-6 flex items-center">
                            <div>
                                <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center mb-2">
                                    <BarChart3 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-lg font-bold text-text-primary mb-1">Beyond Time Tracking</h3>
                                <p className="text-text-secondary text-xs">ML Predictive Forecasting predicts tomorrow's productivity based on your sleep, breaks, and deep focus streaks.</p>
                            </div>
                            <div className="ml-auto w-16 h-16 flex items-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                <div className="w-3 bg-orange-500/40 rounded-t-sm h-1/3 group-hover:h-2/3 transition-all duration-500 delay-75" />
                                <div className="w-3 bg-orange-500/60 rounded-t-sm h-1/2 group-hover:h-full transition-all duration-500 delay-150" />
                                <div className="w-3 bg-orange-500 rounded-t-sm h-3/4 group-hover:h-4/5 transition-all duration-500 delay-200" />
                            </div>
                        </div>

                        {/* Card F: Cloud Sync */}
                        <div className="flex-1 group relative overflow-hidden rounded-[2rem] bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 shadow-soft hover:shadow-[0_8px_30px_rgba(59,130,246,0.1)] p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex flex-shrink-0 items-center justify-center">
                                    <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:-translate-y-1 transition-transform" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary mb-1">E2E Cloud Sync</h3>
                                    <p className="text-text-secondary text-xs">Encrypted backup to Google Drive. Restore your full graph on any device without any manual setup.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
