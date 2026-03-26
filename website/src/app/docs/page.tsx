import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Book, Code, Lock, Server, Activity, Brain, Database, BarChart3, Users, Settings, CreditCard } from 'lucide-react';

const ENDPOINT_GROUPS = [
    {
        id: 'activities',
        title: 'Activities',
        icon: Activity,
        color: 'text-indigo-500',
        endpoints: [
            {
                method: 'POST',
                path: '/api/v1/activities/batch',
                title: 'Batch ingest activities',
                desc: 'Primary ingest endpoint. Used by both the desktop daemon and browser extensions. Accepts an array of activity events.',
                body: `{
  "source": "browser",
  "source_version": "1.1.0",
  "activities": [
    {
      "type": "web_visit",
      "occurred_at": "2026-03-05T12:00:00Z",
      "duration_seconds": 120,
      "context": {
        "url": "https://github.com",
        "domain": "github.com",
        "title": "GitHub"
      }
    }
  ]
}`
            },
            {
                method: 'GET',
                path: '/api/v1/activities',
                title: 'List activities',
                desc: 'Retrieve paginated activities. Supports filtering by date range, source, and activity type.',
                body: null,
                params: '?limit=50&offset=0&start_date=2026-03-01&source=browser'
            },
            {
                method: 'GET',
                path: '/api/v1/activities/:id',
                title: 'Get single activity',
                desc: 'Fetch a specific activity record by ID including all metadata and enrichment results.',
                body: null
            },
            {
                method: 'DELETE',
                path: '/api/v1/activities/:id',
                title: 'Delete activity',
                desc: 'Permanently remove a single activity record from your timeline.',
                body: null
            },
        ]
    },
    {
        id: 'graph',
        title: 'Knowledge Graph',
        icon: Database,
        color: 'text-purple-500',
        endpoints: [
            {
                method: 'GET',
                path: '/api/v1/graph/nodes',
                title: 'Get graph nodes',
                desc: 'Returns all entity nodes: person, project, skill, concept, organization, artifact, event, interaction.',
                body: null,
                params: '?type=skill&limit=100'
            },
            {
                method: 'GET',
                path: '/api/v1/graph/edges',
                title: 'Get graph edges',
                desc: 'Returns relationships between nodes. Each edge has a weight reflecting how frequently the entities co-occur.',
                body: null
            },
        ]
    },
    {
        id: 'ai',
        title: 'AI Chat',
        icon: Brain,
        color: 'text-cyan-500',
        endpoints: [
            {
                method: 'POST',
                path: '/api/ai/chat/stream',
                title: 'Stream a chat response',
                desc: 'RAG-powered chat against your activity history. Returns a Server-Sent Events (SSE) stream — note the /api/ai prefix, not /api/v1/ai.',
                body: `{
  "message": "What did I work on last Tuesday?",
  "conversation_id": "optional-uuid-to-continue-a-thread"
}`,
                note: 'SSE response. Read with EventSource or fetch + ReadableStream. Each chunk is data: {"chunk": "...", "done": false}.'
            },
            {
                method: 'GET',
                path: '/api/ai/conversations',
                title: 'List conversations',
                desc: 'Returns all saved chat conversations with their titles and creation timestamps.',
                body: null
            },
        ]
    },
    {
        id: 'analytics',
        title: 'Analytics',
        icon: BarChart3,
        color: 'text-orange-500',
        endpoints: [
            {
                method: 'GET',
                path: '/api/v1/analytics/focus',
                title: 'Focus score',
                desc: 'Returns daily focus scores calculated from deep work periods vs. context-switching frequency.',
                body: null,
                params: '?start_date=2026-03-01&end_date=2026-03-07'
            },
            {
                method: 'GET',
                path: '/api/v1/analytics/summary/weekly/email',
                title: 'Send weekly digest email',
                desc: 'Triggers generation and delivery of the weekly activity summary email for the authenticated user.',
                body: null
            },
        ]
    },
    {
        id: 'users',
        title: 'Users & Settings',
        icon: Settings,
        color: 'text-green-500',
        endpoints: [
            {
                method: 'GET',
                path: '/api/v1/users/me',
                title: 'Get current user',
                desc: 'Returns the authenticated user profile including plan, preferences, and connected integrations.',
                body: null
            },
            {
                method: 'POST',
                path: '/api/v1/auth/login',
                title: 'Login',
                desc: 'Authenticates a user and returns a JWT access token.',
                body: `{
  "email": "user@example.com",
  "password": "yourpassword"
}`
            },
        ]
    },
];

const methodColor = (m: string) => {
    switch (m) {
        case 'GET': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
        case 'POST': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
        case 'DELETE': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
        default: return 'bg-gray-100 text-gray-700';
    }
};

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-bg-surface selection:bg-indigo-100 selection:text-indigo-900">
            <MarketingNav />

            <main className="pt-24 flex">
                {/* Sidebar */}
                <aside className="w-64 fixed left-0 top-24 bottom-0 border-r border-border/50 bg-bg-base overflow-y-auto hidden lg:block pb-10">
                    <div className="p-6">
                        <h3 className="font-bold text-text-primary mb-4 text-xs uppercase tracking-wider text-text-muted">Overview</h3>
                        <ul className="space-y-1 mb-8">
                            <li><a href="#introduction" className="text-text-secondary hover:text-indigo-600 font-medium text-sm block py-1">Introduction</a></li>
                            <li><a href="#authentication" className="text-text-secondary hover:text-indigo-600 font-medium text-sm block py-1">Authentication</a></li>
                            <li><a href="#base-url" className="text-text-secondary hover:text-indigo-600 font-medium text-sm block py-1">Base URL</a></li>
                        </ul>

                        <h3 className="font-bold text-xs uppercase tracking-wider text-text-muted mb-4">REST API</h3>
                        <ul className="space-y-1">
                            {ENDPOINT_GROUPS.map(g => (
                                <li key={g.id}>
                                    <a href={`#${g.id}`} className="text-text-secondary hover:text-indigo-600 font-medium text-sm block py-1">{g.title}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Main */}
                <div className="flex-1 lg:ml-64 bg-bg-base min-h-screen">
                    <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16">

                        <div className="mb-16" id="introduction">
                            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight mb-4">API Reference</h1>
                            <p className="text-xl text-text-secondary leading-relaxed">
                                The MiniMe backend is a FastAPI application running at{' '}
                                <code className="bg-elevated px-2 py-0.5 rounded text-indigo-600 text-sm border border-border/50">http://localhost:8000</code>{' '}
                                when running locally. The web dashboard runs at{' '}
                                <code className="bg-elevated px-2 py-0.5 rounded text-indigo-600 text-sm border border-border/50">http://localhost:3000</code>.
                            </p>
                        </div>

                        {/* Overview cards */}
                        <div className="grid gap-4 mb-16">
                            <div className="p-6 bg-bg-surface border border-border/50 rounded-xl flex gap-4" id="base-url">
                                <Server className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-text-primary text-lg mb-1">Stack</h3>
                                    <p className="text-text-secondary text-sm">Python 3.10+ · FastAPI · SQLAlchemy · PostgreSQL (relational) · Qdrant (vector embeddings) · Neo4j (knowledge graph) · Redis (caching)</p>
                                </div>
                            </div>
                            <div className="p-6 bg-bg-surface border border-border/50 rounded-xl flex gap-4" id="authentication">
                                <Lock className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-text-primary text-lg mb-1">Authentication</h3>
                                    <p className="text-text-secondary text-sm">Most endpoints require a JWT Bearer token. Obtain one via <code className="bg-elevated px-1.5 py-0.5 rounded text-xs text-text-primary">POST /api/v1/auth/login</code>. Pass as <code className="bg-elevated px-1.5 py-0.5 rounded text-xs text-text-primary">Authorization: Bearer &lt;token&gt;</code>.</p>
                                </div>
                            </div>
                            <div className="p-6 bg-bg-surface border border-border/50 rounded-xl flex gap-4">
                                <Code className="w-6 h-6 text-indigo-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-bold text-text-primary text-lg mb-1">Response format</h3>
                                    <p className="text-text-secondary text-sm">All endpoints return JSON unless otherwise noted. Errors use standard HTTP status codes. The AI chat endpoint returns SSE (Server-Sent Events), not JSON.</p>
                                </div>
                            </div>
                        </div>

                        {/* Endpoint groups */}
                        <div className="space-y-20">
                            {ENDPOINT_GROUPS.map((group) => (
                                <section key={group.id} id={group.id}>
                                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border/50">
                                        <div className={`w-8 h-8 rounded-lg bg-elevated flex items-center justify-center`}>
                                            <group.icon className={`w-5 h-5 ${group.color}`} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-text-primary">{group.title}</h2>
                                    </div>

                                    <div className="space-y-10">
                                        {group.endpoints.map((ep, idx) => (
                                            <div key={idx}>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${methodColor(ep.method)}`}>{ep.method}</span>
                                                    <code className="text-sm font-mono text-text-primary">{ep.path}</code>
                                                </div>
                                                <h3 className="text-lg font-bold text-text-primary mb-2">{ep.title}</h3>
                                                <p className="text-text-secondary mb-3 text-sm leading-relaxed">{ep.desc}</p>

                                                {'params' in ep && ep.params && (
                                                    <div className="mb-4">
                                                        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Query params example</p>
                                                        <code className="text-xs text-indigo-400 bg-gray-900 px-3 py-2 rounded-lg block">{ep.params}</code>
                                                    </div>
                                                )}

                                                {'note' in ep && ep.note && (
                                                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                                        <p className="text-xs text-amber-600 dark:text-amber-400">{ep.note}</p>
                                                    </div>
                                                )}

                                                {ep.body && (
                                                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                                                        <div className="text-xs font-mono text-gray-400 mb-2 border-b border-gray-800 pb-2">Request body</div>
                                                        <pre className="text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre">{ep.body}</pre>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                    </div>
                    <Footer />
                </div>
            </main>
        </div>
    );
}
