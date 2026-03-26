import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { 
  Activity, Lock, Network, Brain, Zap, BarChart3, ChevronRight, 
  Github, Calendar, FileText, ShieldCheck, Monitor, Map, 
  MessageSquare, LayoutDashboard, Settings, Building2, Search, CheckCircle2, Database 
} from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <MarketingNav />

      <main>
        {/* Header */}
        <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 text-center border-b border-border bg-gradient-to-b from-bg-surface to-bg-base">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 mb-8">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-400 tracking-wide uppercase">150+ Features Across 14 Modules</span>
            </div>
            <h1 className="text-display-h1 font-display font-bold tracking-tight mb-6">
              Intelligence from every <span className="text-gradient">idle moment.</span>
            </h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto text-balance">
              MiniMe isn’t just a time tracker. It’s an automated intelligence layer sitting on top of your daily workflows, built entirely on your local machine.
            </p>
          </div>
        </section>

        {/* Main Feature Showcases (Bento-style rows) */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-32">
          {/* Feature 1: Auto Tracking */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                <Activity className="w-6 h-6 text-indigo-500" />
              </div>
              <h2 className="text-3xl font-display font-bold text-text-primary">Passive Auto-Tracking</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                MiniMe runs silently in the background, capturing active window titles, application usage, browser URLs, read time, and social media patterns. No manual entry, no timers to click. Everything is encrypted locally.
              </p>
            </div>
            <div className="flex-1 w-full bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border rounded-[2rem] p-4 shadow-soft">
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden bg-bg-surface border border-border/50 flex flex-col items-center justify-center p-8">
                {/* Mock UI for Activity List */}
                <div className="w-full space-y-3">
                  {['VS Code - AuthController.ts', 'Figma - Landing Page Design', 'Chrome - React Docs', 'Slack - #engineering'].map((act, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-elevated rounded-xl border border-border/50 animate-fade-up" style={{ animationDelay: `${i * 150}ms` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                        <span className="font-mono text-sm">{act}</span>
                      </div>
                      <span className="text-xs text-text-muted">{i === 0 ? 'Just now' : `${i * 5}m ago`}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-bg-surface to-transparent pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Feature 2: Knowledge Graph Demo */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                <Network className="w-6 h-6 text-cyan-500" />
              </div>
              <h2 className="text-3xl font-display font-bold text-text-primary">Semantic Knowledge Graph</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                We convert your raw activity logs into an interactive, visual Neo4j graph mapping your projects, skills, documents, and people you worked with. See the macro trends of your career.
              </p>
              <div className="pt-4">
                <Link href="/features/knowledge-graph" className="text-cyan-500 font-semibold hover:text-cyan-400 flex items-center gap-1 group">
                   Explore Intelligence Graph <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border rounded-[2rem] p-4 shadow-soft">
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden bg-bg-surface border border-border/50 flex items-center justify-center group overflow-hidden">
                <div className="w-full h-full text-cyan-500/20 group-hover:text-cyan-500/40 group-hover:scale-105 transition-all duration-700">
                  <svg viewBox="0 0 100 100" className="w-full h-full fill-current stroke-current">
                    <circle cx="50" cy="50" r="10" className="animate-pulse shadow-[0_0_20px_cyan] text-indigo-500/80" />
                    <circle cx="20" cy="30" r="5" className="text-blue-400" />
                    <circle cx="80" cy="30" r="7" className="text-green-400" />
                    <circle cx="20" cy="70" r="6" className="text-purple-400" />
                    <circle cx="80" cy="70" r="8" className="text-yellow-400" />
                    <circle cx="35" cy="85" r="4" className="text-pink-400" />
                    <circle cx="65" cy="15" r="5" className="text-orange-400" />
                    <line x1="50" y1="50" x2="20" y2="30" strokeWidth="1" className="opacity-50 text-border" />
                    <line x1="50" y1="50" x2="80" y2="30" strokeWidth="1" className="opacity-50 text-border" />
                    <line x1="50" y1="50" x2="20" y2="70" strokeWidth="1" className="opacity-50 text-border" />
                    <line x1="50" y1="50" x2="80" y2="70" strokeWidth="1" className="opacity-50 text-border" />
                    <line x1="80" y1="70" x2="35" y2="85" strokeWidth="1" className="opacity-30 text-border" />
                    <line x1="20" y1="30" x2="65" y2="15" strokeWidth="1" className="opacity-30 text-border" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 bg-elevated/80 backdrop-blur-md border border-border rounded-lg p-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Auto-generated relationships</span>
                      <span className="text-xs text-cyan-400">99% confidence</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 3: Full Copilot */}
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <Brain className="w-6 h-6 text-purple-500" />
              </div>
              <h2 className="text-3xl font-display font-bold text-text-primary">Personal AI Copilot</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                Chat with your work history using RAG. Ask "What did I work on last Tuesday?" or "Summarize my contributions to the React migration project." MiniMe uses your graph to answer instantly, powered by local LLMs (Ollama) or OpenAI.
              </p>
              <div className="pt-4">
                <Link href="/features/ai-assistant" className="text-purple-600 dark:text-purple-500 font-semibold hover:text-purple-500 dark:hover:text-purple-400 flex items-center gap-1 group">
                   Meet your AI Copilot <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border rounded-[2rem] p-4 shadow-soft">
              <div className="aspect-[4/3] relative rounded-2xl overflow-hidden bg-bg-surface border border-border/50 flex flex-col p-6">
                <div className="flex-1 space-y-4">
                  <div className="bg-elevated border border-border rounded-xl p-4 rounded-tr-none ml-auto max-w-[80%]">
                    <p className="text-sm">Generate a standup report for my activities yesterday.</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 rounded-tl-none mr-auto max-w-[90%]">
                    <p className="text-sm text-indigo-900 dark:text-indigo-100 mb-2">Yesterday, you focused heavily on the Authentication flow:</p>
                    <ul className="text-sm text-indigo-800 dark:text-indigo-100/80 list-disc ml-4 space-y-1">
                      <li>3 hours refactoring `server.rs`</li>
                      <li>45-minute sync with the ops team</li>
                      <li>Read 2 articles on JWT token rotation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 4: Weekly Digest Showcase */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                <Calendar className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-3xl font-display font-bold text-text-primary">Intelligent Weekly Digest</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                Every Friday, MiniMe analyzes your local data and produces an AI-synthesized Weekly Digest. See your top projects, deep work metrics, and an automated summary of where your time went. Perfect for retrospectives and performance reviews.
              </p>
              <div className="pt-4">
                <Link href="/features/analytics" className="text-orange-500 font-semibold hover:text-orange-400 flex items-center gap-1 group">
                   Explore Deep Analytics <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-xl border border-border rounded-[2rem] p-4 shadow-soft">
              <div className="aspect-[4/3] bg-bg-surface border border-border/50 rounded-2xl p-6 flex flex-col relative overflow-hidden">
                 <div className="flex items-center justify-between mb-4 border-b border-border pb-4">
                    <h4 className="font-bold">Weekly Digest</h4>
                    <span className="text-xs text-text-muted">Mar 1 - Mar 7</span>
                 </div>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-text-secondary">Deep Work</span>
                       <span className="font-bold text-green-400">28h 45m</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-text-secondary">Context Switches</span>
                       <span className="font-bold text-orange-400">142</span>
                    </div>
                    <div className="h-px bg-border my-2" />
                    <p className="text-sm text-text-secondary line-clamp-3">
                       This week, you primarily focused on the <span className="text-indigo-400 font-semibold">Frontend Rewrite</span> project. You successfully integrated 3 new APIs and spent significant time reading documentation on Next.js...
                    </p>
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-bg-surface to-transparent" />
              </div>
            </div>
          </div>
          
          {/* Feature 5: Integration Showcase */}
          <div className="flex flex-col items-center">
             <div className="text-center max-w-2xl mx-auto mb-12">
               <h2 className="text-3xl font-display font-bold text-text-primary mb-4">Seamless Integrations</h2>
               <p className="text-lg text-text-secondary">
                 MiniMe connects to your external tools to enrich your local activity graph. We currently support three powerful live integrations to augment your work context.
               </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                {/* GitHub */}
                <div className="p-8 bg-elevated border border-border rounded-3xl hover:border-indigo-500/30 transition-colors group">
                   <div className="w-14 h-14 bg-bg-surface border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                      <Github className="w-7 h-7 text-text-primary" />
                   </div>
                   <h3 className="text-xl font-bold mb-3">GitHub Integration</h3>
                   <p className="text-text-secondary text-sm">Automatically syncs your commits, PRs, and issue activity into your knowledge graph to connect code changes with active window time.</p>
                </div>
                {/* Google Calendar */}
                <div className="p-8 bg-elevated border border-border rounded-3xl hover:border-indigo-500/30 transition-colors group">
                   <div className="w-14 h-14 bg-bg-surface border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                      <Calendar className="w-7 h-7 text-blue-500" />
                   </div>
                   <h3 className="text-xl font-bold mb-3">Google Calendar</h3>
                   <p className="text-text-secondary text-sm">Correlates your scheduled meetings with actual screen activity. Analyzes meeting load versus focus time autonomously.</p>
                </div>
                {/* Notion */}
                <div className="p-8 bg-elevated border border-border rounded-3xl hover:border-indigo-500/30 transition-colors group">
                   <div className="w-14 h-14 bg-bg-surface border border-border rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                      <FileText className="w-7 h-7 text-text-primary" />
                   </div>
                   <h3 className="text-xl font-bold mb-3">Notion Integration</h3>
                   <p className="text-text-secondary text-sm">Pulls in your workspace documents to understand project context. Maps your desktop app usage back to Notion deliverables.</p>
                </div>
             </div>
          </div>
        </section>

        {/* Massive Feature Matrix Section */}
        <section className="py-32 bg-bg-surface border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl font-display font-bold text-text-primary mb-6">The Complete Feature Scope.</h2>
              <p className="text-xl text-text-secondary">
                MiniMe is an ambitious platform designed to be the ultimate intelligence layer. Here is everything built, and everything coming.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {/* 1. Activity Capture */}
               <div className="bg-bg-base border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <Monitor className="w-6 h-6 text-indigo-500" />
                     <h3 className="text-lg font-bold">Activity Capture</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-secondary">
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Desktop window tracking</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> App usage time tracking</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Title capture (privacy-filtered)</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Idle & break tracking</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Offline queueing (SQLite)</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Web URL/domain tracking</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Time on page / reading analytics</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Social media detection</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Video detection (YouTube/Netflix)</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Search query capture</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Keystroke rate monitoring</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Mouse activity patterns</li>
                  </ul>
               </div>

               {/* 2. Data Enrichment & NER */}
               <div className="bg-bg-base border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <Database className="w-6 h-6 text-blue-500" />
                     <h3 className="text-lg font-bold">Data Enrichment</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-secondary">
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Entity extraction from titles</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Project/skill extraction</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Organization extraction</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Relationship inference</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Context enrichment</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Auto-tagging</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Entity deduplication (99% clustering)</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Confidence scoring</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Multi-language support</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Temporal pattern recognition</li>
                  </ul>
               </div>

               {/* 3. Knowledge Graph */}
               <div className="bg-bg-base border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <Network className="w-6 h-6 text-cyan-500" />
                     <h3 className="text-lg font-bold">Knowledge Graph</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-secondary">
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Graph building (8 node types)</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Relationship creation</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Edge weight calculation</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Temporal relationships</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Graph visualization</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Expertise discovery</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Learning path recommendations</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Collaboration patterns</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Cross-domain connections</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> PageRank expertise scoring</li>
                  </ul>
               </div>

               {/* 4. AI Assistant */}
               <div className="bg-bg-base border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <Brain className="w-6 h-6 text-purple-500" />
                     <h3 className="text-lg font-bold">AI Assistant</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-secondary">
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> RAG-based Q&amp;A (Qdrant)</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Multi-turn conversations</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Context awareness</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Daily summary generation</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Weekly insights</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Local LLM option (Ollama)</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Source attribution</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Proactive insights (push)</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Milestone celebrations</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Smart NLP search</li>
                  </ul>
               </div>
               
               {/* 5. Personal Analytics */}
               <div className="bg-bg-base border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <BarChart3 className="w-6 h-6 text-orange-500" />
                     <h3 className="text-lg font-bold">Personal Analytics</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-secondary">
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Productivity metrics</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Skill tracking</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Energy &amp; wellbeing</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Career analytics</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Collaboration analytics</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Deep work tracking (Advanced)</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Context switch analysis</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Break patterns logic</li>
                  </ul>
               </div>

               {/* 6. Dashboards & Settings */}
               <div className="bg-bg-base border border-border rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                     <LayoutDashboard className="w-6 h-6 text-pink-500" />
                     <h3 className="text-lg font-bold">Dashboards &amp; Settings</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-text-secondary">
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> 14+ Interactive views built</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Timeline virtualization</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Network graph view</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Local privacy controls</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Third-party Integration portal</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Report &amp; PDF generation</li>
                     <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" /> Notification engine</li>
                  </ul>
               </div>
               
               {/* 7. Enterprise Phase 2 */}
               <div className="bg-indigo-900/10 border-2 border-indigo-500/20 rounded-2xl p-6 lg:col-span-3 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl z-10">
                     Coming June 2026
                  </div>
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 relative z-10">
                     <Building2 className="w-8 h-8 text-indigo-400" />
                  </div>
                  <div className="flex-1 space-y-3 relative z-10">
                     <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Enterprise Modules</h3>
                     <p className="text-sm text-text-secondary max-w-3xl">
                        Phase 2 introduces 90+ massive features spanning 7 new modules specifically designed for aggregate organizational intelligence, while maintaining local-first privacy guarantees via federated learning and zero-knowledge proofs.
                     </p>
                     <div className="flex flex-wrap gap-2 pt-2">
                        {['Team Analytics (18)', 'Burnout Detection (12)', 'Org Insights (15)', 'Advanced Recs (10)', 'Compliance (8)', 'Knowledge Management (12)', 'Enterprise Integrations (10)'].map(mod => (
                           <span key={mod} className="text-xs bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                              {mod}
                           </span>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="mt-12 text-center text-sm text-text-muted flex items-center justify-center gap-2">
               <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Built &amp; Live
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 text-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-500/5" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl font-display font-bold text-text-primary mb-6">Experience the difference</h2>
            <p className="text-xl text-text-secondary mb-10">Download MiniMe today and start building your personal intelligence graph.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/download" className="px-8 py-4 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-500 transition-all shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:-translate-y-1">
                Download App
              </Link>
              <Link href="/platform/desktop" className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-text-primary font-semibold rounded-full border border-border hover:bg-elevated transition-colors">
                Explore the Platform <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div >
  );
}
