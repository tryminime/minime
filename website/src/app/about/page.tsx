import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { Target, Shield, Heart } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <MarketingNav />

            <main>
                {/* Hero */}
                <section className="pt-40 pb-20 px-4 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-100">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">Building a better memory for knowledge workers.</h1>
                        <p className="text-xl text-gray-600 leading-relaxed mb-10">We believe that human attention is our most valuable asset. MiniMe exists to help you understand where that attention goes, so you can direct it intentionally.</p>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
                                <p>MiniMe was born out of a simple frustration: as engineers and designers, we spent all day working across dozens of apps, tabs, and repositories. Yet, at the end of the week, writing a standup report felt impossible. We had lost track of what we accomplished.</p>
                                <p>Existing time trackers were either too manual (punching a clock) or horrifyingly invasive (taking screenshots sent to managers). We wanted a tool built for the *employee*, not the employer.</p>
                                <p>By leveraging local LLMs and secure backend architectures, we realized we could build an intelligence engine that lived entirely on your machine. An engine that understood your projects, your skills, and your focus—all while keeping your data fiercely private.</p>
                            </div>
                        </div>
                        <div className="bg-gray-100 rounded-3xl aspect-square relative overflow-hidden flex items-center justify-center border border-gray-200">
                            {/* Abstract placeholder visual */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-purple-50 opacity-50" />
                            <div className="w-64 h-64 border border-indigo-200 rounded-full flex items-center justify-center bg-white shadow-xl relative z-10">
                                <Image src="/icon.png" alt="MiniMe" width={100} height={100} className="opacity-80 drop-shadow-lg rounded-3xl" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values */}
                <section className="py-24 bg-gray-900 text-white px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-3xl font-bold text-center mb-16">Our Core Values</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Shield className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Privacy Above All</h3>
                                <p className="text-gray-400 leading-relaxed">Your data is your property. We don't sell it, we don't train our generalized models on it, and you can delete it with one click. Always.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Target className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Focus on the Individual</h3>
                                <p className="text-gray-400 leading-relaxed">MiniMe is designed to help *you* become better at what you do. We reject features used for corporate surveillance.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                    <Heart className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Open Community</h3>
                                <p className="text-gray-400 leading-relaxed">We build in the open because we believe transparency creates better, more secure software. We rely on community feedback to shape the roadmap.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team */}
                <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-16">The Team</h2>
                    <div className="flex justify-center flex-wrap gap-12">
                        {[
                            { name: 'Mufakir Ansari', role: 'CEO & Co-founder', bg: 'bg-emerald-100' },
                            { name: 'John Doe', role: 'Hardware & Cloud', bg: 'bg-indigo-100' },
                            { name: 'John Doe', role: 'Marketing', bg: 'bg-purple-100' },
                        ].map((member, i) => (

                            <div key={i} className="w-64 text-center">
                                <div className={`w-32 h-32 mx-auto rounded-full ${member.bg} mb-4 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center`}>
                                    <span className="text-3xl font-bold text-gray-400">{member.name[0]}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                                <p className="text-gray-500 font-medium mt-1">{member.role}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
