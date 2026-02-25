import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, BarChart3, FolderKanban, FileText, Brain, ListTodo, MessageSquare, Settings, HelpCircle, Menu, X } from 'lucide-react'

interface SidebarProps {
    onToggleDark: () => void
}

export default function Sidebar({ onToggleDark }: SidebarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const location = useLocation()

    const navItems = [
        { icon: Home, label: 'Dashboard', path: '/' },
        { icon: BarChart3, label: 'Analytics', path: '/analytics' },
        { icon: FolderKanban, label: 'Projects', path: '/projects' },
        { icon: FileText, label: 'Papers', path: '/papers' },
        { icon: Brain, label: 'Knowledge Graph', path: '/knowledge-graph' },
        { icon: ListTodo, label: 'Tasks', path: '/tasks' },
        { icon: MessageSquare, label: 'AI Chat', path: '/chat' },
        { icon: Settings, label: 'Settings', path: '/settings' },
        { icon: HelpCircle, label: 'Help', path: '/help' },
    ]

    return (
        <>
            {/* Mobile Menu Button */}
            <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-accent text-white rounded-btn shadow-soft"
            >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-40
                w-60 bg-sidebar flex flex-col h-full border-r border-border
                transform transition-transform duration-220 ease-smooth
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent rounded-card flex items-center justify-center">
                            <span className="text-white font-bold text-body">M</span>
                        </div>
                        <h1 className="text-h3 text-primary">MiniMe</h1>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto scrollbar-thin p-3">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = location.pathname === item.path

                            return (
                                <li key={item.label}>
                                    <Link
                                        to={item.path}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className={`ds-nav-item ${isActive ? 'active' : ''}`}
                                    >
                                        <Icon className={`w-5 h-5 icon`} />
                                        <span className="text-body">{item.label}</span>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Quick Stats */}
                <div className="p-4 border-t border-border">
                    <div className="text-micro text-muted uppercase tracking-wide mb-3">Quick Stats</div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-body text-secondary">
                            <span>This week:</span>
                        </div>
                        <div className="text-body font-medium text-primary">42h worked</div>
                        <div className="text-micro text-secondary">8 deep blocks</div>
                        <div className="text-micro text-secondary">3 papers draft</div>
                    </div>
                </div>

                {/* Dark Mode Toggle */}
                <div className="p-4 border-t border-border">
                    <button
                        onClick={onToggleDark}
                        className="ds-btn-secondary w-full text-body"
                    >
                        Toggle Dark Mode
                    </button>
                </div>
            </aside>
        </>
    )
}
