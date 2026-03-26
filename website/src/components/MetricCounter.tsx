'use client';

import { useEffect, useState, useRef } from 'react';

// Easing function: ease-out cubic
const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

function useCountUp(end: number, duration: number = 1500, trigger: boolean) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!trigger) return;

        let startTime: number | null = null;
        let animationFrame: number;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const rawPercentage = Math.min(progress / duration, 1);
            const easedPercentage = easeOutCubic(rawPercentage);

            setCount(Math.floor(easedPercentage * end));

            if (progress < duration) {
                animationFrame = requestAnimationFrame(animate);
            } else {
                setCount(end); // Ensure we end exactly on the target
            }
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [end, duration, trigger]);

    return count;
}

function Metric({ value, suffix, label, delay, isVisible, prefix = '' }: { value: number, suffix: string, label: string, delay: number, isVisible: boolean, prefix?: string }) {
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => setShouldAnimate(true), delay);
            return () => clearTimeout(timer);
        }
    }, [isVisible, delay]);

    const count = useCountUp(value, 1500, shouldAnimate);

    return (
        <div className={`flex flex-col border-t border-indigo-500/30 pt-4 transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-4xl md:text-5xl font-display font-bold text-text-primary mb-1">
                {prefix}{value === 0 && !shouldAnimate ? '0' : count}{suffix}
            </div>
            <div className="text-sm text-text-muted font-medium uppercase tracking-wider">
                {label}
            </div>
        </div>
    );
}

export function MetricCounter() {
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
        <div className="py-24 bg-bg-surface border-y border-border" ref={containerRef}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
                    <Metric value={73} prefix="" suffix="+" label="built features" delay={0} isVisible={isVisible} />
                    <Metric value={3} prefix="" suffix="" label="desktop platforms" delay={100} isVisible={isVisible} />
                    <Metric value={14} prefix="" suffix="+" label="dashboard views" delay={200} isVisible={isVisible} />
                    <Metric value={100} prefix="" suffix="%" label="local processing" delay={300} isVisible={isVisible} />
                </div>

                <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <blockquote className="text-xl md:text-2xl font-medium text-text-primary italic leading-relaxed mb-6">
                        "MiniMe is the only tool that actually gets smarter about ME, not just my calendar."
                    </blockquote>
                    <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                            JH
                        </div>
                        <div className="text-left flex flex-col">
                            <span className="font-bold text-text-primary text-sm">J. Hoffmann</span>
                            <span className="text-text-muted text-xs">Staff Eng @ Stripe</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
