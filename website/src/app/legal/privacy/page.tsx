import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-12">
                        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Privacy Policy</h1>
                        <p className="text-xl text-gray-600">Last updated: February 22, 2026</p>
                    </div>

                    <div className="prose prose-lg prose-indigo max-w-none text-gray-600 bg-white p-8 md:p-12 rounded-3xl border border-gray-200 shadow-sm">

                        <p className="lead text-xl text-gray-900 font-medium">MiniMe ("we", "our", or "us") is committed to protecting your privacy. We engineered MiniMe with a local-first architecture to ensure you retain sovereignty over your data.</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">1. Information We Collect</h2>
                        <p><strong>1.1 Local Telemetry Data (Raw Data)</strong><br />
                            When you install and run the MiniMe desktop client or browser extensions, the software locally records active window titles, application paths, and URLs ("Local Data"). <strong>This Local Data never leaves your machine unless you explicitly enable Cloud Sync.</strong></p>

                        <p><strong>1.2 Cloud Sync Data (Encrypted Data)</strong><br />
                            If you subscribe to the Pro plan and enable Cloud Sync, your Local Data is encrypted using AES-256-GCM before transmission. We cannot read, analyze, or monetize this Encrypted Data.</p>

                        <p><strong>1.3 Account Data</strong><br />
                            When you create an account, we collect your email address, name, and billing information (processed securely via Stripe).</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">2. How We Use Information</h2>
                        <p>Because MiniMe relies on local LLM inference, we compute insights on your Local Data entirely on your device. We use Account Data solely to authenticate your access, process subscription payments, and communicate important service updates.</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">3. Data Retention and Deletion</h2>
                        <p>You have full CRUD (Create, Read, Update, Delete) control over your Local Data via the MiniMe Dashboard. If you delete your MiniMe account, all associated Account Data and Cloud Sync Data is permanently purged from our servers within 14 days.</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">4. Third-Party Sharing</h2>
                        <p>We do not sell, rent, or trade any of your data to third parties. We leverage standard infrastructure providers (e.g., AWS, Stripe) solely for hosting encrypted blobs and processing payments.</p>

                        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-4">5. Contact Us</h2>
                        <p>If you have questions about this Privacy Policy, please contact our Data Protection Officer at <a href="mailto:privacy@tryminime.com" className="text-indigo-600 hover:underline">privacy@tryminime.com</a>.</p>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
