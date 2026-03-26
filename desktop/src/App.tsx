import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import CommandPalette from './components/layout/CommandPalette'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Projects from './pages/Projects'
import Papers from './pages/Papers'
import KnowledgeGraphPage from './pages/KnowledgeGraphPage'
import Tasks from './pages/Tasks'
import Settings from './pages/Settings'
import Chat from './pages/Chat'
import Help from './pages/Help'
import Entities from './pages/Entities'
import SetupWizard from './pages/SetupWizard'
import OAuthCallback from './pages/OAuthCallback'
import Knowledge from './pages/Knowledge'
import { SettingsProvider } from './contexts/SettingsContext'
import { ChatProvider } from './contexts/ChatContext'
import { ToastProvider } from './components/common/Toast'
import { ErrorBoundary } from './components/common/ErrorBoundary'

import { ensureAuthenticated } from './services/auth'

// First Run Detector Component (also handles auto-auth)
const FirstRunDetector = ({ children }: { children: React.ReactNode }) => {
    const [isReady, setIsReady] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        const initialize = async () => {
            // Mark setup as completed
            const setupCompleted = localStorage.getItem('setup_completed');
            if (!setupCompleted) {
                console.log('Auto-completing setup for Docker-based backend');
                localStorage.setItem('setup_completed', 'true');
            }

            // Auto-authenticate (register/login dev user)
            try {
                const authenticated = await ensureAuthenticated();
                if (authenticated) {
                    console.log('✅ App authenticated and ready');
                } else {
                    console.warn('⚠️ Auto-auth failed — API calls may return 403');
                }
            } catch (err) {
                console.error('❌ Auth initialization error:', err);
            }

            setIsReady(true);
        };

        initialize();
    }, [navigate]);

    if (!isReady) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-teal-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading MiniMe...</div>
            </div>
        );
    }

    return <>{children}</>;
};

function App() {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode')
        return saved ? JSON.parse(saved) : false
    })

    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [darkMode])

    return (
        <ErrorBoundary>
            <ToastProvider>
                <BrowserRouter>
                    <SettingsProvider>
                        <ChatProvider>
                            <FirstRunDetector>
                                <div className={darkMode ? 'dark' : ''}>
                                    <Routes>
                                        {/* Setup wizard - no layout */}
                                        <Route path="/setup" element={<SetupWizard />} />

                                        {/* OAuth callback - no layout */}
                                        <Route path="/oauth/callback" element={<OAuthCallback />} />

                                        {/* Main app - with layout */}
                                        <Route path="/*" element={
                                            <MainLayout onToggleDark={() => setDarkMode(!darkMode)}>
                                                <Routes>
                                                    <Route path="/" element={<Dashboard />} />
                                                    <Route path="/analytics" element={<Analytics />} />
                                                    <Route path="/projects" element={<Projects />} />
                                                    <Route path="/papers" element={<Papers />} />
                                                    <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
                                                    <Route path="/tasks" element={<Tasks />} />
                                                    <Route path="/entities" element={<Entities />} />
                                                    <Route path="/knowledge" element={<Knowledge />} />
                                                    <Route path="/chat" element={<Chat />} />
                                                    <Route path="/settings" element={<Settings />} />
                                                    <Route path="/settings/:tab" element={<Settings />} />
                                                    <Route path="/help" element={<Help />} />
                                                </Routes>
                                            </MainLayout>
                                        } />
                                    </Routes>
                                    <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
                                </div>
                            </FirstRunDetector>
                        </ChatProvider>
                    </SettingsProvider>
                </BrowserRouter>
            </ToastProvider>
        </ErrorBoundary>
    )
}

export default App
