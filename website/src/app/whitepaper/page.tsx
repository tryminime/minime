import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export default function WhitepaperPage() {
    return (
        <div className="min-h-screen bg-bg-surface">
            <MarketingNav />

            <main className="pt-40 pb-32">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="bg-bg-base border border-border/50 shadow-xl rounded-3xl overflow-hidden">

                        {/* Cover */}
                        <div className="bg-slate-900 px-12 py-16 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/20 pointer-events-none" />
                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-white/20">
                                    <FileText className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">MiniMe Technical Whitepaper</h1>
                                <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">A local-first architecture for passive activity intelligence, personal knowledge graphs, and privacy-preserving AI — built on Tauri, FastAPI, PostgreSQL, Qdrant, and Neo4j.</p>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                    <span className="text-slate-400 text-sm font-medium">Version 1.1</span>
                                    <span className="hidden sm:block w-1.5 h-1.5 bg-slate-600 rounded-full" />
                                    <span className="text-slate-400 text-sm font-medium">March 2026</span>
                                    <span className="hidden sm:block w-1.5 h-1.5 bg-slate-600 rounded-full" />
                                    <span className="text-slate-400 text-sm font-medium">MiniMe Technologies, Inc.</span>
                                </div>
                            </div>
                        </div>

                        {/* Document Body */}
                        <div className="px-8 py-16 md:px-16 prose prose-lg prose-indigo dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl prose-h3:font-semibold prose-code:text-indigo-600 dark:prose-code:text-indigo-400 prose-code:bg-indigo-50 dark:prose-code:bg-indigo-900/30 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100">

                            <h2>Abstract</h2>
                            <p>
                                Knowledge workers generate thousands of fragmented signals daily — active windows, browser tabs, code commits, meetings, and search queries — scattered across dozens of applications. Existing solutions either require manual effort (time trackers), violate privacy (cloud surveillance tools), or lack personal context (generic LLM assistants).
                            </p>
                            <p>
                                MiniMe introduces a local-first activity intelligence platform that passively captures device telemetry, enriches it into a Personal Knowledge Graph (PKG), and exposes a natural-language interface backed by a retrieval-augmented generation (RAG) pipeline. All raw data remains on-device by default. Cloud sync, when enabled, transmits only AES-256-GCM ciphertext that the server cannot read. This paper documents the system architecture, data model, storage choices, enrichment pipeline, and privacy guarantees.
                            </p>

                            <h2>1. System Architecture</h2>
                            <p>MiniMe is composed of four decoupled layers:</p>

                            <h3>1.1 Sensor Layer (Desktop Daemon)</h3>
                            <p>
                                A lightweight background process built with <strong>Tauri</strong> and <strong>Rust</strong>. The daemon polls active window state at 1Hz using:
                            </p>
                            <ul>
                                <li><strong>macOS:</strong> Accessibility API (<code>CGWindowListCopyWindowInfo</code>)</li>
                                <li><strong>Windows:</strong> Win32 User32 API (<code>GetForegroundWindow</code>)</li>
                                <li><strong>Linux:</strong> X11 via <code>xdotool</code> or D-Bus on Wayland</li>
                            </ul>
                            <p>The daemon buffers events in memory and flushes batches to the local backend every 10 seconds. CPU usage stays below 0.5% on Apple M-series hardware. RAM footprint is under 40MB.</p>
                            <p>Browser activity is captured by separate <strong>Manifest V3</strong> (Chrome, Edge) and <strong>Manifest V2</strong> (Firefox) extensions. Each extension tracks tab URL, domain, page title, and dwell time. Data is batched locally and POSTed to <code>/api/v1/activities/batch</code> on an interval.</p>

                            <h3>1.2 Backend Service</h3>
                            <p>
                                A <strong>FastAPI</strong> application (Python 3.10+) running at <code>localhost:8000</code>. Key responsibilities:
                            </p>
                            <ul>
                                <li>Receives and validates activity batches from the daemon and extensions</li>
                                <li>Writes normalized records to <strong>PostgreSQL</strong> (relational store, via SQLAlchemy)</li>
                                <li>Schedules enrichment jobs via a background task queue</li>
                                <li>Serves the REST API consumed by the Next.js dashboard</li>
                                <li>Streams AI chat responses via Server-Sent Events (SSE)</li>
                            </ul>
                            <p>JWT-based authentication is enforced on all endpoints. Tokens are issued at login and refreshed automatically. The dashboard connects via <code>localhost:3000</code> → backend at <code>localhost:8000</code>.</p>

                            <h3>1.3 Storage Layer</h3>
                            <p>MiniMe uses three storage engines, each chosen for a specific access pattern:</p>
                            <ul>
                                <li><strong>PostgreSQL:</strong> Normalized relational store for activities, users, goals, settings, and billing state. Enables complex time-series queries and aggregations (focus score, time-by-domain breakdowns).</li>
                                <li><strong>Qdrant:</strong> Vector database for activity embeddings. Each enriched activity record is embedded using a sentence transformer and stored as a dense vector. Powers the RAG retrieval step in AI chat — user queries are embedded and matched against the activity corpus via approximate nearest-neighbor search.</li>
                                <li><strong>Neo4j:</strong> Graph database for the Personal Knowledge Graph. Stores entities (Person, Project, Skill, Concept, Organization, Artifact, Event, Interaction) as nodes and temporal relationships as edges with weights derived from co-occurrence frequency.</li>
                            </ul>

                            <h3>1.4 AI Enrichment Pipeline</h3>
                            <p>Raw activity records are sparse — a window title like &quot;layout.tsx - minime-backend — VS Code&quot; carries implicit semantics (TypeScript file, project name, code editor) that must be extracted to be useful.</p>
                            <p>The enrichment pipeline runs as a background job on a configurable interval (default: every 5 minutes during idle periods). Steps:</p>
                            <ol>
                                <li><strong>Entity extraction:</strong> A structured prompt extracts entities (project name, file type, skill domain, application category) from the raw window title and URL. This runs against the backend API (OpenAI-compatible endpoint by default; configurable to self-hosted Ollama for full local operation).</li>
                                <li><strong>Embedding:</strong> The enriched activity text is embedded using <code>all-MiniLM-L6-v2</code> and stored in Qdrant.</li>
                                <li><strong>Graph update:</strong> Extracted entities and their relationships are upserted into Neo4j. Edge weights are incremented on each co-occurrence.</li>
                                <li><strong>Analytics aggregation:</strong> Daily focus scores, skill time distributions, and wellness indicators are recomputed and cached in PostgreSQL.</li>
                            </ol>

                            <h2>2. The Personal Knowledge Graph (PKG)</h2>
                            <p>The PKG is MiniMe&apos;s primary output artifact. It transforms a flat activity log into a queryable semantic network.</p>
                            <p><strong>Node types:</strong> <code>Person</code>, <code>Project</code>, <code>Skill</code>, <code>Concept</code>, <code>Organization</code>, <code>Artifact</code>, <code>Event</code>, <code>Interaction</code></p>
                            <p><strong>Example edges:</strong></p>
                            <pre>{`(User)-[:WORKED_ON {hours: 4.2}]->(Project: "minime-backend")
(User)-[:USED_SKILL {count: 28}]->(Skill: "Python")
(Project: "minime-backend")-[:REQUIRES]->(Skill: "FastAPI")
(User)-[:ATTENDED {date: "2026-03-04"}]->(Event: "Sprint Planning")`}</pre>
                            <p>Edges carry temporal metadata so the graph reflects not just what the user does but when and how often. A Cypher query like <code>MATCH (u)-[:USED_SKILL]-&gt;(s) WHERE s.name =&quot;Rust&quot; RETURN count(*)</code> returns a precise count of activities involving Rust over any time window.</p>
                            <p>The graph dashboard in the web app renders the PKG using a force-directed layout, with node size proportional to edge count (activity frequency) and color encoding entity type.</p>

                            <h2>3. Privacy and Security Model</h2>
                            <p>The core invariant: <strong>raw activity data never leaves the user&apos;s machine without their explicit action.</strong></p>

                            <h3>3.1 Local-only mode (Free plan)</h3>
                            <p>All data stays in the local PostgreSQL and Qdrant instances. The backend runs entirely on localhost. No outbound network calls for data storage. AI enrichment can run via a locally hosted Ollama instance to eliminate external API calls entirely.</p>

                            <h3>3.2 Cloud Sync (Pro plan)</h3>
                            <p>When cloud sync is enabled, the client serializes and encrypts the relevant data subset using <strong>AES-256-GCM</strong> before transmission. The encryption key is derived from the user&apos;s account credentials using PBKDF2-HMAC-SHA256 with a per-user salt. The MiniMe cloud backend receives and stores opaque ciphertext blobs in Google Drive via the Drive API — the server has no access to the encryption key and cannot construct any analytics from the stored data.</p>

                            <h3>3.3 Access control</h3>
                            <p>All backend API endpoints enforce JWT bearer authentication. Tokens expire after 24 hours. The local PostgreSQL instance is accessible only to the running backend process — no external network exposure. The Qdrant and Neo4j instances listen on loopback addresses only.</p>

                            <h2>4. Measured Performance</h2>
                            <p>Measured on an Apple M3 Pro (16GB RAM) running macOS 15:</p>
                            <ul>
                                <li>Sensor daemon CPU: <strong>&lt; 0.5%</strong> (steady state)</li>
                                <li>Sensor daemon RAM: <strong>&lt; 40MB</strong></li>
                                <li>Activity batch write latency (PostgreSQL): <strong>&lt; 5ms</strong></li>
                                <li>Qdrant embedding insert: <strong>&lt; 20ms per record</strong></li>
                                <li>AI chat first token latency (backend API): <strong>&lt; 2s</strong></li>
                                <li>Dashboard initial load: <strong>&lt; 1.2s</strong> (Next.js static export)</li>
                            </ul>

                            <h2>5. Dashboard and Integrations</h2>
                            <p>The web dashboard (Next.js 14, React 18, Tailwind CSS) runs at <code>localhost:3000</code> and connects to the backend API via JWT-authenticated fetch. It ships with 14 built-in views:</p>
                            <p>Activity Timeline · Knowledge Graph · AI Chat · Productivity Analytics · Skills · Goals · Wellness · Collaboration · Career · Weekly Digest · Tasks · Enrichment · Billing · Settings</p>
                            <p>Three platform integrations are currently active:</p>
                            <ul>
                                <li><strong>GitHub:</strong> Commit metadata, repository activity</li>
                                <li><strong>Google:</strong> Calendar events, Gmail thread metadata (subject, sender — no body)</li>
                                <li><strong>Notion:</strong> Page access patterns (which pages, when) — not page content</li>
                            </ul>

                            <h2>6. Roadmap</h2>
                            <p>Planned additions (not yet shipped):</p>
                            <ul>
                                <li>Safari browser extension (MV3 implementation in progress)</li>
                                <li>Wearable data ingest (Apple Health, Oura) for wellness correlation</li>
                                <li>Local-only LLM mode with full Ollama integration for offline AI chat</li>
                                <li>Enterprise team aggregate analytics (anonymized, opt-in)</li>
                                <li>Obsidian and Logseq PKM sync</li>
                            </ul>

                            <div className="mt-16 pt-8 border-t border-border/50 flex flex-wrap gap-4">
                                <Link href="/features" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
                                    Explore Features
                                </Link>
                                <Link href="/docs" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
                                    API Reference
                                </Link>
                                <a href="mailto:invest@tryminime.com" className="inline-flex items-center gap-2 px-6 py-3 bg-bg-surface border border-border dark:border-border text-text-primary font-bold rounded-xl hover:bg-elevated transition">
                                    Investor Inquiries
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
