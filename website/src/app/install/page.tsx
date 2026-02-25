'use client';
import MarketingNav from '@/components/MarketingNav';
import Footer from '@/components/Footer';
import { Terminal, Download, Monitor, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { useState } from 'react';

type Platform = 'mac' | 'windows' | 'linux';

export default function InstallPage() {
    const [platform, setPlatform] = useState<Platform>('mac');

    const instructions = {
        mac: [
            'Download the .dmg file from our releases page.',
            'Open the downloaded file and drag MiniMe to your Applications folder.',
            'Launch MiniMe from Spotlight or your Applications folder.',
            'Grant Accessibility and Screen Recording permissions when prompted (required for active window capturing).'
        ],
        windows: [
            'Download the .exe installer from our releases page.',
            'Run the installer and follow the standard installation wizard.',
            'Launch MiniMe from your Start menu.',
            'A system tray icon will appear indicating MiniMe is running in the background.'
        ],
        linux: [
            'Download the .AppImage or .deb file.',
            'Make it executable: chmod +x MiniMe*.AppImage',
            'Run the application.',
            'Ensure you have libwebkit2gtk-4.0-37 installed via your package manager.'
        ]
    };

    return (
        <div className="min-h-screen bg-white">
            <MarketingNav />

            <main>
                {/* Header */}
                <section className="pt-40 pb-16 px-4 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-100">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">Install MiniMe</h1>
                        <p className="text-xl text-gray-600">Get up and running in less than 2 minutes. Available for all major platforms.</p>
                    </div>
                </section>

                {/* Desktop App Installation */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-8">
                        <Monitor className="w-8 h-8 text-indigo-600" />
                        <h2 className="text-3xl font-bold text-gray-900">Desktop Application</h2>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex border-b border-gray-200">
                            <button
                                onClick={() => setPlatform('mac')}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${platform === 'mac' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                macOS
                            </button>
                            <button
                                onClick={() => setPlatform('windows')}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${platform === 'windows' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Windows
                            </button>
                            <button
                                onClick={() => setPlatform('linux')}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${platform === 'linux' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                Linux
                            </button>
                        </div>

                        <div className="p-8 md:p-12">
                            <div className="flex flex-col md:flex-row gap-12 items-start justify-between">
                                <div className="flex-1 space-y-8">
                                    <div className="space-y-6">
                                        {instructions[platform].map((step, idx) => (
                                            <div key={idx} className="flex gap-4">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</div>
                                                <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="w-full md:w-72 flex-shrink-0 bg-gray-50 rounded-2xl p-6 border border-gray-200 text-center">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mx-auto mb-4">
                                        <Download className="w-8 h-8 text-indigo-600" />
                                    </div>
                                    <h3 className="font-bold text-gray-900 mb-2">Download v0.2.0</h3>
                                    <p className="text-sm text-gray-500 mb-6">Latest stable release</p>
                                    <a
                                        href="https://github.com/tryminime/minime/releases/latest"
                                        target="_blank"
                                        className="block w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition"
                                    >
                                        Download from GitHub
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Source / Docker Installation */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-8">
                        <Terminal className="w-8 h-8 text-slate-800" />
                        <h2 className="text-3xl font-bold text-gray-900">Build from Source</h2>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-4">
                            <div className="flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </div>
                        </div>

                        <p className="text-slate-400 mb-6 mt-4">Requires Rust, Node.js, and Python 3.10+</p>

                        <pre className="text-sm text-emerald-400 overflow-x-auto selection:bg-emerald-900 pb-4">
                            <code>
                                <span className="text-slate-500"># Clone the repository</span>{'\n'}
                                git clone https://github.com/tryminime/minime.git{'\n'}
                                cd minime{'\n'}
                                {'\n'}
                                <span className="text-slate-500"># Start backend</span>{'\n'}
                                cd backend{'\n'}
                                uv venv{'\n'}
                                source .venv/bin/activate{'\n'}
                                uv pip install -r requirements.txt{'\n'}
                                fastapi dev main.py{'\n'}
                                {'\n'}
                                <span className="text-slate-500"># In a new terminal, start frontend/Tauri</span>{'\n'}
                                cd desktop{'\n'}
                                npm install{'\n'}
                                npm run tauri dev
                            </code>
                        </pre>
                    </div>
                </section>

                {/* Browser Extension step next */}
                <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-gray-100 mb-20">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">Get the Extensions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {['Chrome / Brave', 'Firefox', 'Safari'].map((br, i) => (
                            <div key={i} className="p-6 border border-gray-200 rounded-2xl flex flex-col items-center text-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-gray-400" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">{br}</h3>
                                <p className="text-sm text-gray-500 mb-4">Track web activity securely</p>
                                <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg text-sm w-full cursor-not-allowed">Coming Soon</button>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
