import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { Search, FileText, Play, Coffee, BarChart3, Settings, Brain } from 'lucide-react'

interface CommandPaletteProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const commands = [
    { id: '1', label: 'Start Deep Work: MemoryAI NER', shortcut: 'Cmd+1', icon: Play, action: 'start-work' },
    { id: '2', label: 'Start Deep Work: Air Quality', shortcut: 'Cmd+2', icon: Play, action: 'start-work' },
    { id: '3', label: 'Start Deep Work: Paper Writing', shortcut: 'Cmd+3', icon: Play, action: 'start-work' },
    { id: '4', label: 'Take Break', shortcut: 'Cmd+B', icon: Coffee, action: 'break' },
    { id: '5', label: 'Log Quick Note', shortcut: 'Cmd+N', icon: FileText, action: 'note' },
    { id: '6', label: 'View Knowledge Graph', shortcut: 'Cmd+G', icon: Brain, action: 'graph' },
    { id: '7', label: 'Export Activity Report', shortcut: 'Cmd+E', icon: BarChart3, action: 'export' },
    { id: '8', label: 'Open Settings', shortcut: 'Cmd+,', icon: Settings, action: 'settings' }
]

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const [search, setSearch] = useState('')

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                onOpenChange(!open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [open, onOpenChange])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]">
            <Command
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl overflow-hidden"
                shouldFilter={true}
            >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <Search className="w-5 h-5 text-soft-gray" />
                    <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent outline-none text-charcoal dark:text-white placeholder-soft-gray"
                    />
                    <kbd className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">ESC</kbd>
                </div>

                <Command.List className="max-h-96 overflow-y-auto p-2">
                    <Command.Empty className="py-6 text-center text-sm text-soft-gray">
                        No results found.
                    </Command.Empty>

                    <Command.Group heading="Quick Actions" className="text-xs text-soft-gray uppercase px-2 py-1">
                        {commands.map(cmd => {
                            const Icon = cmd.icon
                            return (
                                <Command.Item
                                    key={cmd.id}
                                    value={cmd.label}
                                    onSelect={() => {
                                        console.log('Execute:', cmd.action)
                                        onOpenChange(false)
                                    }}
                                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors data-[selected]:bg-gray-100 dark:data-[selected]:bg-gray-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-4 h-4 text-navy" />
                                        <span className="text-sm text-charcoal dark:text-white">{cmd.label}</span>
                                    </div>
                                    <kbd className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        {cmd.shortcut}
                                    </kbd>
                                </Command.Item>
                            )
                        })}
                    </Command.Group>
                </Command.List>
            </Command>

            <div
                className="fixed inset-0 -z-10"
                onClick={() => onOpenChange(false)}
            />
        </div>
    )
}
