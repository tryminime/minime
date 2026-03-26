'use client';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Plus, Minus, MessageCircleQuestion } from 'lucide-react';
import { useState } from 'react';

const FAQS = [
    {
        category: 'General',
        questions: [
            {
                q: 'What is MiniMe?',
                a: 'MiniMe is a personal AI platform that watches how you work — which apps you use, which websites you visit, where your focus time actually goes — and turns that into a private knowledge graph you can explore and talk to. No manual logging, no timers to start and stop.'
            },
            {
                q: 'What platforms does the desktop app run on?',
                a: 'macOS (Intel and Apple Silicon), Windows 10 and 11, and modern Linux distributions via AppImage or DEB packages. The system tray daemon is written in Rust using the Tauri framework, so it is genuinely lightweight across all three.'
            },
            {
                q: 'What browser extensions are available?',
                a: 'Chrome, Brave, Firefox, and Edge all have working extensions. Safari is in development — the extension API differences require a separate implementation. All extensions are built as Manifest V3 (Chrome/Edge) or V2 (Firefox).'
            },
            {
                q: 'Does MiniMe work offline?',
                a: 'The desktop tracking and local dashboard work fully offline. AI chat and cloud sync require an internet connection. If you lose connectivity, tracked data queues locally and syncs when connection is restored.'
            },
            {
                q: 'Is the source code available?',
                a: 'MiniMe is a proprietary, local-first product. Your data never leaves your device, and you have complete control over your private information. The extension code is inspectable in your browser\'s extension manager.'
            },
        ]
    },
    {
        category: 'Privacy & Security',
        questions: [
            {
                q: 'Where is my data stored?',
                a: 'On the Free plan, all data is stored locally in a SQLite database on your machine. On Pro with Cloud Sync enabled, data is encrypted client-side with AES-256 before it is uploaded to your Google Drive. Our servers never receive unencrypted activity data.'
            },
            {
                q: 'Can my employer see what I\'m doing?',
                a: 'No. MiniMe has no employer dashboard or team visibility features. Your insights are completely private unless you choose to export or share them. Even on company-managed machines, the local database is encrypted and inaccessible without your credentials.'
            },
            {
                q: 'What does the browser extension actually track?',
                a: 'The extension logs the URL, page title, and how long you are actively on each tab. It does not log keystrokes, form inputs, passwords, clipboard content, or the actual text content of the pages you visit. Private/incognito windows are excluded by default.'
            },
            {
                q: 'Does MiniMe take screenshots?',
                a: 'The desktop app has an optional screenshot capture feature that can be enabled in Settings. It is disabled by default. When enabled, screenshots are stored locally and never sent to the cloud unless you explicitly export them.'
            },
            {
                q: 'How does encryption work?',
                a: 'The local desktop database is encrypted with AES-256 via the Rust encryption module. Cloud sync uses AES-256-GCM with a key derived from your account credentials — the key is generated on your device and never transmitted to our servers.'
            },
        ]
    },
    {
        category: 'Technical',
        questions: [
            {
                q: 'How does the AI chat work?',
                a: 'When you send a message, MiniMe queries your activity history using vector embeddings stored in Qdrant (RAG — Retrieval Augmented Generation). The retrieved context is passed to the language model along with your question. The response streams back via Server-Sent Events (SSE). No activity data is sent to third-party LLM providers without your knowledge.'
            },
            {
                q: 'What is the knowledge graph?',
                a: 'As you work, MiniMe extracts entities from your activity — project names, skills, people, tools, concepts. These are stored as nodes in a Neo4j graph database with edges representing how they relate. Over time, the graph shows patterns like which skills you use on which projects, or who you meet with most.'
            },
            {
                q: 'Does it affect my computer\'s performance?',
                a: 'The background tracking daemon uses under 1% CPU and less than 40MB of RAM in normal operation. The Tauri/Rust architecture keeps the footprint minimal. Running AI enrichment jobs (entity extraction, embeddings) can temporarily use more CPU — these run on an interval, not in real-time.'
            },
            {
                q: 'Can I delete or edit my timeline?',
                a: 'Yes. From the Dashboard you can delete individual activity records, clear date ranges, or purge the entire database. You can also configure a blocklist for specific apps or URLs that should never be tracked. Forget Mode pauses all tracking for a set duration.'
            },
            {
                q: 'Does it track specific videos or social media?',
                a: 'Yes. The browser extensions are fully capable of detecting when you are actively watching video on sites like YouTube or Netflix, or scrolling social media interfaces (X/Twitter, LinkedIn). This helps generate a more accurate "Deep Work" vs "Context Switch" score.'
            },
            {
                q: 'Can it track my reading time on documents?',
                a: 'Absolutely. MiniMe\'s document tracking captures exact engagement time for local PDFs and web-based documents. Using local NLP, it extracts topics from these documents and maps them directly into your knowledge graph to connect your research with your projects.'
            },
            {
                q: 'Is there a local API I can use?',
                a: 'Yes. The FastAPI backend runs at http://localhost:8000 and exposes a full REST API. Both Free and Pro plans include access. You can query your activity history, knowledge graph, and analytics programmatically — pipe data into Obsidian, Notion, or any other tool via HTTP.'
            },
        ]
    },
    {
        category: 'Billing',
        questions: [
            {
                q: 'How does the free trial work?',
                a: 'Signing up for Pro gives you 14 days of unrestricted access — no credit card required to start. At the end of the trial, your account gracefully downgrades to Free, keeping all local data intact.'
            },
            {
                q: 'What is included in the Free plan?',
                a: 'Free includes the full desktop app, all browser extensions, 7-day activity history, basic knowledge graph (up to 100 nodes), and local API access. AI chat, cloud sync, and unlimited history require Pro.'
            },
            {
                q: 'What payment methods do you accept?',
                a: 'We use Stripe for all billing. We accept major credit cards, Apple Pay, and Google Pay. All payments are processed securely — we never store card details.'
            },
            {
                q: 'Do you offer a money-back guarantee?',
                a: 'Yes. We offer a 30-day no-questions-asked refund on monthly and annual Pro plans. Email support@tryminime.com with your account email and we will process it within 24 hours.'
            },
            {
                q: 'Do you offer student or nonprofit discounts?',
                a: 'Students and educators with a valid .edu email address can get 50% off Pro. Reach out to support@tryminime.com to apply. Nonprofit pricing is available on request.'
            },
        ]
    }
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<string>('General-0');

    const toggle = (id: string) => {
        setOpenIndex(openIndex === id ? '' : id);
    };

    return (
        <div className="min-h-screen bg-bg-surface selection:bg-indigo-100 selection:text-indigo-900">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center mb-16">
                        <div className="w-16 h-16 bg-bg-base border border-border/50 shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <MessageCircleQuestion className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight mb-4">Frequently Asked Questions</h1>
                        <p className="text-xl text-text-secondary">Answers to real questions about how MiniMe works, what it collects, and what you get.</p>
                    </div>

                    <div className="space-y-12">
                        {FAQS.map((category) => (
                            <div key={category.category}>
                                <h2 className="text-2xl font-bold text-text-primary mb-6">{category.category}</h2>
                                <div className="bg-bg-base border border-border/50 rounded-3xl overflow-hidden shadow-sm">
                                    {category.questions.map((item, idx) => {
                                        const id = `${category.category}-${idx}`;
                                        const isOpen = openIndex === id;
                                        return (
                                            <div key={idx} className="border-b border-border last:border-0">
                                                <button
                                                    onClick={() => toggle(id)}
                                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-bg-surface transition-colors"
                                                >
                                                    <span className="font-semibold text-text-primary pr-8">{item.q}</span>
                                                    <span className="flex-shrink-0 text-gray-400">
                                                        {isOpen ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                                    </span>
                                                </button>
                                                {isOpen && (
                                                    <div className="px-6 pb-6 text-text-secondary leading-relaxed pt-2 text-sm">
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

                    <div className="mt-16 text-center bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-800/50">
                        <h3 className="text-xl font-bold text-text-primary mb-2">Something not answered here?</h3>
                        <p className="text-text-secondary mb-6 text-sm">Email us directly — no ticketing system, actual humans respond.</p>
                        <a href="mailto:support@tryminime.com" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition text-sm">
                            support@tryminime.com
                        </a>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
