'use client';

import { useTheme } from './ThemeProvider';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    // Prevent hydration mismatch by returning a placeholder or empty container until theme is known
    if (!theme) return <div className="w-9 h-9" />;

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-elevated/50 transition-colors"
            aria-label="Toggle dark mode"
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute inset-0 w-full h-full text-text-muted hover:text-text-primary transition-all duration-300 transform ${theme === 'dark' ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
                        }`}
                />
                <Moon
                    className={`absolute inset-0 w-full h-full text-text-muted hover:text-text-primary transition-all duration-300 transform ${theme === 'dark' ? 'scale-100 rotate-0 opacity-100' : 'scale-0 -rotate-90 opacity-0'
                        }`}
                />
            </div>
        </button>
    );
}
