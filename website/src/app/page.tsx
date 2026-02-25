import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Brain, Shield, Zap, ArrowRight, Activity, Network, CheckCircle2, ChevronRight, Lock, Command, FileText } from 'lucide-react';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      <MarketingNav />

      <main>
        {/* HERO SECTION */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-indigo-50/50 rounded-full blur-3xl opacity-50" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-50/50 rounded-full blur-3xl opacity-50" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span>MiniMe v0.2.0 is now available</span>
              <span className="w-1 h-1 rounded-full bg-indigo-300 mx-1" />
              <Link href="/changelog" className="hover:text-indigo-700 flex items-center gap-0.5">
                Read release notes <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8 animate-fade-in-up flex flex-col items-center">
              <span>Your work,</span>
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-transparent bg-clip-text bg-300% animate-gradient">
                intelligently understood.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              MiniMe sits quietly on your machine, learning how you work. It builds a private, interconnected intelligence graph of your activities, skills, and focus—entirely automatically.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <Link
                href="/install"
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-900/10"
              >
                Download for macOS
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/login"
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900 rounded-xl font-medium transition-all"
              >
                Open Dashboard
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
              Also available for Windows and Linux. <Link href="/install" className="text-indigo-600 hover:underline">See all platforms</Link>.
            </p>
          </div>
        </section>

        {/* LOGO CLOUD */}
        <section className="border-y border-gray-100 bg-gray-50/50 py-12 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-medium text-gray-500 mb-8">INTEGRATES SEAMLESSLY WITH YOUR TOOLS</p>
            <div className="flex justify-center flex-wrap gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              {['GitHub', 'Slack', 'Notion', 'Figma', 'VS Code', 'Chrome'].map((tool) => (
                <div key={tool} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-gray-200/50" />
                  <span className="font-semibold text-gray-700">{tool}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS / BENTO GRID */}
        <section className="py-24 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Zero configuration. Infinite intelligence.</h2>
              <p className="text-lg text-gray-600">MiniMe acts as your digital twin. It processes what you do locally, requiring zero manual data entry.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Box 1 */}
              <div className="md:col-span-2 relative group rounded-3xl bg-gray-50 border border-gray-100 p-8 overflow-hidden hover:border-indigo-100 transition-colors">
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                    <Activity className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Automatic Tracking</h3>
                  <p className="text-gray-600 max-w-md">Our lightweight desktop app and browser extensions run silently in the background, logging active window titles, URLs, and applications.</p>
                </div>
                <div className="absolute right-0 bottom-0 top-20 w-1/2 bg-gradient-to-l from-indigo-50/50 to-transparent pointer-events-none" />
              </div>

              {/* Box 2 */}
              <div className="relative group rounded-3xl bg-gray-50 border border-gray-100 p-8 hover:border-purple-100 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-purple-100 flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Local First</h3>
                <p className="text-gray-600">Your raw activity data never leaves your machine. Processing happens via local LLMs before hitting our secure cloud.</p>
              </div>

              {/* Box 3 */}
              <div className="relative group rounded-3xl bg-gray-50 border border-gray-100 p-8 hover:border-blue-100 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                  <Network className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Knowledge Graph</h3>
                <p className="text-gray-600">Raw logs turn into a semantic graph of projects, people, and skills.</p>
              </div>

              {/* Box 4 */}
              <div className="md:col-span-2 relative group rounded-3xl bg-gray-900 border border-gray-800 p-8 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-6">
                    <Brain className="w-6 h-6 text-gray-300" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">AI Copilot</h3>
                  <p className="text-gray-400 max-w-md mb-8">Chat with your own history. Ask MiniMe what you worked on last Tuesday, or have it summarize your contributions to a specific codebase.</p>
                  <Link href="/features" className="inline-flex items-center text-sm font-medium text-white group-hover:text-indigo-400 transition-colors">
                    Explore features <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* METRICS & PROOF */}
        <section className="py-24 bg-gray-50 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { label: 'Time saved weekly', value: '4.5h' },
                { label: 'Data points processed locally', value: '1M+' },
                { label: 'Active integrations', value: '12' },
                { label: 'Engineers on Waitlist', value: '10k+' },
              ].map((stat, i) => (
                <div key={i} className="text-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="text-4xl font-black text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-32 overflow-hidden">
          <div className="absolute inset-0 bg-indigo-600" />
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay" />
          <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-white opacity-10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-48 -mb-48 w-96 h-96 rounded-full bg-black opacity-20 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to understand your intelligence?</h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
              Join the beta today. Keep your data private, understand your impact, and accelerate your productivity.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-900/20"
              >
                Start for free
              </Link>
              <Link
                href="/docs"
                className="px-8 py-4 bg-indigo-700/50 hover:bg-indigo-700 text-white border border-indigo-500/50 rounded-xl font-medium transition-all"
              >
                Read the docs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
