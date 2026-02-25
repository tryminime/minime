import { useEffect } from 'react';

interface Shortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
    action: () => void;
    description?: string;
}

/**
 * Hook to register keyboard shortcuts
 * @param shortcuts Array of keyboard shortcuts to register
 * @param enabled Whether shortcuts are enabled (default: true)
 */
export const useKeyboardShortcuts = (shortcuts: Shortcut[], enabled = true) => {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input fields
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                // Allow some shortcuts even in input fields (like Ctrl+S)
                const allowInInput = ['s', 'k'];
                if (!allowInInput.includes(event.key.toLowerCase()) || !event.ctrlKey) {
                    return;
                }
            }

            shortcuts.forEach(({ key, ctrl, shift, alt, meta, action }) => {
                const ctrlMatch = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
                const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
                const altMatch = alt ? event.altKey : !event.altKey;
                const metaMatch = meta ? event.metaKey : !event.metaKey;

                if (
                    event.key.toLowerCase() === key.toLowerCase() &&
                    ctrlMatch &&
                    shiftMatch &&
                    altMatch &&
                    metaMatch
                ) {
                    event.preventDefault();
                    action();
                }
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts, enabled]);
};

export default useKeyboardShortcuts;
