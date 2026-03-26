'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronDown, Monitor, Shield, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

export function HeroSection() {
    const [currentImage, setCurrentImage] = useState(0);
    const images = [
        '/mockups/1.png',
        '/mockups/2.png',
        '/mockups/3.png',
        '/mockups/4.png',
        '/mockups/5.png',
        '/mockups/6.png',
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImage((prev) => (prev + 1) % images.length);
        }, 3500);
        return () => clearInterval(timer);
    }, [images.length]);

    return (
        <div className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
            {/* Background Orbs & Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10 bg-bg-base overflow-hidden">
                {/* Animated Gradient Blob */}
                <div
                    className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] animate-float opacity-30 dark:opacity-20 blur-[100px] rounded-full"
                    style={{ background: 'var(--grad-hero)' }}
                />
                {/* Dot pattern overlaid on top, using data URI for dot grid */}
                <div
                    className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                    style={{ backgroundImage: 'radial-gradient(circle, var(--accent-indigo) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />
                {/* Bottom Fade Mask */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-base via-bg-base/60 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center text-center">
                {/* Pill Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-elevated/50 backdrop-blur-md mb-8 animate-fade-up">
                    <span className="flex h-2 w-2">
                        <span className="animate-ping relative inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    <span className="text-sm font-medium text-text-primary tracking-wide">
                        Powered by 73+ built Personal Intelligence features.
                    </span>
                </div>

                {/* Headline */}
                <h1 className="text-display-h1 font-display font-bold leading-[1.05] tracking-tight mb-6 animate-fade-up [animation-delay:80ms] max-w-4xl mx-auto text-balance">
                    The <span className="text-gradient">intelligence engine</span><br />
                    for your digital life.
                </h1>

                {/* Subline */}
                <p className="text-lg md:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-8 animate-fade-up [animation-delay:160ms] text-balance">
                    MiniMe quietly maps your focus, skills, and knowledge into a private, local-first graph. No timers. No manual tagging. Just insights.
                </p>

                {/* Data Sources Row */}
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-10 animate-fade-up [animation-delay:200ms]">
                    {['macOS', 'Windows', 'Linux', 'Chrome', 'Firefox', 'Edge', 'Neo4j'].map(source => (
                        <span key={source} className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-bg-surface text-text-muted">
                            {source}
                        </span>
                    ))}
                </div>

                {/* CTA Row */}
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 animate-fade-up [animation-delay:240ms]">
                    <Link
                        href="/download"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-text-primary text-bg-base text-base font-semibold rounded-full hover:scale-105 transition-all shadow-[0_0_40px_rgba(99,102,241,0.2)] dark:shadow-none hover:shadow-[0_0_40px_rgba(99,102,241,0.4)]"
                    >
                        <Monitor className="w-5 h-5" />
                        Download App
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                        href="/auth/login"
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 border border-border bg-elevated hover:bg-elevated/80 text-text-primary text-base font-semibold rounded-full transition-colors"
                    >
                        Open Dashboard
                    </Link>
                </div>

                {/* Trust Line */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-text-muted font-medium mb-16 animate-fade-up [animation-delay:320ms]">
                    <div className="flex gap-1 text-yellow-500">
                        {[1, 2, 3, 4, 5].map(i => <span key={i}>★</span>)}
                    </div>
                    <span className="hidden sm:inline">·</span>
                    <span>Trusted by 10,000+ people</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> No credit card</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Privacy-first</span>
                </div>

                {/* Product Screenshot */}
                <div className="w-full max-w-6xl mx-auto relative rounded-[2rem] p-2 bg-white/5 dark:bg-white/5 border border-border backdrop-blur-sm shadow-2xl shadow-indigo-900/50 animate-fade-up [animation-delay:400ms]">
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-border/50">
                        {images.map((img, index) => (
                            <Image
                                key={img}
                                src={img}
                                alt={`MiniMe Dashboard Preview ${index + 1}`}
                                fill
                                className={`object-contain transition-opacity duration-1000 ease-in-out ${index === currentImage ? 'opacity-100' : 'opacity-0 z-0'}`}
                                priority={index === 0}
                            />
                        ))}

                        {/* Overlay Gradient to blend bottom into next section */}
                        <div className="absolute inset-x-0 bottom-0 h-[10%] bg-gradient-to-t from-bg-base to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce text-text-muted mt-12 hidden md:block">
                    <ChevronDown className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
