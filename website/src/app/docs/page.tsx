import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Book, Code, Lock, Server } from 'lucide-react';

export default function DocsPage() {
    const endpoints = [
        {
            method: "POST",
            path: "/api/v1/activities/raw",
            title: "Log Raw Activity",
            desc: "Ingest a new raw activity event from a tracking source.",
            body: "{\n  \"source\": \"window\",\n  \"app_name\": \"VS Code\",\n  \"window_title\": \"layout.tsx - minime - VS Code\"\n}"
        },
        {
            method: "GET",
            path: "/api/v1/activities",
            title: "List Activities",
            desc: "Retrieve aggregated activities with pagination and filtering.",
            body: null
        },
        {
            method: "GET",
            path: "/api/v1/graph/nodes",
            title: "Get Knowledge Graph",
            desc: "Fetch nodes and edges representing extracted semantic entities.",
            body: null
        },
        {
            method: "POST",
            path: "/api/v1/ai/chat",
            title: "Chat with Activity History",
            desc: "Send a RAG query against your personal activity history.",
            body: "{\n  \"message\": \"What did I work on yesterday?\",\n  \"model\": \"llama-3\"\n}"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 selection:bg-indigo-100 selection:text-indigo-900">
            <MarketingNav />

            <main className="pt-24 flex">
                {/* Sidebar Nav */}
                <aside className="w-64 fixed left-0 top-24 bottom-0 border-r border-gray-200 bg-white overflow-y-auto hidden lg:block pb-10">
                    <div className="p-6">
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Getting Started</h3>
                        <ul className="space-y-2 mb-8">
                            <li><a href="#introduction" className="text-gray-600 hover:text-indigo-600 font-medium text-sm">Introduction</a></li>
                            <li><a href="#authentication" className="text-gray-600 hover:text-indigo-600 font-medium text-sm">Authentication</a></li>
                        </ul>

                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">REST API</h3>
                        <ul className="space-y-2">
                            <li><a href="#activities" className="text-gray-600 hover:text-indigo-600 font-medium text-sm">Activities</a></li>
                            <li><a href="#graph" className="text-gray-600 hover:text-indigo-600 font-medium text-sm">Knowledge Graph</a></li>
                            <li><a href="#ai" className="text-gray-600 hover:text-indigo-600 font-medium text-sm">AI Engine</a></li>
                            <li><a href="#settings" className="text-gray-600 hover:text-indigo-600 font-medium text-sm">Settings</a></li>
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 lg:ml-64 bg-white min-h-screen">
                    <div className="max-w-4xl mx-auto px-6 lg:px-12 py-16">
                        <div className="mb-16">
                            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4" id="introduction">MiniMe API Reference</h1>
                            <p className="text-xl text-gray-600">The MiniMe local backend provides a comprehensive REST API running entirely on your machine via FastAPI. All endpoints are accessed locally at <code className="bg-gray-100 px-2 py-0.5 rounded text-indigo-600 px-1 py-1 text-sm bg-gray-100 rounded border border-gray-200">http://localhost:8000</code>.</p>
                        </div>

                        <div className="grid gap-6 mb-16">
                            <div className="p-6 bg-white border border-gray-200 rounded-xl flex gap-4 shadow-sm">
                                <Server className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Local FastAPI Backend</h3>
                                    <p className="text-gray-600 mt-1">Written in Python 3.10+, utilizing SQLAlchemy, Pydantic, and SQLite for robust local performance.</p>
                                </div>
                            </div>
                            <div className="p-6 bg-white border border-gray-200 rounded-xl flex gap-4 shadow-sm">
                                <Lock className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg" id="authentication">Authentication</h3>
                                    <p className="text-gray-600 mt-1">If using the cloud sync endpoints, OAuth JWT tokens are required. Local endpoints are unrestricted by default due to host binding.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-16">
                            {/* Endpoint listing */}
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 border-b border-gray-200 pb-4 mb-8" id="activities">Core Endpoints</h2>
                                <div className="space-y-12">
                                    {endpoints.map((ep, idx) => (
                                        <div key={idx} className="scroll-mt-32">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className={`px-2 py-1 text-xs font-bold rounded-md ${ep.method === 'POST' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {ep.method}
                                                </span>
                                                <code className="text-sm font-mono font-medium text-gray-900">{ep.path}</code>
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">{ep.title}</h3>
                                            <p className="text-gray-600 mb-4">{ep.desc}</p>

                                            {ep.body && (
                                                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 overflow-hidden">
                                                    <div className="text-xs font-mono text-gray-400 mb-2 border-b border-gray-800 pb-2">Example Request Body</div>
                                                    <pre className="text-sm font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                                                        {ep.body}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <Footer />
                </div>
            </main>
        </div>
    );
}
