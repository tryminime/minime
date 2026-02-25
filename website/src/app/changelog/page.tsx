import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';

export default function ChangelogPage() {
    const releases = [
        {
            version: 'v0.2.0',
            date: 'February 22, 2026',
            title: 'The Knowledge Graph Update',
            tags: ['Feature', 'Desktop', 'Backend'],
            points: [
                'Integrated local Ollama models (Llama 3 8B) for semantic entity extraction.',
                'Added the interactive Knowledge Graph dashboard view mapping skills to projects.',
                'Completely rewrote the system tray daemon in Rust for native macOS/Windows feel.',
                'Added "Focus Score" metrics to the daily digest.',
                'Vastly improved accuracy of the browser extension URL tracking.'
            ]
        },
        {
            version: 'v0.1.0',
            date: 'January 10, 2026',
            title: 'Public Beta Launch',
            tags: ['Launch'],
            points: [
                'Initial release of the desktop client for macOS and Windows.',
                'Local SQLite database integration for privacy-first tracking.',
                'Basic activity timeline and productivity charts.',
                'End-to-end encrypted cloud sync for multi-device support.'
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-white">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="mb-20">
                        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Changelog</h1>
                        <p className="text-xl text-gray-600">New updates and improvements to MiniMe.</p>
                    </div>

                    <div className="space-y-24 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                        {releases.map((release) => (
                            <div key={release.version} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                {/* Timeline dot */}
                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-indigo-100 text-indigo-600 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -ml-5 md:ml-0 z-10 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                                    <span className="w-2.5 h-2.5 bg-current rounded-full" />
                                </div>

                                {/* Content */}
                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] ml-auto md:ml-0">
                                    <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm group-hover:shadow-md group-hover:border-indigo-100 transition-all">

                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <span className="px-3 py-1 bg-gray-900 text-white text-sm font-bold rounded-lg">{release.version}</span>
                                            <span className="text-sm font-medium text-gray-500">{release.date}</span>
                                        </div>

                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{release.title}</h2>

                                        <ul className="space-y-3">
                                            {release.points.map((point, i) => (
                                                <li key={i} className="flex gap-3 text-gray-600">
                                                    <span className="text-indigo-500 shrink-0 mt-1.5">•</span>
                                                    <span>{point}</span>
                                                </li>
                                            ))}
                                        </ul>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
