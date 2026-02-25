import { Book, Keyboard } from 'lucide-react'

export default function Help() {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-charcoal dark:text-white">Help & Documentation</h1>
                <p className="text-sm text-soft-gray mt-1">Learn how to use MiniMe effectively</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <Book className="w-8 h-8 text-navy mb-3" />
                    <h3 className="text-lg font-semibold text-charcoal dark:text-white mb-2">User Guide</h3>
                    <p className="text-sm text-soft-gray">Complete documentation on all features</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">


                    <Keyboard className="w-8 h-8 text-navy mb-3" />
                    <h3 className="text-lg font-semibold text-charcoal dark:text-white mb-2">Shortcuts</h3>
                    <p className="text-sm text-soft-gray">Cmd+K - Command palette<br />Cmd+B - Take break</p>
                </div>
            </div>
        </div>
    )
}
