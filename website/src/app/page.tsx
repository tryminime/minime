import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { HeroSection } from '@/components/HeroSection';
import { IntegrationMarquee } from '@/components/IntegrationMarquee';
import { HowItWorks } from '@/components/HowItWorks';
import { BentoGrid } from '@/components/BentoGrid';
import { MetricCounter } from '@/components/MetricCounter';
import { TestimonialCarousel } from '@/components/TestimonialCarousel';
import Link from 'next/link';
import { Play } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-indigo-500/30 selection:text-indigo-200">
      <AnnouncementBar />
      <MarketingNav />

      <main className="overflow-x-hidden">
        {/* Assemble components */}
        <HeroSection />
        <IntegrationMarquee />
        <HowItWorks />
        <BentoGrid />
        <MetricCounter />
        <TestimonialCarousel />

        {/* Final CTA Strip */}
        <section className="relative py-32 overflow-hidden border-t border-border">
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-[#0d0d1f] to-[#0d0d1f] -z-20" />
          <div
            className="absolute inset-0 opacity-40 mix-blend-screen -z-10 bg-[length:200%_200%] animate-[float_10s_ease-in-out_infinite]"
            style={{ backgroundImage: 'radial-gradient(circle at center, var(--accent-indigo) 0%, transparent 50%), radial-gradient(circle at 80% 20%, var(--accent-purple) 0%, transparent 40%), radial-gradient(circle at 20% 80%, var(--accent-cyan) 0%, transparent 60%)' }}
          />
          {/* Noise Overlay */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none -z-10" />

          {/* Glowing Orbs underlying text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none -z-10" />

          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-display-h2 font-display font-bold text-white mb-6 text-balance leading-tight">
              Ready to understand your intelligence?
            </h2>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-10 text-balance opacity-90">
              Join 10,000+ people who've taken back control of their time. Free forever. Private by design.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="w-full sm:w-auto px-8 py-4 bg-white text-indigo-900 border border-white hover:bg-gray-100 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)]"
              >
                Get Started — It's Free
              </Link>
              <button
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-transparent hover:bg-white/10 text-white border border-white/30 rounded-full font-semibold transition-colors"
              >
                Watch 2-min Demo
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
