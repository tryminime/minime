import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogIndex() {
    const posts = [
        {
            slug: 'introducing-minime-v0-2',
            title: 'Introducing MiniMe v0.2: The Local-First Intelligence Graph',
            excerpt: 'Today we are thrilled to announce MiniMe v0.2. We rebuilt the core desktop daemon in Rust, integrated local Llama 3 for entity extraction, and completely revamped the knowledge graph UI.',
            date: 'Feb 22, 2026',
            author: 'Sarah Chen'
        },
        {
            slug: 'why-local-first-ai-matters',
            title: 'Why your work data shouldn\'t go to the cloud',
            excerpt: 'Your daily activity contains the most sensitive IP your company owns. Sending it to generalized cloud LLMs is a security nightmare. Here’s how we solved it with local-first processing.',
            date: 'Feb 15, 2026',
            author: 'Alex Rivera'
        },
        {
            slug: 'building-semantic-graphs',
            title: 'Turning idle time into semantic graphs',
            excerpt: 'A technical deep-dive into how MiniMe transforms raw window titles—like "layout.tsx - VS Code"—into a structured graph mapping your skills to specific projects over time.',
            date: 'Feb 01, 2026',
            author: 'Jordan Hayes'
        }
    ];

    return (
        <div className="min-h-screen bg-bg-surface">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-16">
                        <h1 className="text-5xl font-extrabold text-text-primary tracking-tight mb-4">Blog</h1>
                        <p className="text-xl text-text-secondary">Product updates, build logs, and thoughts on privacy-first AI.</p>
                    </div>

                    <div className="space-y-12">
                        {posts.map((post) => (
                            <article key={post.slug} className="bg-bg-base rounded-3xl p-8 md:p-12 border border-border/50 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group">
                                <div className="flex items-center gap-4 text-sm text-text-muted mb-6 font-medium">
                                    <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {post.date}</div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                                    <div className="flex items-center gap-1.5"><User className="w-4 h-4" /> {post.author}</div>
                                </div>

                                <h2 className="text-3xl font-bold text-text-primary mb-4 group-hover:text-indigo-600 transition-colors">
                                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                                </h2>

                                <p className="text-lg text-text-secondary leading-relaxed mb-8">{post.excerpt}</p>

                                <Link href={`/blog/${post.slug}`} className="inline-flex items-center text-indigo-600 font-bold hover:text-indigo-700">
                                    Read article <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </article>
                        ))}
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
