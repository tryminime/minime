import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Globe, Search, Video, Share2, ShieldQuestion, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Browser Intelligence | MiniMe Platform',
  description: 'Uncover insights from Chrome, Firefox, and Edge with MiniMe.',
};

export default function ExtensionsPlatformPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <MarketingNav />

      <main>
        {/* Header Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-8 border border-sky-500/20">
              <Globe className="w-8 h-8" />
            </div>
            <h1 className="text-display-h1 font-display font-bold leading-tight mb-6">
              Browser <br />
              <span className="text-gradient hover:to-sky-400">Intelligence.</span>
            </h1>
            <p className="text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-10">
              Where the desktop agent maps your applications, the browser extensions map your information diet. Safely capture searches, social consumption, and video history directly into your Knowledge Graph.
            </p>
          </div>
        </section>

        {/* Browser Support */}
        <section className="py-24 bg-elevated/30 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-display font-bold mb-12">One codebase. Every major browser.</h2>
            <div className="flex flex-wrap justify-center gap-6">
                <div className="px-8 py-4 bg-bg-base rounded-2xl border border-border flex items-center gap-3 shadow-md hover:border-sky-500/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex flex-shrink-0" />
                    <span className="font-semibold">Chrome Web Store</span>
                </div>
                <div className="px-8 py-4 bg-bg-base rounded-2xl border border-border flex items-center gap-3 shadow-md hover:border-sky-500/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 flex flex-shrink-0" />
                    <span className="font-semibold">Firefox Add-ons</span>
                </div>
                <div className="px-8 py-4 bg-bg-base rounded-2xl border border-border flex items-center gap-3 shadow-md hover:border-sky-500/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex flex-shrink-0" />
                    <span className="font-semibold">Edge Add-ons</span>
                </div>
            </div>
          </div>
        </section>

        {/* Tracking Capabilities */}
        <section className="py-24 bg-bg-base">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-display font-bold mb-4">What gets mapped?</h2>
                <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                    The extension uses a strict whitelist to safely parse metadata from known domains without scraping your private emails or banking sessions.
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-[2rem] bg-bg-base border border-border shadow-lg relative overflow-hidden transition-all hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Share2 className="w-8 h-8 text-purple-500 mb-6" />
                <h3 className="text-xl font-bold mb-3">18+ Social Platforms</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  Captures profiles visited, articles read, and time spent scrolling. Reconstructs your "doom-scrolling" habits to help you regain focus.
                </p>
                <div className="flex gap-2 text-xs font-mono text-purple-500/80 bg-purple-500/10 py-1.5 px-3 rounded">
                    Twitter, LinkedIn, Reddit...
                </div>
              </div>
              
              <div className="group p-8 rounded-[2rem] bg-bg-base border border-border shadow-lg relative overflow-hidden transition-all hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Search className="w-8 h-8 text-green-500 mb-6" />
                <h3 className="text-xl font-bold mb-3">12+ Search Engines</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  Extracts search queries from URLs securely. Automatically builds a "research trail" in your knowledge graph linking your queries to the sites you clicked.
                </p>
                <div className="flex gap-2 text-xs font-mono text-green-500/80 bg-green-500/10 py-1.5 px-3 rounded">
                    Google, Perplexity, GitHub...
                </div>
              </div>
              
              <div className="group p-8 rounded-[2rem] bg-bg-base border border-border shadow-lg relative overflow-hidden transition-all hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Video className="w-8 h-8 text-red-500 mb-6" />
                <h3 className="text-xl font-bold mb-3">Video Consumption</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  Tracks exact watch time, video titles, and channels. Differentiates between a 2-hour tutorial (deep work) and a 15-minute comedy clip (break).
                </p>
                <div className="flex gap-2 text-xs font-mono text-red-500/80 bg-red-500/10 py-1.5 px-3 rounded">
                    YouTube, Netflix, Twitch...
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Callout */}
        <section className="py-24 bg-elevated/50 border-t border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-12 bg-bg-base p-8 rounded-[2rem] border border-border shadow-xl">
                <div className="flex-shrink-0 w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 border-2 border-orange-500/20">
                    <ShieldQuestion className="w-10 h-10" />
                </div>
                <div>
                    <h3 className="text-2xl font-display font-bold mb-3">How is this not spyware?</h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                        MiniMe Extensions <strong>do not dial out to the internet</strong>. They push data exclusively to <code className="text-sm bg-elevated px-1 rounded text-text-primary">localhost:8000</code> where your local FastAPI server processes it. You can inspect the network tab yourself—zero bytes are sent to our cloud.
                    </p>
                    <Link href="/platform/security" className="text-indigo-500 font-semibold hover:text-indigo-400 flex items-center gap-1">
                        Read the Security Architecture <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA to Next Feature */}
        <section className="py-24 text-center border-t border-border bg-bg-base">
            <h2 className="text-3xl font-bold mb-6">But is it secure?</h2>
            <p className="text-lg text-text-secondary mb-10 max-w-xl mx-auto">
                Yes. Learn how we built a Zero-Trust architecture that never dials out to the cloud.
            </p>
            <Link
                href="/platform/security"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-full transition-colors shadow-lg shadow-indigo-500/25"
            >
                Explore Zero-Trust Security
            </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}
