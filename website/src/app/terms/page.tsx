import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Scale } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-bg-surface">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-12">
                        <div className="w-14 h-14 bg-bg-base border border-border/50 shadow-sm rounded-2xl flex items-center justify-center mb-6">
                            <Scale className="w-7 h-7 text-indigo-600" />
                        </div>
                        <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-4">Terms of Service</h1>
                        <p className="text-text-secondary">Last updated: March 5, 2026</p>
                        <p className="text-text-secondary mt-2 text-sm">
                            Questions? Email <a href="mailto:legal@tryminime.com" className="text-indigo-600 hover:underline">legal@tryminime.com</a>
                        </p>
                    </div>

                    <div className="space-y-10">

                        <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                            <p className="text-text-primary font-medium leading-relaxed">
                                These Terms of Service govern your use of MiniMe — the desktop application, browser extensions, web dashboard, and backend API (collectively the &quot;Service&quot;) — operated by MiniMe Technologies, Inc. (&quot;MiniMe&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a company incorporated in San Francisco, CA 94107, USA.
                            </p>
                            <p className="text-text-secondary text-sm mt-3">By using the Service you agree to these Terms. If you disagree with any part, please stop using the Service.</p>
                        </div>

                        <section className="bg-bg-base border border-border/50 rounded-3xl overflow-hidden shadow-sm">
                            {[
                                {
                                    n: '1',
                                    title: 'The Service',
                                    body: `MiniMe is a personal productivity and AI platform. It runs primarily on your local machine, tracking active application usage, browser activity (via browser extension), and related signals to build a private knowledge graph and provide AI-assisted insights. MiniMe Technologies, Inc. also operates a cloud backend that provides authentication, encrypted sync, and AI chat features for subscribed users. The Free plan provides full local functionality without cloud services.`
                                },
                                {
                                    n: '2',
                                    title: 'Account Registration',
                                    body: `You must provide a valid email address to create an account. You are responsible for keeping your login credentials secure. You must be at least 16 years old to use the Service. We may suspend or terminate accounts that violate these Terms or are found to be in breach of applicable law.`
                                },
                                {
                                    n: '3',
                                    title: 'Subscriptions and Billing',
                                    body: `Pro features (cloud sync, extended AI history, and unlimited storage) are billed monthly or annually via Stripe. Your subscription renews automatically unless cancelled. You may cancel at any time from the billing dashboard — access continues through the end of the current billing period. We offer a 30-day refund for first-time Pro subscribers. Refund requests are handled at legal@tryminime.com within 24 hours. We do not store payment card details — Stripe handles all payment processing under their own terms and PCI compliance.`
                                },
                                {
                                    n: '4',
                                    title: 'License and Permitted Use',
                                    body: `We grant you a personal, non-exclusive, non-transferable, revocable license to use the Service. You may not reverse-engineer, resell, sublicense, or redistribute the software. The local desktop app and browser extensions may be used on devices you personally own or control. You may not use the Service to monitor or track other people without their explicit, informed consent.`
                                },
                                {
                                    n: '5',
                                    title: 'Your Data',
                                    body: `You own your data. Activity data captured locally by the desktop app and browser extensions belongs to you. We do not sell, train on, or share your activity data with third parties. If you enable cloud sync, your data is encrypted on your device before transmission — MiniMe Technologies, Inc. cannot read the contents. You may export or delete your data at any time from the dashboard. See our Privacy page for full details.`
                                },
                                {
                                    n: '6',
                                    title: 'Acceptable Use',
                                    body: `You agree not to misuse the Service. Prohibited conduct includes: attempting to gain unauthorized access to other users' accounts or data; using the Service to surveil employees or third parties without consent; attempting to reverse-engineer or extract proprietary model weights or algorithms; using the API to scrape or bulk-export data for commercial resale; or uploading malicious code through any integration.`
                                },
                                {
                                    n: '7',
                                    title: 'Availability and Changes',
                                    body: `We aim for high availability but do not guarantee uninterrupted service. We may update, modify, or discontinue features with reasonable notice. For material changes to paid features, we will provide at least 30 days notice via email. We will not remove core local tracking functionality from the Free plan without 90 days notice.`
                                },
                                {
                                    n: '8',
                                    title: 'Intellectual Property',
                                    body: `The MiniMe name, logo, and all software (desktop, web, extensions, backend) are the property of MiniMe Technologies, Inc. Nothing in these Terms grants you any rights to our trademarks or branding. Feedback you share with us (e.g., feature requests, bug reports) may be used to improve the product without obligation to you.`
                                },
                                {
                                    n: '9',
                                    title: 'Disclaimer and Limitation of Liability',
                                    body: `The Service is provided "AS IS" without warranties of any kind. MiniMe Technologies, Inc. is not liable for any indirect, incidental, or consequential damages arising from your use of the Service, including data loss. Our total liability to you in any 12-month period is limited to the amount you paid us in that period, or $100, whichever is greater.`
                                },
                                {
                                    n: '10',
                                    title: 'Governing Law',
                                    body: `These Terms are governed by the laws of the State of California, USA, without regard to conflict of law provisions. Disputes will be resolved in the federal or state courts located in San Francisco County, California.`
                                },
                                {
                                    n: '11',
                                    title: 'Contact',
                                    body: null,
                                    extra: (
                                        <p className="text-text-secondary text-sm">
                                            MiniMe Technologies, Inc.<br />
                                            San Francisco, CA 94107<br />
                                            <a href="mailto:legal@tryminime.com" className="text-indigo-600 hover:underline">legal@tryminime.com</a>
                                        </p>
                                    )
                                },
                            ].map((section) => (
                                <div key={section.n} className="p-8 border-b border-border last:border-0">
                                    <h2 className="text-lg font-bold text-text-primary mb-3">{section.n}. {section.title}</h2>
                                    {section.body && <p className="text-text-secondary text-sm leading-relaxed">{section.body}</p>}
                                    {section.extra && section.extra}
                                </div>
                            ))}
                        </section>

                        <p className="text-xs text-text-muted text-center">
                            For data handling specifics, see the <Link href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</Link>.
                        </p>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
