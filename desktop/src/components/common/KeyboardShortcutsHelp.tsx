import React from 'react';
import { X, Keyboard } from 'lucide-react';

const shortcuts = [
    { keys: ['Ctrl', 'K'], description: 'Open command palette' },
    { keys: ['/'], description: 'Focus search' },
    { keys: ['Ctrl', 'S'], description: 'Save current form' },
    { keys: ['Ctrl', '1'], description: 'Go to Dashboard' },
    { keys: ['Ctrl', '2'], description: 'Go to Chat' },
    { keys: ['Ctrl', '3'], description: 'Go to Settings' },
    { keys: ['Ctrl', '4'], description: 'Go to Analytics' },
    { keys: ['Ctrl', 'N'], description: 'New conversation (in Chat)' },
    { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
    { keys: ['Esc'], description: 'Close modal/dialog' },
    { keys: ['?'], description: 'Show this help' },
];

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <Keyboard className="w-5 h-5 text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Keyboard Shortcuts
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="space-y-3">
                    {shortcuts.map((shortcut, i) => (
                        <div
                            key={i}
                            className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {shortcut.description}
                            </span>
                            <div className="flex gap-1">
                                {shortcut.keys.map((key, j) => (
                                    <React.Fragment key={j}>
                                        {j > 0 && (
                                            <span className="text-gray-400 mx-1 text-xs self-center">+</span>
                                        )}
                                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                                            {key}
                                        </kbd>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        <strong className="text-gray-900 dark:text-white">Tip:</strong> Press{' '}
                        <kbd className="px-1 py-0.5 bg-white dark:bg-gray-800 rounded text-xs font-mono border border-gray-300 dark:border-gray-600">
                            ?
                        </kbd>{' '}
                        anytime to see this help
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsHelp;
