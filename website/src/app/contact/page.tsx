import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Mail, MessageSquare, MapPin } from 'lucide-react';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Get in touch</h1>
                        <p className="text-xl text-gray-600">Have a question about pricing, enterprise plans, or the open-source code? We'd love to hear from you.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

                        {/* Contact Info */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                    <Mail className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                                <p className="text-gray-500 mb-4">Our friendly team is here to help.</p>
                                <a href="mailto:hello@tryminime.com" className="text-indigo-600 font-medium hover:underline">hello@tryminime.com</a>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                    <MessageSquare className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Community Support</h3>
                                <p className="text-gray-500 mb-4">Join our GitHub discussions for technical help and feature requests.</p>
                                <a href="https://github.com/tryminime" className="text-indigo-600 font-medium hover:underline">github.com/tryminime</a>
                            </div>

                            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6">
                                    <MapPin className="w-6 h-6 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Office</h3>
                                <p className="text-gray-500 mb-1">MiniMe Technologies, Inc.</p>
                                <p className="text-gray-500">San Francisco, CA 94107</p>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-8 md:p-12">
                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First name</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none" placeholder="Jane" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last name</label>
                                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none" placeholder="Doe" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
                                    <input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none" placeholder="jane@company.com" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 bg-white outline-none appearance-none">
                                        <option>General Inquiry</option>
                                        <option>Enterprise Sales</option>
                                        <option>Technical Support</option>
                                        <option>Investor Relations</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                                    <textarea rows={6} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none resize-none" placeholder="How can we help you?"></textarea>
                                </div>

                                <div className="flex items-start gap-3">
                                    <input type="checkbox" className="mt-1 flex-shrink-0 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                    <p className="text-sm text-gray-500">I agree to the <a href="/legal/privacy" className="text-indigo-600 hover:underline">Privacy Policy</a> and consent to having this website store my submitted information so they can respond to my inquiry.</p>
                                </div>

                                <button type="submit" disabled className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors opacity-80 cursor-not-allowed">
                                    Send Message
                                </button>
                            </form>
                        </div>

                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
