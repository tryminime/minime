'use client';

import { Star } from 'lucide-react';

const testimonials = [
    {
        quote: "I finally understand where my time actually goes. Game changer for sprint planning.",
        name: "Alex Kim",
        role: "Senior SWE",
        initials: "AK",
        color: "from-blue-400 to-blue-600"
    },
    {
        quote: "The privacy model sold me immediately. My browsing stays on my machine.",
        name: "Priya R.",
        role: "Security Lead",
        initials: "PR",
        color: "from-green-400 to-green-600",
        featured: true
    },
    {
        quote: "MiniMe's weekly digest is the only report I actually read on Friday.",
        name: "Marcus T.",
        role: "CTO",
        initials: "MT",
        color: "from-purple-400 to-purple-600"
    },
    {
        quote: "It caught that I spend 30% of my week context switching between Slack and Jira. I've since time-blocked those.",
        name: "Sarah Jenkins",
        role: "Product Manager",
        initials: "SJ",
        color: "from-orange-400 to-orange-600"
    },
    {
        quote: "The local-first AI is snappy. Generating a standup report takes literally 2 seconds. No cloud latency.",
        name: "David Chen",
        role: "Frontend Engineer",
        initials: "DC",
        color: "from-pink-400 to-pink-600"
    }
];

export function TestimonialCarousel() {
    return (
        <div className="py-24 bg-bg-base overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-text-primary mb-4">
                        Loved by builders
                    </h2>
                    <p className="text-text-secondary text-lg">
                        Join 10,000+ people who've taken back control of their focus.
                    </p>
                </div>

                {/* Mobile Swipe Container */}
                <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-8 -mx-4 px-4">
                    {testimonials.map((t, i) => (
                        <div
                            key={i}
                            className="snap-center shrink-0 w-[85vw] max-w-[320px] bg-elevated/50 backdrop-blur-md border border-border p-6 rounded-2xl flex flex-col"
                        >
                            <div className="flex gap-1 text-indigo-500 mb-4">
                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                            </div>
                            <p className="text-text-primary font-medium text-lg leading-snug mb-6 flex-1">
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-3 mt-auto">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">{t.name}</p>
                                    <p className="text-xs text-text-muted">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Masonry Layout */}
                <div className="hidden md:block columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {testimonials.map((t, i) => (
                        <div
                            key={i}
                            className="break-inside-avoid bg-white/5 dark:bg-[#0d0d1f]/60 backdrop-blur-xl border border-border hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 p-6 lg:p-8 rounded-3xl shadow-soft flex flex-col"
                        >
                            <div className="flex gap-1 text-indigo-500 mb-4">
                                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-4 h-4 fill-current" />)}
                            </div>
                            <p className={`text-text-primary font-medium ${t.featured ? 'text-xl' : 'text-lg'} leading-relaxed mb-6 flex-1`}>
                                "{t.quote}"
                            </p>
                            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-border/50">
                                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-text-primary">{t.name}</p>
                                    <p className="text-xs text-text-muted">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
