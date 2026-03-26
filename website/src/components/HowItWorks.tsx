'use client';

import { Download, Cpu, Sparkles, Database } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const steps = [
    {
        icon: Download,
        title: '1. Passive Capture',
        desc: 'Tauri app and browser extensions run in the background. No manual entry. No timers.',
        color: 'from-indigo-500 to-indigo-600',
        bgLight: 'bg-indigo-50 dark:bg-indigo-500/10',
        ring: 'ring-indigo-100 dark:ring-indigo-500/20',
    },
    {
        icon: Cpu,
        title: '2. AI Enrichment',
        desc: 'Local NLP pipeline extracts entities, deduplicates concepts, and classifies your work automatically.',
        color: 'from-purple-500 to-purple-600',
        bgLight: 'bg-purple-50 dark:bg-purple-500/10',
        ring: 'ring-purple-100 dark:ring-purple-500/20',
    },
    {
        icon: Database,
        title: '3. Graph Intelligence',
        desc: 'Neo4j maps relationships between your files, meetings, and topics to build your digital brain.',
        color: 'from-cyan-500 to-cyan-600',
        bgLight: 'bg-cyan-50 dark:bg-cyan-500/10',
        ring: 'ring-cyan-100 dark:ring-cyan-500/20',
    },
    {
        icon: Sparkles,
        title: '4. AI Assistant',
        desc: 'Chat with your local knowledge graph using RAG or let agentic plugins work on your behalf.',
        color: 'from-orange-500 to-orange-600',
        bgLight: 'bg-orange-50 dark:bg-orange-500/10',
        ring: 'ring-orange-100 dark:ring-orange-500/20',
    }
];

export function HowItWorks() {
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="py-24 bg-bg-base relative overflow-hidden" ref={containerRef}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        How MiniMe works
                    </h2>
                    <p className="text-text-secondary text-lg">
                        No manual entry. No timers to start mapping. Just do your work, and we handle the intelligence.
                    </p>
                </div>

                <div className="relative">
                    {/* Animated connection line for desktop */}
                    <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-border z-0">
                        <div
                            className={`h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 w-full origin-left transition-transform duration-1000 ease-out ${isVisible ? 'scale-x-100' : 'scale-x-0'}`}
                        />
                        {/* Moving dash effect overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_50%,var(--bg-base)_50%,var(--bg-base)_100%)] bg-[length:20px_100%] animate-scroll-x" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative z-10">
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col items-center text-center transition-all duration-700 ease-out transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
                                style={{ transitionDelay: `${idx * 200}ms` }}
                            >
                                {/* Number Badge */}
                                <div className="mb-6 relative">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${step.color} shadow-lg text-white ring-8 ${step.ring} ${step.bgLight}`}>
                                        <step.icon className="w-6 h-6" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-bg-base border-2 border-border flex items-center justify-center text-xs font-bold text-text-primary">
                                        {idx + 1}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-text-primary mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-text-secondary leading-relaxed max-w-sm">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
}
