import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-12">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Terms of Service</h1>
                        <p className="text-xl text-gray-600">Last updated: February 22, 2026</p>
                    </div>

                    <div className="prose prose-lg prose-indigo max-w-none text-gray-600 bg-white p-8 md:p-12 rounded-3xl border border-gray-200 shadow-sm">

                        <p className="lead text-xl text-gray-900 font-medium">Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the MiniMe application, software, or website (the "Service") operated by MiniMe Technologies, Inc. ("us", "we", or "our").</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">1. Acceptance of Terms</h2>
                        <p>By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, you do not have permission to access the Service.</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">2. Software License</h2>
                        <p>We grant you a personal, non-exclusive, non-transferable, revocable license to use the Service. MiniMe's core source code is made available under the Business Source License (BSL). You may compile and run the software for personal use, but commercial redistribution is strictly prohibited without a separate commercial agreement.</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">3. Subscriptions and Billing</h2>
                        <p>Some parts of the Service (e.g., Cloud Sync, Advanced AI integrations) are billed on a subscription basis ("Subscriptions"). You will be billed in advance on a recurring, periodic basis (Monthly or Annually). You may cancel your subscription at any time through the billing dashboard; cancellations will take effect at the end of the current billing cycle. No refunds are provided for partial months.</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">4. User Responsibilities</h2>
                        <p>You are solely responsible for ensuring that your use of MiniMe complies with all applicable privacy laws and your employer's Acceptable Use Policies. You agree not to use MiniMe to monitor or track third parties without their explicit consent.</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">5. Disclaimer of Warranty</h2>
                        <p>The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, whether express or implied. MiniMe Technologies, Inc. does not warrant that the Service will function uninterrupted or be error-free.</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">6. Contact Information</h2>
                        <p>For any questions regarding these Terms, please contact us at <a href="mailto:legal@tryminime.com" className="text-indigo-600 hover:underline">legal@tryminime.com</a>.</p>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
