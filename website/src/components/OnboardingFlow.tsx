'use client';

import { useState } from 'react';
import { Rocket, Plug, Shield, CheckCircle2, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

interface OnboardingFlowProps {
    onComplete: () => void;
}

const steps = [
    {
        id: 'welcome',
        title: 'Welcome to MiniMe',
        subtitle: 'Your privacy-first activity intelligence platform',
        icon: Rocket,
        content: (
            <div className="space-y-4 text-center">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
                    MiniMe helps you understand your work patterns, boost productivity,
                    and develop skills — all while keeping your data completely private.
                </p>
                <div className="grid grid-cols-3 gap-4 pt-4">
                    {[
                        { label: 'Activity Tracking', value: 'Automatic' },
                        { label: 'AI Insights', value: 'Real-time' },
                        { label: 'Data Privacy', value: '100% Local' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            className="p-4 rounded-xl text-center"
                            style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                        >
                            <p className="text-lg font-semibold" style={{ color: 'var(--color-accent)' }}>{item.value}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--color-muted)' }}>{item.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        id: 'connect',
        title: 'Connect Your Tools',
        subtitle: 'Get richer insights by connecting your favorite tools',
        icon: Plug,
        content: (
            <div className="space-y-3">
                {[
                    { name: 'Desktop App', desc: 'Track application usage and screenshots', recommended: true },
                    { name: 'Browser Extension', desc: 'Monitor web browsing patterns', recommended: true },
                    { name: 'GitHub', desc: 'Import commits and pull requests', recommended: false },
                    { name: 'Google Calendar', desc: 'Sync meetings and scheduling data', recommended: false },
                ].map((tool) => (
                    <div
                        key={tool.name}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{tool.name}</p>
                                {tool.recommended && (
                                    <span
                                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                        style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--color-accent)' }}
                                    >
                                        Recommended
                                    </span>
                                )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{tool.desc}</p>
                        </div>
                        <button
                            className="px-3 py-1.5 text-xs font-medium rounded-lg"
                            style={{ background: 'var(--color-accent)', color: '#fff' }}
                        >
                            Connect
                        </button>
                    </div>
                ))}
                <p className="text-xs text-center pt-2" style={{ color: 'var(--color-muted)' }}>
                    You can always connect more tools later from Settings → Integrations
                </p>
            </div>
        ),
    },
    {
        id: 'privacy',
        title: 'Your Privacy Matters',
        subtitle: 'Choose how your data is handled',
        icon: Shield,
        content: (
            <div className="space-y-4">
                {[
                    {
                        title: 'Local Processing',
                        desc: 'All data is processed on your device. Nothing is sent to external servers.',
                        enabled: true,
                    },
                    {
                        title: 'End-to-End Encryption',
                        desc: 'Your stored data is encrypted with AES-256 encryption.',
                        enabled: true,
                    },
                    {
                        title: 'PII Auto-Filtering',
                        desc: 'Personal information (emails, phone numbers) is automatically redacted.',
                        enabled: true,
                    },
                    {
                        title: 'Anonymous Analytics',
                        desc: 'Help improve MiniMe by sharing anonymized usage statistics.',
                        enabled: false,
                    },
                ].map((setting) => (
                    <div
                        key={setting.title}
                        className="flex items-center justify-between p-4 rounded-xl"
                        style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                    >
                        <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{setting.title}</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>{setting.desc}</p>
                        </div>
                        <div
                            className="w-10 h-6 rounded-full transition-colors flex-shrink-0 flex items-center px-0.5"
                            style={{ background: setting.enabled ? 'var(--color-accent)' : 'var(--color-border)' }}
                        >
                            <div
                                className="w-5 h-5 rounded-full bg-white transition-transform"
                                style={{ transform: setting.enabled ? 'translateX(16px)' : 'translateX(0)' }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        ),
    },
    {
        id: 'done',
        title: 'You\'re All Set!',
        subtitle: 'Start exploring your activity insights',
        icon: CheckCircle2,
        content: (
            <div className="text-center space-y-6">
                <div
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(34,197,94,0.1)' }}
                >
                    <CheckCircle2 className="w-10 h-10" style={{ color: 'var(--color-success)' }} />
                </div>
                <div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
                        Your MiniMe workspace is ready. The desktop app is tracking your activity,
                        and insights will appear as data is collected.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                        { label: 'View Dashboard', desc: 'See your activity overview' },
                        { label: 'AI Chat', desc: 'Ask questions about your data' },
                        { label: 'Graph Explorer', desc: 'Visualize your knowledge graph' },
                        { label: 'Weekly Digest', desc: 'Get weekly summaries' },
                    ].map((action) => (
                        <div
                            key={action.label}
                            className="p-3 rounded-xl cursor-pointer transition-all"
                            style={{ background: 'var(--color-shell)', border: '1px solid var(--color-border)' }}
                        >
                            <p className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>{action.label}</p>
                            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>{action.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const step = steps[currentStep];
    const Icon = step.icon;
    const isLast = currentStep === steps.length - 1;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
        >
            <div
                className="w-full max-w-lg rounded-2xl overflow-hidden"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
                {/* Progress bar */}
                <div className="h-1" style={{ background: 'var(--color-border)' }}>
                    <div
                        className="h-full transition-all duration-500"
                        style={{
                            width: `${((currentStep + 1) / steps.length) * 100}%`,
                            background: 'var(--color-accent)',
                        }}
                    />
                </div>

                {/* Header */}
                <div className="p-6 pb-4 text-center">
                    <div
                        className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: 'rgba(99,102,241,0.1)' }}
                    >
                        <Icon className="w-7 h-7" style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <h2 className="text-xl font-semibold" style={{ color: 'var(--color-primary)' }}>
                        {step.title}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                        {step.subtitle}
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">{step.content}</div>

                {/* Navigation */}
                <div
                    className="flex items-center justify-between p-6 pt-4"
                    style={{ borderTop: '1px solid var(--color-border)' }}
                >
                    {currentStep > 0 ? (
                        <button
                            onClick={() => setCurrentStep((s) => s - 1)}
                            className="flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-lg"
                            style={{ color: 'var(--color-secondary)' }}
                        >
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>
                    ) : (
                        <button
                            onClick={onComplete}
                            className="text-sm px-4 py-2 rounded-lg"
                            style={{ color: 'var(--color-muted)' }}
                        >
                            Skip
                        </button>
                    )}

                    {/* Step dots */}
                    <div className="flex gap-1.5">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className="w-2 h-2 rounded-full transition-all"
                                style={{
                                    background: i === currentStep ? 'var(--color-accent)' : 'var(--color-border)',
                                    width: i === currentStep ? '16px' : '8px',
                                }}
                            />
                        ))}
                    </div>

                    <button
                        onClick={() => (isLast ? onComplete() : setCurrentStep((s) => s + 1))}
                        className="flex items-center gap-1 text-sm font-medium px-5 py-2 rounded-lg text-white"
                        style={{ background: 'var(--color-accent)' }}
                    >
                        {isLast ? 'Get Started' : 'Next'}
                        {isLast ? <ArrowRight className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
