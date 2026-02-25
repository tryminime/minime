'use client';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Plus, Minus, MessageCircleQuestion } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
    {
        category: "General",
        questions: [
            { q: "What is MiniMe?", a: "MiniMe is an AI-powered personal work intelligence platform. It runs silently in the background, logging your application usage and browser activity to build a semantic Knowledge Graph of your work habits without requiring any manual data entry." },
            { q: "What platforms are supported?", a: "The MiniMe desktop app currently supports macOS (Intel and Apple Silicon), Windows 10/11, and modern Linux distributions using AppImage or DEB packages." },
            { q: "Is it open source?", a: "The core desktop and backend code is available on GitHub under a BSL license. We welcome community contributions and self-hosting for personal use." }
        ]
    },
    {
        category: "Privacy & Security",
        questions: [
            { q: "Where is my data stored?", a: "If you are on the Free plan or choose not to use Cloud Sync, your data is 100% local. It lives in a SQLite database on your hard drive. If you use Pro with Cloud Sync, your data is end-to-end encrypted before being synced to our secure servers." },
            { q: "Can my employer see my data?", a: "No. MiniMe is an individual productivity tool. Unless you explicitly export your data or join an Enterprise workspace that requires sharing, your insights remain completely private." },
            { q: "What data does the browser extension track?", a: "The extension logs URLs, page titles, and active time. It does NOT log keystrokes, form submissions, or the actual content of the web pages you visit." }
        ]
    },
    {
        category: "Technical",
        questions: [
            { q: "How does the local LLM work?", a: "We bundle a lightweight FastAPI server that interfaces with Ollama. Once installed, it downloads a quantized model (like Llama 3) which processes your raw text locally to extract entities like 'Projects' or 'Skills' without sending data to OpenAI." },
            { q: "Does it drain my battery?", a: "MiniMe is highly optimized in Rust via the Tauri framework. The background tracking daemon uses less than 1% CPU. Running local LLM inference will temporarily spike CPU/GPU, but we batch these jobs to minimize impact." },
            { q: "Can I delete or edit my timeline?", a: "Yes, you have full CRUD (Create, Read, Update, Delete) access to your timeline from the Dashboard. You can also configure blocklists for specific apps or URLs." }
        ]
    },
    {
        category: "Billing",
        questions: [
            { q: "How does the free trial work?", a: "When you sign up for Pro, you get 14 days of unrestricted access. You do not need to enter a credit card to start the trial." },
            { q: "What payments do you accept?", a: "We use Stripe for billing and accept all major credit cards, Apple Pay, and Google Pay." },
            { q: "Do you offer student discounts?", a: "Yes! Students and educators with a valid .edu email address can claim a 50% discount on the Pro plan. Contact our support team to apply." }
        ]
    }
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<string>('General-0');

    const toggle = (id: string) => {
        setOpenIndex(openIndex === id ? '' : id);
    };

    return (
        <div className="min-h-screen bg-gray-50 selection:bg-indigo-100 selection:text-indigo-900">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center mb-16">
                        <div className="w-16 h-16 bg-white border border-gray-200 shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <MessageCircleQuestion className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Frequently Asked Questions</h1>
                        <p className="text-xl text-gray-600">Everything you need to know about functionality, privacy, and pricing.</p>
                    </div>

                    <div className="space-y-12">
                        {FAQS.map((category) => (
                            <div key={category.category}>
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.category}</h2>
                                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                                    {category.questions.map((item, idx) => {
                                        const id = `${category.category}-${idx}`;
                                        const isOpen = openIndex === id;
                                        return (
                                            <div key={idx} className="border-b border-gray-100 last:border-0">
                                                <button
                                                    onClick={() => toggle(id)}
                                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
                                                >
                                                    <span className="font-semibold text-gray-900 pr-8">{item.q}</span>
                                                    <span className="flex-shrink-0 text-gray-400">
                                                        {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                                    </span>
                                                </button>
                                                {isOpen && (
                                                    <div className="px-6 pb-6 text-gray-600 leading-relaxed pt-2">
                                                        {item.a}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 text-center bg-indigo-50 rounded-3xl p-8 border border-indigo-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
                        <p className="text-gray-600 mb-6">Our support team is ready to help you out.</p>
                        <a href="mailto:support@tryminime.com" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition">Contact Support</a>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
