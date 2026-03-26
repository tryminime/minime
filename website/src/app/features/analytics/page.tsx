import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { BarChart3, TrendingUp, Target, SplitSquareHorizontal, Coffee, CheckCircle2, ShieldCheck, Cpu, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Deep Analytics | MiniMe Features',
  description: 'Master Your Deep Work. Move from hours tracked to impact made.',
};

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <MarketingNav />

      <main>
        {/* The Paradigm Shift (Hero) */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 mb-8 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h1 className="text-display-h1 font-display font-bold leading-tight mb-6">
              Master Your<br />
              <span className="text-gradient hover:to-orange-500 transition-colors duration-1000">Deep Work.</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-10">
              The old way: Trying to manually log hours into a spreadsheet and wondering where the day went. <br className="hidden md:block"/>
              The MiniMe way: Passive analytics that measure context switches, flow state quality, and actively forecast your burnout.
            </p>
          </div>
        </section>

        {/* The Core Engine (Bento Grid) */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-display font-bold mb-4 text-text-primary">Analytics That Actually Drive Change.</h2>
             <p className="text-lg text-text-secondary">Stop measuring time. Start measuring focus.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Context Switch Analysis (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-red-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full items-center">
                  <div className="flex-1">
                      <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
                         <SplitSquareHorizontal className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Context Switch Analysis</h3>
                      <p className="text-text-secondary mb-6">
                        Costly interruptions kill flow. See exactly when chaotic multi-tasking destroyed your flow state, and identify which apps or domains are the worst offenders in your daily routine.
                      </p>
                  </div>
                  <div className="flex-1 w-full bg-bg-base border border-border rounded-xl p-6 shadow-inner">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between text-sm border-b border-border pb-3">
                            <span className="text-text-primary font-medium">10:00 AM - 11:00 AM</span>
                            <span className="text-red-500 font-bold bg-red-500/10 px-2 py-1 rounded">14 switches</span>
                        </div>
                        <div className="flex items-center text-xs text-text-muted rounded-lg overflow-hidden border border-border">
                            <div className="w-1/2 text-center border-r border-border border-b-2 border-b-blue-500 bg-blue-500/5 py-2">VS Code (25m)</div>
                            <div className="w-1/4 text-center border-r border-border border-b-2 border-b-green-500 bg-green-500/5 py-2">Slack (1m)</div>
                            <div className="w-1/4 text-center border-b-2 border-b-yellow-500 bg-yellow-500/5 py-2">Chrome (2m)</div>
                        </div>
                        <p className="text-[10px] text-text-muted text-center italic mt-2">"You lost 20% of this hour to micro-distractions."</p>
                      </div>
                  </div>
               </div>
            </div>

            {/* Bento Card 2: Break Patterns */}
            <div className="bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
                     <Coffee className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Break Quality Scoring</h3>
                  <p className="text-text-secondary text-sm mb-6">
                    Not all breaks are equal. MiniMe differentiates between stepping away from your desk versus doom-scrolling Twitter.
                  </p>
                  <div className="mt-auto space-y-3">
                      <div className="flex justify-between items-center text-sm bg-bg-base p-2.5 rounded-lg border border-border">
                          <span className="text-text-primary">12:30 PM (15m)</span>
                          <span className="text-green-500 font-bold">92/100</span>
                      </div>
                      <div className="flex justify-between items-center text-sm bg-bg-base p-2.5 rounded-lg border border-border">
                          <span className="text-text-primary">3:15 PM (20m)</span>
                          <span className="text-amber-500 font-bold">45/100</span>
                      </div>
                  </div>
               </div>
            </div>

            {/* Bento Card 3: Automated Goals */}
            <div className="bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                     <Target className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Automated Goal Engine</h3>
                  <p className="text-text-secondary text-sm mb-8">
                    Set a goal to spend 10 hours on Deep Focus for an exact project. MiniMe tracks your real progress against it automatically.
                  </p>
                  <div className="mt-auto bg-bg-base border border-border rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-text-primary text-sm flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500"/> Q3 Report Focus</span>
                        <span className="text-xs font-mono text-text-muted">7/10 hrs</span>
                    </div>
                    <div className="w-full bg-elevated h-2 rounded-full overflow-hidden">
                        <div className="w-[70%] bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    </div>
                  </div>
               </div>
            </div>

            {/* Bento Card 4: Predictive Forecasting (Spans 2 cols) */}
            <div className="md:col-span-2 bg-white/5 dark:bg-bg-surface border border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-pink-500/30 transition-colors">
               <div className="absolute inset-0 bg-gradient-to-tl from-pink-500/5 to-transparent pointer-events-none" />
               <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full items-center">
                  <div className="flex-1 w-full bg-bg-base border border-border rounded-xl p-6 shadow-inner">
                      <div className="space-y-6">
                        <div className="flex justify-between items-end border-b border-border pb-4">
                            <div>
                                <span className="text-sm text-text-muted block mb-1">Tomorrow's Forecast</span>
                                <span className="text-xs text-pink-500 bg-pink-500/10 px-2 py-1 rounded font-medium">High Output</span>
                            </div>
                            <span className="text-4xl font-display font-bold text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]">82%</span>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            <strong className="text-text-primary">Recommendation:</strong> Block 10AM-12PM for complex tasks. Your historical data dictates a severe drop in focus after 2:30 PM.
                        </p>
                      </div>
                  </div>
                  <div className="flex-1">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center mb-6">
                         <TrendingUp className="w-6 h-6" />
                      </div>
                      <h3 className="text-2xl font-bold mb-3">Predictive Forecasting</h3>
                      <p className="text-text-secondary">
                        Our built-in ML regression layer predicts tomorrow's productivity based on your sleep, break frequency, and deep focus streaks. Know your limits before you hit them.
                      </p>
                  </div>
               </div>
            </div>

          </div>
        </section>

        {/* Technical Deep Dive: Privacy by Design */}
        <section className="py-24 bg-elevated/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">Privacy by Design</h2>
              <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                Deep Analytics requires deep access. That's why your data never leaves your device.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                    <Cpu className="w-8 h-8 text-indigo-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">Air-gapped ML</h4>
                <p className="text-sm text-text-secondary leading-relaxed">All predictive forecasting models and regression layers run locally on your CPU/GPU hardware. Absolutely no cloud telemetry is required.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                    <ShieldCheck className="w-8 h-8 text-indigo-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">AES-256-GCM Encryption</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Your analytics database is encrypted at rest using military-grade authenticated encryption. The local master key is managed exclusively by your machine.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                    <SlidersHorizontal className="w-8 h-8 text-indigo-500" />
                </div>
                <h4 className="text-xl font-bold mb-3">Granular Exclusions</h4>
                <p className="text-sm text-text-secondary leading-relaxed">Define strict ignore rules using regex or wildcards. Keep sensitive directories, private tabs, and passwords universally excluded from analytics tracking.</p>
              </div>
            </div>
          </div>
        </section>

        {/* "Perfect For" Section */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-orange-900/10 border-2 border-orange-500/20 rounded-[2rem] p-10 lg:p-16 text-center">
                <h2 className="text-3xl font-display font-bold mb-8">Perfect for High-Output Individuals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Freelancers</span>
                            <span className="text-sm text-text-secondary">Stop guessing your billable hours. View exactly how long you spent in specific project files.</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Executives</span>
                            <span className="text-sm text-text-secondary">Understand how many costly context switches are occurring between your overlapping meetings.</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Designers</span>
                            <span className="text-sm text-text-secondary">Measure uninterrupted flow-state while building in Figma without a ticking stopwatch causing anxiety.</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-orange-500 flex-shrink-0" />
                        <div>
                            <span className="block font-bold mb-1">Remote Teams</span>
                            <span className="text-sm text-text-secondary">Ensure you are taking high-quality breaks away from your screen to prevent compounding burnout.</span>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* The Clean Handoff (Bottom CTA) */}
        <section className="py-24 text-center border-t border-border bg-elevated/30">
            <h2 className="text-3xl font-display font-bold mb-6">Take Action on Your Insights.</h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
                Analytics are great, but action is better. Meet the AI Copilot that lives dynamically inside your data.
            </p>
            <Link
                href="/features/ai-assistant"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors shadow-lg shadow-indigo-500/25 hover:-translate-y-1"
            >
                Meet your AI Copilot
            </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
