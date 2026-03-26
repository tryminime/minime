import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Monitor, Shield, Zap, Cpu, Download, Activity, Camera, TerminalSquare, Layers } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Desktop Guardian | MiniMe Platform',
  description: 'The Rust-powered Tauri desktop application that powers MiniMe.',
};

export default function DesktopPlatformPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <MarketingNav />

      <main>
        {/* The Paradigm Shift (Hero) */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
              <Monitor className="w-8 h-8" />
            </div>
            <h1 className="text-display-h1 font-display font-bold leading-tight mb-6">
              The Desktop <br />
              <span className="text-gradient hover:to-indigo-400 transition-colors duration-1000">Guardian.</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-10">
              MiniMe relies on a high-performance, completely local desktop daemon. Built in Rust and Tauri, it passively maps your work with near-zero resource overhead.
            </p>
          </div>
        </section>

        {/* The Core Engine (Bento Grid) */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-display font-bold mb-4 text-text-primary">Deep Work Mapping.</h2>
             <p className="text-lg text-text-secondary">Understanding context directly from the OS window manager.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Window Polling (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full items-center">
                  <div className="flex-1">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6">
                         <TerminalSquare className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">App Window Polling</h3>
                      <p className="text-text-secondary mb-6 block">
                        Captures active window titles and binary names every second to classify engineering vs communication work automatically.
                      </p>
                  </div>
                  <div className="flex-1 w-full bg-[#0d1117] border border-border rounded-xl p-6 shadow-inner relative overflow-hidden">
                      <div className="absolute top-3 left-3 flex gap-1.5 opacity-50">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                      </div>
                      <div className="mt-6 font-mono text-[10px] sm:text-xs text-indigo-300 leading-relaxed">
                        <div><span className="text-green-400">INFO</span> [minime_daemon] Starting window listener...</div>
                        <div className="mt-2 text-slate-500">Event: WindowChanged</div>
                        <div className="text-slate-300">App: <span className="text-indigo-400">"Visual Studio Code"</span></div>
                        <div className="text-slate-300">Title: <span className="text-indigo-400">"page.tsx - website"</span></div>
                        <div className="mt-2 text-slate-500">Event: StateChange</div>
                        <div className="text-slate-300">Status: <span className="text-green-400">ACTIVE (Input detected)</span></div>
                        <br />
                        <div><span className="text-green-400">INFO</span> [minime_nlp] Enqueueing telemetry chunk #4021</div>
                      </div>
                  </div>
               </div>
            </div>

            {/* Bento Card 2: Idle State */}
            <div className="bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-teal-500/30 transition-colors flex flex-col">
               <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center mb-6">
                     <Activity className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Active vs Idle State</h3>
                  <p className="text-text-secondary text-sm mb-8">
                    Detects global mouse and keyboard IO events. Pauses tracking automatically when you step away from the keyboard.
                  </p>
                  <div className="mt-auto flex items-center justify-between p-4 bg-bg-base border border-border rounded-xl">
                      <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                          </span>
                          <span className="text-sm font-bold text-text-primary">Tracking</span>
                      </div>
                      <span className="text-xs font-mono text-text-muted">14.2s ago</span>
                  </div>
               </div>
            </div>

            {/* Bento Card 3: Screenshot Memory (Spans 3 cols) */}
            <div className="md:col-span-3 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
                  <div className="flex-1 md:max-w-md">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                         <Camera className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Opt-in Screenshot Memory</h3>
                      <p className="text-text-secondary">
                        Unlock photographic memory. An extreme opt-in feature that securely captures low-resolution compressed desktop frames locally for highly advanced OCR indexing and visual RAG queries.
                      </p>
                  </div>
                  <div className="flex-1 w-full bg-bg-base border border-border rounded-xl p-2 shadow-inner overflow-hidden relative group/img">
                      <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/img:opacity-100 transition-opacity z-20 flex items-center justify-center backdrop-blur-[2px]">
                          <span className="bg-bg-surface border border-border px-4 py-2 rounded-lg text-sm font-bold shadow-xl flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-500" /> Locally Encrypted
                          </span>
                      </div>
                      <div className="aspect-video relative rounded-lg border border-border overflow-hidden bg-[url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-50 group-hover/img:grayscale-0 group-hover/img:opacity-100 transition-all duration-500" />
                  </div>
               </div>
            </div>

          </div>
        </section>

        {/* Technical Deep Dive: Rust Architecture */}
        <section className="py-24 bg-elevated/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">Rust Architecture</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Built for brutal performance. The desktop agent consumes less than 15MB of storage and runs invisibly in the background.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 rounded-[2rem] bg-bg-base border border-border shadow-soft relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <Cpu className="w-8 h-8 text-indigo-500 mb-6" />
                <h3 className="text-xl font-bold mb-3">Tauri Framework</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Leverages native OS webviews instead of shipping an entire bundled Chromium instance, resulting in binary sizes under 15MB that load instantly.
                </p>
              </div>
              
              <div className="p-8 rounded-[2rem] bg-bg-base border border-border shadow-soft relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <Zap className="w-8 h-8 text-teal-500 mb-6" />
                <h3 className="text-xl font-bold mb-3">Zero-Latency IPC</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  The frontend React UI strictly communicates with the backend daemon via native Rust Inter-Process Communication ensuring real-time reactivity.
                </p>
              </div>
              
              <div className="p-8 rounded-[2rem] bg-bg-base border border-border shadow-soft relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <Shield className="w-8 h-8 text-rose-500 mb-6" />
                <h3 className="text-xl font-bold mb-3">Air-Gapped Processing</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  All window activity logic runs strictly offline. It never dials out to cloud telemetry servers, maintaining absolute data sovereignty.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Download Section */}
        <section className="py-24 bg-bg-base border-b border-border text-center relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="max-w-4xl mx-auto px-4 relative z-10">
                <h2 className="text-3xl font-display font-bold mb-6">Install the Guardian.</h2>
                <p className="text-lg text-text-secondary mb-12 max-w-xl mx-auto">
                    Available natively for all major OS architectures. Open-source tracking binaries compiled and distributed securely.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-elevated border border-border rounded-2xl flex flex-col items-center hover:border-indigo-500/50 transition-colors">
                        <Monitor className="w-10 h-10 mb-4 text-text-primary" />
                        <h4 className="font-bold text-lg mb-1">macOS</h4>
                        <p className="text-xs text-text-secondary mb-6 font-mono">Apple Silicon & Intel</p>
                        <a href="/download" className="w-full py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm">
                            <Download className="w-4 h-4" /> Download .dmg
                        </a>
                    </div>
                    
                    <div className="p-6 bg-elevated border border-indigo-500/30 rounded-2xl flex flex-col items-center relative shadow-[0_0_30px_rgba(99,102,241,0.1)]">
                        <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">Most Popular</div>
                        <Layers className="w-10 h-10 mb-4 text-indigo-500" />
                        <h4 className="font-bold text-lg mb-1">Windows</h4>
                        <p className="text-xs text-text-secondary mb-6 font-mono">Windows 10 / 11</p>
                        <a href="/download" className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20">
                            <Download className="w-4 h-4" /> Download .msi
                        </a>
                    </div>
                    
                    <div className="p-6 bg-elevated border border-border rounded-2xl flex flex-col items-center hover:border-indigo-500/50 transition-colors">
                        <TerminalSquare className="w-10 h-10 mb-4 text-text-primary" />
                        <h4 className="font-bold text-lg mb-1">Linux</h4>
                        <p className="text-xs text-text-secondary mb-6 font-mono">Debian / Ubuntu / Arch</p>
                        <a href="/download" className="w-full py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors text-sm flex items-center justify-center gap-2 shadow-sm">
                            <Download className="w-4 h-4" /> Download .AppImage
                        </a>
                    </div>
                </div>
            </div>
        </section>

        {/* The Clean Handoff (Bottom CTA) */}
        <section className="py-24 text-center bg-elevated/30">
            <h2 className="text-3xl font-display font-bold mb-6">Beyond the Desktop.</h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
                The desktop agent maps your window titles, but MiniMe doesn't stop there. Map your exact digital diet natively inside your browser.
            </p>
            <Link
                href="/platform/extensions"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors shadow-lg shadow-indigo-500/25 hover:-translate-y-1"
            >
                Explore Browser Intelligence
            </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
