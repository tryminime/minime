import React, { useState } from 'react';
import { CheckCircle, Circle, Loader, AlertCircle, Download, Server, Brain } from 'lucide-react';

interface SetupStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'running' | 'complete' | 'error';
    error?: string;
}

const SetupWizard: React.FC = () => {
    const [steps, setSteps] = useState<SetupStep[]>([
        {
            id: 'check-backend',
            title: 'Setup Python Backend',
            description: 'Creating virtual environment and installing dependencies',
            status: 'pending',
        },
        {
            id: 'install-ollama',
            title: 'Install Ollama (Optional)',
            description: 'Install local LLM for AI chat (free, runs on your computer)',
            status: 'pending',
        },
        {
            id: 'download-model',
            title: 'Download AI Model',
            description: 'Download Llama 2 model (~3.8GB)',
            status: 'pending',
        },
        {
            id: 'setup-database',
            title: 'Setup Database',
            description: 'Initialize database tables and migrations',
            status: 'pending',
        },
        {
            id: 'configure-env',
            title: 'Configure Environment',
            description: 'Set up API keys and configuration',
            status: 'pending',
        },
        {
            id: 'start-services',
            title: 'Start Services',
            description: 'Launch backend server and Ollama',
            status: 'pending',
        },
    ]);

    const [useOpenAI, setUseOpenAI] = useState(false);
    const [openAIKey, setOpenAIKey] = useState('');
    const [selectedModel, setSelectedModel] = useState('llama2');

    const updateStepStatus = (stepId: string, status: SetupStep['status'], error?: string) => {
        setSteps(prev =>
            prev.map(step =>
                step.id === stepId ? { ...step, status, error } : step
            )
        );
    };

    const runSetup = async () => {
        try {
            // Step 1: Check Backend (now includes auto-setup)
            updateStepStatus('check-backend', 'running');
            const backendStatus = await checkBackend();
            if (backendStatus) {
                updateStepStatus('check-backend', 'complete');
            } else {
                updateStepStatus('check-backend', 'error', 'Python 3 not installed. Please install Python 3.8+');
                return;
            }

            // Step 2: Install Ollama (if not using OpenAI)
            if (!useOpenAI) {
                updateStepStatus('install-ollama', 'running');

                // Check if Ollama is already installed first
                try {
                    const { invoke } = await import('@tauri-apps/api/core');
                    const alreadyInstalled = await invoke<boolean>('check_ollama_installed');

                    if (alreadyInstalled) {
                        console.log('Ollama already installed, skipping...');
                        updateStepStatus('install-ollama', 'complete');
                    } else {
                        const ollamaInstalled = await installOllama();
                        updateStepStatus('install-ollama', ollamaInstalled ? 'complete' : 'error',
                            ollamaInstalled ? undefined : 'Failed to install Ollama. Install manually from ollama.com');
                        if (!ollamaInstalled) {
                            console.warn('Ollama install failed, but continuing...');
                        }
                    }
                } catch (error) {
                    console.error('Ollama check error:', error);
                    updateStepStatus('install-ollama', 'error', 'Could not check Ollama');
                }

                // Step 3: Download Model
                updateStepStatus('download-model', 'running');
                const modelDownloaded = await downloadModel(selectedModel);
                updateStepStatus('download-model', modelDownloaded ? 'complete' : 'error',
                    modelDownloaded ? undefined : 'Failed to download model');
                if (!modelDownloaded) return;
            } else {
                updateStepStatus('install-ollama', 'complete');
                updateStepStatus('download-model', 'complete');
            }

            // Step 4: Setup Database
            updateStepStatus('setup-database', 'running');
            const dbSetup = await setupDatabase();
            updateStepStatus('setup-database', dbSetup ? 'complete' : 'error',
                dbSetup ? undefined : 'Database migration failed');
            if (!dbSetup) return;

            // Step 5: Configure Environment
            updateStepStatus('configure-env', 'running');
            const configured = await configureEnvironment(useOpenAI, openAIKey, selectedModel);
            updateStepStatus('configure-env', configured ? 'complete' : 'error',
                configured ? undefined : 'Configuration failed');
            if (!configured) return;

            // Step 6: Start Services
            updateStepStatus('start-services', 'running');
            const started = await startServices(useOpenAI);
            updateStepStatus('start-services', started ? 'complete' : 'error',
                started ? undefined : 'Failed to start services');

        } catch (error) {
            console.error('Setup failed:', error);
        }
    };

    // Tauri command wrappers
    const checkBackend = async (): Promise<boolean> => {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            return await invoke('check_backend_status');
        } catch {
            return false;
        }
    };

    const installOllama = async (): Promise<boolean> => {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            return await invoke('install_ollama');
        } catch {
            return false;
        }
    };

    const downloadModel = async (model: string): Promise<boolean> => {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            return await invoke('download_ollama_model', { model });
        } catch {
            return false;
        }
    };

    const setupDatabase = async (): Promise<boolean> => {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            return await invoke('run_database_migrations');
        } catch {
            return false;
        }
    };

    const configureEnvironment = async (
        useOpenAI: boolean,
        apiKey: string,
        model: string
    ): Promise<boolean> => {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            return await invoke('configure_environment', {
                config: {
                    use_ollama: !useOpenAI,
                    openai_api_key: apiKey,
                    ollama_model: model,
                },
            });
        } catch {
            return false;
        }
    };

    const startServices = async (useOpenAI: boolean): Promise<boolean> => {
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            return await invoke('start_backend_services', { useOllama: !useOpenAI });
        } catch {
            return false;
        }
    };

    const getStepIcon = (step: SetupStep) => {
        switch (step.status) {
            case 'complete':
                return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'running':
                return <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
            case 'error':
                return <AlertCircle className="w-6 h-6 text-red-500" />;
            default:
                return <Circle className="w-6 h-6 text-gray-400" />;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-teal-900 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-navy-600 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome to MiniMe
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Let's set up your AI-powered activity intelligence platform
                    </p>
                </div>

                {/* AI Provider Selection */}
                <div className="mb-8 bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Choose Your AI Provider
                    </h2>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Ollama Option */}
                        <button
                            onClick={() => setUseOpenAI(false)}
                            className={`p-4 border-2 rounded-lg transition-all ${!useOpenAI
                                ? 'border-navy-600 bg-navy-50 dark:bg-navy-900'
                                : 'border-gray-300 dark:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Server className="w-5 h-5" />
                                <span className="font-semibold">Ollama (Local)</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                                Free, runs on your computer, fully private
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">Recommended</p>
                        </button>

                        {/* OpenAI Option */}
                        <button
                            onClick={() => setUseOpenAI(true)}
                            className={`p-4 border-2 rounded-lg transition-all ${useOpenAI
                                ? 'border-navy-600 bg-navy-50 dark:bg-navy-900'
                                : 'border-gray-300 dark:border-gray-600'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <Brain className="w-5 h-5" />
                                <span className="font-semibold">OpenAI (Cloud)</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 text-left">
                                More powerful, requires API key, ~$0.03/1K tokens
                            </p>
                        </button>
                    </div>

                    {/* OpenAI API Key Input */}
                    {useOpenAI && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                OpenAI API Key
                            </label>
                            <input
                                type="password"
                                value={openAIKey}
                                onChange={(e) => setOpenAIKey(e.target.value)}
                                placeholder="sk-proj-xxxxxxxxxxxxx"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Get your API key from{' '}
                                <a
                                    href="https://platform.openai.com/api-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-navy-600 hover:underline"
                                >
                                    platform.openai.com/api-keys
                                </a>
                            </p>
                        </div>
                    )}

                    {/* Model Selection (Ollama only) */}
                    {!useOpenAI && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Model
                            </label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                            >
                                <option value="llama2">Llama 2 (3.8GB, Fast)</option>
                                <option value="llama3">Llama 3 (7.3GB, Better)</option>
                                <option value="codellama">Code Llama (3.8GB, Code-focused)</option>
                                <option value="mistral">Mistral (4.1GB, Balanced)</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Setup Steps - Made scrollable */}
                <div className="space-y-4 mb-8 max-h-80 overflow-y-auto">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                            <div className="flex-shrink-0">{getStepIcon(step)}</div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {step.description}
                                </p>
                                {step.error && (
                                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        {step.error}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={runSetup}
                        disabled={steps.some(s => s.status === 'running') || (useOpenAI && !openAIKey)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {steps.some(s => s.status === 'running') ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                Setting Up...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Start Automatic Setup
                            </>
                        )}
                    </button>

                    {steps.every(s => s.status === 'complete') && (
                        <button
                            onClick={() => {
                                localStorage.setItem('setup_completed', 'true');
                                window.location.href = '/';
                            }}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                        >
                            Complete Setup →
                        </button>
                    )}
                </div>

                {/* Skip Option */}
                <div className="text-center mt-4">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        Skip setup for now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SetupWizard;
