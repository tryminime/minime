'use client';

/**
 * InstallPromptBanner
 *
 * Shown on app.tryminime.com when the local MiniMe backend is not running.
 * Gives users a direct download link and instructions.
 */

import { useState } from 'react';
import { Download, RefreshCw, Terminal, X } from 'lucide-react';

const DOWNLOAD_URL = 'https://github.com/tryminime/minime/releases/latest';
const INSTALL_MACOS = 'curl -fsSL https://tryminime.com/install.sh | bash';
const INSTALL_WIN = 'irm https://tryminime.com/install.ps1 | iex';

interface Props {
    onRetry: () => void;
    isRetrying: boolean;
}

export function InstallPromptBanner({ onRetry, isRetrying }: Props) {
    const [dismissed, setDismissed] = useState(false);
    const [tab, setTab] = useState<'installer' | 'terminal'>('installer');

    if (dismissed) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-full max-w-xl px-4">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <p className="text-sm font-semibold">MiniMe is not running</p>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="px-5 text-xs text-gray-400 mb-3">
                    Install MiniMe to start tracking your work. Your data stays on your machine.
                </p>

                {/* Tabs */}
                <div className="flex gap-1 px-5 mb-3">
                    {(['installer', 'terminal'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${tab === t ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
                                }`}
                        >
                            {t === 'installer' ? '⬇ Installer' : '$ Terminal'}
                        </button>
                    ))}
                </div>

                <div className="px-5 pb-4">
                    {tab === 'installer' ? (
                        <a
                            href={DOWNLOAD_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download MiniMe
                        </a>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex items-start gap-2 bg-gray-800 rounded-lg px-3 py-2">
                                <Terminal className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">macOS / Linux</p>
                                    <code className="text-xs text-green-400 break-all">{INSTALL_MACOS}</code>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 bg-gray-800 rounded-lg px-3 py-2">
                                <Terminal className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">Windows (PowerShell as Admin)</p>
                                    <code className="text-xs text-blue-400 break-all">{INSTALL_WIN}</code>
                                </div>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={onRetry}
                        disabled={isRetrying}
                        className="flex items-center justify-center gap-2 w-full mt-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Checking…' : 'I already installed it — check again'}
                    </button>
                </div>
            </div>
        </div>
    );
}
