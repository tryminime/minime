import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Database, GitCommit, Clock, Network, BrainCircuit, Route, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Intelligence Graph | MiniMe Features',
  description: 'Your Digital Brain, Mapped. Stop losing context with MiniMe.',
};

export default function KnowledgeGraphPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <MarketingNav />

      <main>
        {/* The Paradigm Shift (Hero) */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <Database className="w-8 h-8" />
            </div>
            <h1 className="text-display-h1 font-display font-bold leading-tight mb-6">
              Your Digital Brain,<br />
              <span className="text-gradient">Mapped in Real-Time.</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-10">
              The old way: Scouring Slack, Notion, and Jira trying to remember what you worked on last Tuesday. <br className="hidden md:block" />
              The MiniMe way: An automated, local Neo4j graph that connects your code, documents, and meetings silently in the background.
            </p>
          </div>
        </section>

        {/* The Core Engine (Bento Grid) */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-display font-bold mb-4 text-text-primary">How the Graph Organizes the Chaos.</h2>
             <p className="text-lg text-text-secondary">We transform unstructured noise into a highly structured semantic web.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Semantic Deduplication (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6">
                     <BrainCircuit className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Semantic Deduplication & Clustering</h3>
                  <p className="text-text-secondary mb-8 max-w-lg">
                    MiniMe's local vector extraction embeds every window title and document you touch. It knows that "Project-Alpha" and "Proj. Alpha" are the same entity, automatically merging them into a unified node.
                  </p>
                  
                  {/* Visualizer */}
                  <div className="mt-auto bg-bg-base border border-border rounded-xl p-6 shadow-inner">
                     <div className="flex flex-wrap items-center gap-3">
                       <span className="px-3 py-1.5 border border-red-500/30 bg-red-500/10 rounded-lg text-xs text-red-500 font-mono line-through opacity-70">Project-Alpha</span>
                       <GitCommit className="text-text-muted w-4 h-4" />
                       <span className="px-3 py-1.5 border border-blue-500/30 bg-blue-500/10 rounded-lg text-xs text-blue-500 font-mono line-through opacity-70">Proj. Alpha</span>
                       <GitCommit className="text-text-muted w-4 h-4" />
                       <span className="px-4 py-2 border border-green-500/30 bg-green-500/10 rounded-lg text-sm text-green-500 font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)]">Project Alpha Node</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* Bento Card 2: Knowledge Decay */}
            <div className="bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-6">
                     <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Knowledge Decay</h3>
                  <p className="text-text-secondary mb-8">
                    Concepts fade. Our algorithms detect when your knowledge on a topic is getting rusty and visually flag it in the graph.
                  </p>
                  <div className="mt-auto">
                      <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm text-text-primary">Rust Lifetimes</span>
                          <span className="text-[10px] text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Decaying</span>
                      </div>
                      <div className="w-full bg-bg-base border border-border h-2 rounded-full overflow-hidden">
                          <div className="w-[15%] bg-orange-500 h-full rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]"></div>
                      </div>
                      <p className="text-[10px] text-text-muted mt-3 font-mono">Last accessed: 42 days ago</p>
                  </div>
               </div>
            </div>

            {/* Bento Card 3: Community Detection */}
            <div className="bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-6">
                     <Network className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Community Detection</h3>
                  <p className="text-text-secondary mb-6">
                    Stop manually sorting things into folders. Watch your projects naturally group themselves into thematic clusters entirely based on your actual behavior.
                  </p>
                  <div className="h-40 bg-bg-base border border-border rounded-xl relative overflow-hidden flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-500">
                        <circle cx="30" cy="50" r="15" fill="currentColor" opacity="0.1" />
                        <circle cx="70" cy="50" r="20" fill="currentColor" opacity="0.1" />
                        <circle cx="30" cy="50" r="4" fill="currentColor" />
                        <circle cx="22" cy="42" r="3" fill="currentColor" opacity="0.7" />
                        <circle cx="70" cy="50" r="5" fill="currentColor" />
                        <circle cx="60" cy="40" r="3" fill="currentColor" opacity="0.7" />
                        <line x1="30" y1="50" x2="22" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                        <line x1="70" y1="50" x2="60" y2="40" stroke="currentColor" strokeWidth="1" opacity="0.5" />
                        <line x1="30" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" opacity="0.3" />
                    </svg>
                  </div>
               </div>
            </div>

            {/* Bento Card 4: Learning Paths (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full items-center">
                  <div className="flex-1">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                         <Route className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Learning Recommendations</h3>
                      <p className="text-text-secondary">
                        Based on your active projects and knowledge gaps, MiniMe synthesizes custom curricula. It charts a direct learning path using your own historical research and saved references.
                      </p>
                  </div>
                  <div className="flex-1 w-full bg-bg-base border border-border rounded-xl p-6 shadow-inner">
                      <div className="space-y-4 relative">
                          <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-border z-0"></div>
                          <div className="flex items-center gap-4 relative z-10 opacity-50">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex-shrink-0"></div>
                              <span className="text-sm text-text-secondary line-through">Vector DB Basics</span>
                          </div>
                          <div className="flex items-center gap-4 relative z-10">
                              <div className="w-6 h-6 rounded-full bg-emerald-500 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex-shrink-0"></div>
                              <span className="font-semibold text-text-primary">Advanced HNSW Indexing</span>
                          </div>
                          <div className="flex items-center gap-4 relative z-10 opacity-40">
                              <div className="w-6 h-6 rounded-full bg-bg-surface border-2 border-border flex-shrink-0"></div>
                              <span className="text-sm text-text-secondary">Production Deployment</span>
                          </div>
                      </div>
                  </div>
               </div>
            </div>

          </div>
        </section>

        {/* Technical Deep Dive */}
        <section className="py-24 bg-elevated/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">The Graph Architecture</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                MiniMe doesn't just store flat logs. It utilizes a state-of-the-art local data pipeline to continuously compile an ontological map of your universe.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-3xl bg-bg-base border border-border shadow-lg">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 text-indigo-500 font-bold font-mono">01</div>
                <h4 className="text-xl font-bold mb-3">Passive Ingestion</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Browser extensions and native Tauri watchers observe your active window, URL, and application state. Data flows directly to your local machine via HTTP bridging.</p>
              </div>
              <div className="p-8 rounded-3xl bg-bg-base border border-border shadow-lg">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 text-indigo-500 font-bold font-mono">02</div>
                <h4 className="text-xl font-bold mb-3">NLP Enrichment</h4>
                <p className="text-sm text-text-secondary leading-relaxed">A local Celery worker runs spaCy and BERT pipelines to organically extract Persons, Organizations, Technologies, and Concepts from unstructured window titles and HTML bodies.</p>
              </div>
              <div className="p-8 rounded-3xl bg-bg-base border border-border shadow-lg">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center mb-4 text-indigo-500 font-bold font-mono">03</div>
                <h4 className="text-xl font-bold mb-3">Neo4j Graph Storage</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Entities and activities are linked in a local Neo4j database, allowing complex multi-hop queries like <span className="text-indigo-400 font-mono text-xs">MATCH (d:Doc)-[:RELATED_TO]-&gt;(p:Person)</span> locally.</p>
              </div>
            </div>
          </div>
        </section>

        {/* "Perfect For" Section */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-indigo-900/10 border-2 border-indigo-500/20 rounded-[2rem] p-10 lg:p-16 text-center">
                <h2 className="text-3xl font-display font-bold mb-8">Perfect for Context-Heavy Professionals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Software Engineers</span>
                            <span className="text-sm text-text-secondary">Linking pull requests, JIRA tickets, and StackOverflow searches into a single project node.</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Product Managers</span>
                            <span className="text-sm text-text-secondary">Tying customer interviews, Figma designs, and Slack threads to the exact feature spec.</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Researchers</span>
                            <span className="text-sm text-text-secondary">Automatically mapping academic PDFs, Wikipedia rabbitholes, and draft documents.</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-indigo-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Founders</span>
                            <span className="text-sm text-text-secondary">Remembering exactly who you pitched sequentially and what documents were referenced.</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* The Clean Handoff (Bottom CTA) */}
        <section className="py-24 text-center border-t border-border bg-elevated/30">
            <h2 className="text-3xl font-display font-bold mb-6">Your data is connected. Now what?</h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
                See how MiniMe uses your graph to forecast your productivity and optimize your deep work limits.
            </p>
            <Link
                href="/features/analytics"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors shadow-lg shadow-indigo-500/25 hover:-translate-y-1"
            >
                Explore Deep Analytics
            </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
