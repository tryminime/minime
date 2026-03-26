import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Sparkles, Mic, Puzzle, FileText, Bell, CheckCircle2, ShieldCheck, Database, Box } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'AI Copilot | MiniMe Features',
  description: 'Your Private Chief of Staff. Ask questions about your life using natural language.',
};

export default function AiAssistantPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <MarketingNav />

      <main>
        {/* The Paradigm Shift (Hero) */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mb-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-display-h1 font-display font-bold leading-tight mb-6">
              Your Private<br />
              <span className="text-gradient hover:to-cyan-400 transition-colors duration-1000">Chief of Staff.</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-10">
              The old way: Pasting your sensitive company data into ChatGPT and hoping for the best.<br className="hidden md:block"/>
              The MiniMe way: An open-weights local LLM that can chat with your entire digital footprint without a single byte leaving your machine.
            </p>
          </div>
        </section>

        {/* The Core Engine (Bento Grid) */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-display font-bold mb-4 text-text-primary">Omniscient, yet completely air-gapped.</h2>
             <p className="text-lg text-text-secondary">Ask natural language questions about your own life.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: RAG Citations (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full items-center">
                  <div className="flex-1">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6">
                         <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Flawless RAG Citations</h3>
                      <p className="text-text-secondary mb-6 block">
                        Hallucinations are unacceptable for your personal data. 
                        Every UI answer cites its exact local sources—whether it was a Slack message you read yesterday or a PDF you scrolled through last week.
                      </p>
                  </div>
                  <div className="flex-1 w-full bg-bg-base border border-border rounded-xl p-6 shadow-inner relative">
                      <div className="absolute top-3 right-3 flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                      </div>
                      <div className="mt-6 flex flex-col gap-4">
                          <div className="bg-elevated p-4 rounded-xl text-sm text-text-primary border border-border shadow-sm leading-relaxed">
                              "You discussed the new auth flow with Mark <span className="text-[10px] align-super text-indigo-500 cursor-pointer font-bold bg-indigo-500/10 px-1 rounded ml-0.5">[1]</span> and drafted the spec in Figma <span className="text-[10px] align-super text-indigo-500 cursor-pointer font-bold bg-indigo-500/10 px-1 rounded ml-0.5">[2]</span>."
                          </div>
                          <div className="flex flex-col gap-2 mt-1 border-t border-border pt-4">
                              <div className="text-xs text-text-muted flex items-center gap-2 hover:bg-bg-surface p-1.5 rounded transition-colors border border-transparent hover:border-border"><span className="font-bold text-indigo-500 bg-indigo-500/10 px-1.5 rounded">[1]</span> Slack: #engineering (10:42 AM)</div>
                              <div className="text-xs text-text-muted flex items-center gap-2 hover:bg-bg-surface p-1.5 rounded transition-colors border border-transparent hover:border-border"><span className="font-bold text-indigo-500 bg-indigo-500/10 px-1.5 rounded">[2]</span> Desktop: Auth_Flow.fig (1:15 PM)</div>
                          </div>
                      </div>
                  </div>
               </div>
            </div>

            {/* Bento Card 2: Voice I/O */}
            <div className="bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-blue-500/30 transition-colors flex flex-col items-center text-center">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col h-full items-center justify-center">
                  <h3 className="text-2xl font-bold mb-3">Native Voice UI</h3>
                  <p className="text-text-secondary text-sm mb-8">
                    Talk directly to MiniMe hands-free using Web Speech API dictation.
                  </p>
                  
                  <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center relative shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                      <Mic className="w-10 h-10 text-blue-500 relative z-10" />
                      <div className="absolute inset-0 rounded-full border border-blue-500 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                      <div className="absolute inset-0 rounded-full border border-blue-500 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-500"></div>
                  </div>
               </div>
            </div>

            {/* Bento Card 3: Proactive Insights */}
            <div className="bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-6">
                     <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Proactive System Insights</h3>
                  <p className="text-text-secondary text-sm mb-8">
                    You don't always have to ask. MiniMe observes your habits and sends unintrusive push notifications with high-value suggestions.
                  </p>
                  <div className="mt-auto w-full bg-elevated border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] p-4 relative z-10 hover:-translate-y-1 transition-transform">
                      <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                              <h4 className="font-semibold text-text-primary text-sm">Flow State Warning</h4>
                              <p className="text-xs text-text-secondary mt-1">You've been deep in focus for 2.5 hours. Taking a break now will boost afternoon retention by 40%.</p>
                          </div>
                      </div>
                  </div>
               </div>
            </div>

            {/* Bento Card 4: Agentic Plugins (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-teal-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-tl from-teal-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full items-center">
                  <div className="flex-1 w-full bg-bg-base border border-border rounded-xl p-6 shadow-inner space-y-3">
                      <div className="flex items-center justify-between p-3.5 bg-elevated border border-teal-500/30 rounded-xl shadow-[0_0_15px_rgba(20,184,166,0.1)]">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-teal-500/10 rounded-lg"><FileText className="w-4 h-4 text-teal-500" /></div>
                              <div className="flex flex-col">
                                  <span className="font-semibold text-text-primary text-sm">Meeting Summarizer</span>
                                  <span className="text-teal-500 text-[10px] font-bold uppercase tracking-wider">Active Plugin</span>
                              </div>
                          </div>
                          <div className="w-10 h-5 bg-teal-500 rounded-full relative shadow-[0_0_10px_rgba(20,184,166,0.3)]"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div></div>
                      </div>
                      <div className="flex items-center justify-between p-3.5 bg-bg-surface border border-border rounded-xl opacity-60 hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-bg-base border border-border rounded-lg"><Box className="w-4 h-4 text-text-muted" /></div>
                              <div className="flex flex-col">
                                  <span className="font-medium text-text-primary text-sm">Email Drafter</span>
                                  <span className="text-text-muted text-[10px] uppercase tracking-wider">1-Click Install</span>
                              </div>
                          </div>
                          <div className="w-10 h-5 bg-elevated border border-border rounded-full relative"><div className="w-4 h-4 bg-text-muted rounded-full absolute left-0.5 top-0.5 shadow-sm"></div></div>
                      </div>
                  </div>
                  <div className="flex-1">
                      <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-6">
                         <Puzzle className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Agentic Plugins</h3>
                      <p className="text-text-secondary leading-relaxed">
                        Your AI Copilot doesn't just answer questions; it takes action. Extend MiniMe's capabilities by installing local plugins to automate repetitive tasks based on your graph data.
                      </p>
                  </div>
               </div>
            </div>

          </div>
        </section>

        {/* Technical Deep Dive: Local LLMs */}
        <section className="py-24 bg-elevated/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">BYO Intelligence.</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Your private Chief of Staff is powered by state-of-the-art weights running directly on your hardware, connected to your semantic vector store.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                    <Box className="w-8 h-8 text-indigo-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">Ollama Native</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Seamlessly connect to Ollama to run Llama 3, Mistral, or WebLLM entirely locally ensuring absolute zero-trust execution for sensitive queries.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                    <Database className="w-8 h-8 text-indigo-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">Qdrant Vector DB</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Semantic search is powered by a local Qdrant instance, enabling lightning-fast Retrieval-Augmented Generation mapped directly back to Neo4j.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                    <ShieldCheck className="w-8 h-8 text-indigo-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">AES Encrypted API Keys</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Need more reasoning power? Opt-in to use OpenAI or Anthropic directly. Your keys are stored locally and encrypted using AES-256-GCM.</p>
              </div>
            </div>
          </div>
        </section>

        {/* "Perfect For" Section */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-cyan-900/10 border-2 border-cyan-500/20 rounded-[2rem] p-10 lg:p-16 text-center">
                <h2 className="text-3xl font-display font-bold mb-8">Perfect for Information Hoarders.</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-cyan-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Busy Executives</span>
                            <span className="text-sm text-text-secondary">"Summarize all my Slack messages and unread emails from the last 4 hours while I was in meetings."</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-cyan-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Researchers</span>
                            <span className="text-sm text-text-secondary">"Which PDF contained the neural network diagram that I was reading yesterday morning?"</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-cyan-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Engineers</span>
                            <span className="text-sm text-text-secondary">"What file was I editing when I encountered that WebGL rendering error right before lunch?"</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-cyan-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Writers</span>
                            <span className="text-sm text-text-secondary">"Pull up the character notes doc I briefly opened last week about the main antagonist."</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* The Clean Handoff (Bottom CTA) */}
        <section className="py-24 text-center border-t border-border bg-elevated/30">
            <h2 className="text-3xl font-display font-bold mb-6">Ready to run it locally?</h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
                Discover the hyper-optimized Rust architecture that powers the Desktop Guardian tracking agent.
            </p>
            <Link
                href="/platform/desktop"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors shadow-lg shadow-indigo-500/25 hover:-translate-y-1"
            >
                Explore Desktop Architecture
            </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
