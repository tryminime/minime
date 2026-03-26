import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Lock, FileKey, ShieldCheck, Database, ServerOff, HardDrive, KeyRound } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Zero-Trust Security | MiniMe Platform',
  description: 'Your data never leaves your device. Learn about our local-first architecture.',
};

export default function SecurityPlatformPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <MarketingNav />

      <main>
        {/* The Paradigm Shift (Hero) */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-8 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-display-h1 font-display font-bold leading-tight mb-6">
              Zero-Trust <br />
              <span className="text-gradient hover:to-emerald-400 transition-colors duration-1000">Architecture.</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-10">
              The old way: Trusting a silicon valley corporation with the raw contents of your screen and clipboard.<br className="hidden md:block" />
              The MiniMe way: We bring the entire cloud stack directly to your `localhost`. Absolute isolation.
            </p>
          </div>
        </section>

        {/* The Core Engine (Bento Grid) */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-display font-bold mb-4 text-text-primary">Securing the Intelligence Engine.</h2>
             <p className="text-lg text-text-secondary">Enterprise-grade cryptography running silently on your CPU.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Air-Gapped Backend (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full items-center">
                  <div className="flex-1">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                         <ServerOff className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">The `localhost` Backend</h3>
                      <p className="text-text-secondary mb-6 block">
                        MiniMe utilizes embedded databases natively instead of relying on external cloud connections. The entire stack spins up locally under port <span className="font-mono text-emerald-500 bg-emerald-500/10 px-1 rounded">8000</span>.
                      </p>
                  </div>
                  <div className="flex-1 w-full bg-[#0d1117] border border-border rounded-xl p-6 shadow-inner relative overflow-hidden">
                      <div className="absolute top-3 right-3 flex gap-1.5 opacity-50">
                          <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">NETWORK: NONE</span>
                      </div>
                      <div className="mt-4 flex flex-col gap-3 font-mono text-xs text-slate-300">
                          <div className="flex justify-between items-center p-2 rounded bg-white/5 border border-border hover:bg-white/10 transition-colors">
                              <span className="flex items-center gap-2"><Database className="w-3 h-3 text-blue-400" /> SQLite Core</span>
                              <span className="text-emerald-400">ACTIVE</span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-white/5 border border-border hover:bg-white/10 transition-colors">
                              <span className="flex items-center gap-2"><Database className="w-3 h-3 text-pink-400" /> Neo4j Graph</span>
                              <span className="text-emerald-400">ACTIVE</span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-white/5 border border-border hover:bg-white/10 transition-colors">
                              <span className="flex items-center gap-2"><Database className="w-3 h-3 text-orange-400" /> Qdrant Vector</span>
                              <span className="text-emerald-400">ACTIVE</span>
                          </div>
                      </div>
                  </div>
               </div>
            </div>

            {/* Bento Card 2: Local Master Key */}
            <div className="bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-amber-500/30 transition-colors flex flex-col">
               <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
                     <KeyRound className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Self-Custody Master Key</h3>
                  <p className="text-text-secondary text-sm mb-8">
                    During onboarding, a 256-bit decryption key is heavily generated natively on your device. We literally cannot read your data because we never see the key.
                  </p>
                  <div className="mt-auto flex items-center gap-3 p-3 bg-bg-base border border-border rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                          <Lock className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex flex-col">
                          <span className="text-sm font-bold text-text-primary">Recovery Key</span>
                          <span className="text-[10px] text-text-muted">Do NOT lose this offline code.</span>
                      </div>
                  </div>
               </div>
            </div>

            {/* Bento Card 3: AES Encryption (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-tl from-indigo-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full items-center">
                  <div className="flex-1 w-full bg-bg-base border border-border rounded-xl p-6 shadow-inner space-y-4">
                      <div className="flex items-center justify-between text-sm">
                          <span className="font-mono text-text-muted">raw_activity_log</span>
                          <span className="text-indigo-500 font-bold px-2 py-0.5 bg-indigo-500/10 rounded">AES-256-GCM</span>
                      </div>
                      <div className="font-mono text-[10px] text-text-muted break-all p-3 bg-white/5 rounded border border-border opacity-70">
                          U2FsdGVkX19zO/w1D/M9M3+9K9F...+2zF9A=
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-500 justify-center">
                          <ShieldCheck className="w-4 h-4" /> Integrity Verified (GCM Auth Tag)
                      </div>
                  </div>
                  <div className="flex-1">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6">
                         <HardDrive className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Military-Grade Encryption</h3>
                      <p className="text-text-secondary leading-relaxed">
                        Even if your laptop is physically stolen or compromised, your knowledge graph remains impenetrable. Every row written to the database is encrypted using AES-256 in Galois/Counter Mode (GCM).
                      </p>
                  </div>
               </div>
            </div>

            {/* Bento Card 4: Open Source */}
            <div className="bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-cyan-500/30 transition-colors flex flex-col items-center text-center">
               <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col h-full items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mb-6">
                     <FileKey className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Audit the Code.</h3>
                  <p className="text-text-secondary text-sm mb-0">
                    Don't trust our marketing. The entire data processing pipeline and local storage architecture is source-available for your security team to audit.
                  </p>
               </div>
            </div>

          </div>
        </section>

        {/* The Clean Handoff (Bottom CTA) */}
        <section className="py-24 text-center border-t border-border bg-elevated/30">
            <h2 className="text-3xl font-display font-bold mb-6">Ready to regain control of your data?</h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
                Join the thousands of professionals building their Personal Intelligence Engines securely.
            </p>
            <Link
                href="/download"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors shadow-lg shadow-indigo-500/25 hover:-translate-y-1"
            >
                Download MiniMe
            </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
