import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { FileText, Download, Building } from 'lucide-react';

export default function WhitepaperPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="bg-white border border-gray-200 shadow-xl rounded-3xl overflow-hidden">

                        {/* Cover */}
                        <div className="bg-slate-900 px-12 py-16 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
                                    <FileText className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">MiniMe Technical Whitepaper</h1>
                                <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">A privacy-first architecture for extracting semantic knowledge graphs from active window telemetry using on-device Large Language Models.</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <span className="text-slate-400 text-sm font-medium">Version 1.0</span>
                                    <span className="hidden sm:block w-1.5 h-1.5 bg-slate-600 rounded-full" />
                                    <span className="text-slate-400 text-sm font-medium">February 2026</span>
                                </div>
                            </div>
                        </div>

                        {/* Document Body */}
                        <div className="px-8 py-16 md:px-16 prose prose-lg prose-indigo max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl">
                            <h2>Abstract</h2>
                            <p>Knowledge workers generate thousands of fragmented data points daily across dozens of applications. Existing time-tracking solutions rely on manual entry or invasive cloud-based surveillance. MiniMe proposes a novel architecture that captures telemetry locally, utilizes a quantized Llama-3 model running on-device for entity recognition (NER), and builds a semantic Personal Knowledge Graph (PKG). This approach guarantees absolute data sovereignty while providing enterprise-grade analytics.</p>

                            <h2>1. System Architecture</h2>
                            <p>The MiniMe system is composed of three primary decoupled layers:</p>
                            <ul>
                                <li><strong>The Sensor Daemon:</strong> A lightweight Rust binary natively integrated with macOS (Accessibility API), Windows (User32), and Linux (X11/Wayland). It polls active window state at 1Hz, buffering changes to avoid disk thrashing.</li>
                                <li><strong>The Local Backend:</strong> A Python/FastAPI service managing a local SQLite database. It serves as the primary router for incoming telemetry and outgoing UI queries.</li>
                                <li><strong>The AI Engine:</strong> An integration with Ollama to run 8B parameter models. The engine executes batch inference jobs during idle periods to enrich raw telemetry with semantic metadata.</li>
                            </ul>

                            <h2>2. The Knowledge Graph (PKG)</h2>
                            <p>Unlike relational time-logs, MiniMe structures data as an RDF-style graph. Nodes represent <code>Software Applications</code>, <code>Projects</code>, <code>Skills</code>, and <code>People</code>. Edges represent temporal interactions (e.g., <code>[User] USED [VS Code] FOR [2 hours] ON [minime-backend]</code>). This enables complex Cypher-like queries directly against the user's history.</p>

                            <h2>3. Privacy & Security Model</h2>
                            <p>The foundational invariant of MiniMe is <strong>Zero Trust Cloud</strong>. The local node is the primary source of truth.</p>
                            <p>When the user opts into Cloud Sync (for cross-device experiences or Enterprise team aggregation), the local node encrypts the PKG using AES-256-GCM derived from a user-held master password. The server stores only ciphertext blobs. The cloud backend cannot construct analytics; it acts strictly as a dumb storage layer (E2EE).</p>

                            <h2>4. Performance Benchmarks</h2>
                            <p>In our tests on an Apple M3 Mac with 16GB RAM:</p>
                            <ul>
                                <li>Sensor Daemon CPU usage: <strong>`&lt; 0.5%`</strong></li>
                                <li>SQLite write latency: <strong>2ms</strong> (via WAL mode WAL and synchronous=NORMAL)</li>
                                <li>Local LLM Inference (Batch of 50 activities): <strong>4.2 seconds</strong></li>
                            </ul>

                            <div className="mt-16 pt-8 border-t border-gray-200">
                                <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition">
                                    <Download className="w-5 h-5" /> Download PDF Version
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
