import Sidebar from './Sidebar'

interface MainLayoutProps {
    children: React.ReactNode
    onToggleDark: () => void
}

export default function MainLayout({ children, onToggleDark }: MainLayoutProps) {
    return (
        <div className="flex h-screen w-screen overflow-hidden bg-shell dark:bg-dark-bg">
            <Sidebar onToggleDark={onToggleDark} />
            <main className="flex-1 overflow-y-auto scrollbar-thin lg:ml-0 p-6">
                {children}
            </main>
        </div>
    )
}
