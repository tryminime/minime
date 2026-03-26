import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Shield, HardDrive, Lock, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-bg-base text-text-primary">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-16">
                        <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                            <Shield className="w-7 h-7 text-green-500" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-4">Privacy, without the fine print.</h1>
                        <p className="text-xl text-text-secondary leading-relaxed">Here is exactly what MiniMe collects, where it goes, and how you control it. No legalese.</p>
                        <p className="text-sm text-text-muted mt-4">Last updated March 2026</p>
                    </div>

                    <div className="space-y-10">

                        {/* What we track */}
                        <section className="p-8 bg-bg-surface border border-border rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Eye className="w-6 h-6 text-indigo-500" />
                                <h2 className="text-2xl font-bold text-text-primary">What we track</h2>
                            </div>
                            <div className="space-y-3 text-text-secondary">
                                <p className="font-semibold text-text-primary mb-4">The desktop app captures:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    {[
                                        'Active application name and window title',
                                        'Focus session start and end times',
                                        'Browser tab URLs and page titles',
                                        'Raw keystroke volume and mouse clicks (speed, not content)',
                                        'Opt-in periodic screenshots (encrypted locally)',
                                        'Git commit metadata (project, file count)',
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-2 p-3 bg-elevated rounded-xl">
                                            <span className="text-green-500 mt-0.5 text-xs">✓</span>
                                            <span className="text-sm">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* What we don't collect */}
                        <section className="p-8 bg-bg-surface border border-border rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <EyeOff className="w-6 h-6 text-red-600 dark:text-red-400" />
                                <h2 className="text-2xl font-bold text-text-primary">Our hard boundaries</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                {[
                                    'Actual keys typed (Strict No-Keylogging)',
                                    'Microphone audio or webcam feeds',
                                    'IP addresses or physical location telemetry',
                                    'System clipboard data or file contents',
                                    'Data from default private/incognito windows',
                                    'Unredacted passwords, SSNs, or API Keys',
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 p-3 bg-elevated rounded-xl">
                                        <span className="text-red-600 dark:text-red-400 mt-0.5 text-xs">✗</span>
                                        <span className="text-sm text-text-secondary">{item}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-text-secondary leading-relaxed bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-xl">
                                <p><strong>Note on exact data:</strong> While we capture your typing <em>speed</em> to calculate focus metrics, we never record the characters you type. If you opt into tracking screenshots, they are AES-256 encrypted using keys that never leave your device. Our local PII filters automatically redact text matching credit cards, API keys, and standard password patterns before text processing occurs.</p>
                            </div>
                        </section>

                        {/* Where it lives */}
                        <section className="p-8 bg-bg-surface border border-border rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <HardDrive className="w-6 h-6 text-purple-500" />
                                <h2 className="text-2xl font-bold text-text-primary">Where your data lives</h2>
                            </div>
                            <div className="space-y-4 text-text-secondary">
                                <div className="p-4 bg-elevated rounded-xl">
                                    <h3 className="font-semibold text-text-primary mb-1">On your machine</h3>
                                    <p className="text-sm">The desktop app stores activity strictly in a local SQLite database. Nothing leaves your machine. Your graph data never touches our servers.</p>
                                </div>
                                <div className="p-4 bg-elevated rounded-xl">
                                    <h3 className="font-semibold text-text-primary mb-1">Account data</h3>
                                    <p className="text-sm">Your email address, billing status, and preferences are stored in our PostgreSQL database behind standard JWT authentication. This is the only data on our servers, and it contains zero context about your actual work activity.</p>
                                </div>
                            </div>
                        </section>

                        {/* Encryption */}
                        <section className="p-8 bg-bg-surface border border-border rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Lock className="w-6 h-6 text-green-500" />
                                <h2 className="text-2xl font-bold text-text-primary">Encryption & Security</h2>
                            </div>
                            <div className="space-y-3 text-text-secondary text-sm leading-relaxed">
                                <p>The local database on the desktop app is isolated to your machine. The architecture is air-gapped by design — your deep work context never hits an external API without your explicit instruction.</p>
                                <p>All network communication between the app and our billing/authentication API endpoints uses standard TLS 1.3 encryption.</p>
                            </div>
                        </section>

                        {/* Data deletion */}
                        <section className="p-8 bg-bg-surface border border-border rounded-3xl">
                            <div className="flex items-center gap-3 mb-6">
                                <Trash2 className="w-6 h-6 text-orange-500" />
                                <h2 className="text-2xl font-bold text-text-primary">Deleting your data</h2>
                            </div>
                            <div className="space-y-3 text-text-secondary text-sm leading-relaxed">
                                <p>From the dashboard Settings page, you can delete individual activity records, clear entire date ranges, or delete your full account and all associated data.</p>
                                <p>Forget Mode pauses tracking for a defined period — useful for personal calls, sensitive work, or any time you want a gap in the timeline.</p>
                                <p>Account deletion removes all server-side data within 48 hours. Local data on your machine is yours to delete directly — we have no mechanism to remove it remotely.</p>
                            </div>
                        </section>

                        {/* Contact */}
                        <div className="text-center p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl">
                            <h3 className="text-lg font-bold text-text-primary mb-2">Questions about your data?</h3>
                            <p className="text-text-secondary text-sm mb-4">Email us directly. No support ticket queue, no automated responses on privacy questions.</p>
                            <a href="mailto:privacy@tryminime.com" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition text-sm">
                                privacy@tryminime.com
                            </a>
                        </div>

                        <div className="text-center text-sm text-text-muted">
                            For the full legal terms governing your use of MiniMe, see the{' '}
                            <Link href="/terms" className="text-indigo-500 hover:underline">Terms of Service</Link>.
                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
