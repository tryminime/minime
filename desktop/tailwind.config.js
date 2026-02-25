/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                /* ── Brand Neutrals ── */
                shell: '#F6F4F9',
                surface: '#FFFFFF',
                sidebar: '#F0EDF7',
                border: '#E5E7EB',

                /* ── Text ── */
                primary: '#111827',
                secondary: '#6B7280',
                muted: '#9CA3AF',

                /* ── Brand Accents ── */
                accent: {
                    DEFAULT: '#2563EB',
                    hover: '#1D4ED8',
                    light: 'rgba(37, 99, 235, 0.1)',
                },
                emerald: '#10B981',
                orange: '#F97316',

                /* ── Semantic ── */
                success: '#16A34A',
                warning: '#FACC15',
                danger: {
                    DEFAULT: '#EF4444',
                    hover: '#DC2626',
                },
                info: '#0EA5E9',

                /* ── Chart palette ── */
                chart: {
                    1: '#2563EB',
                    2: '#22C55E',
                    3: '#F97316',
                    4: '#8B5CF6',
                    5: '#0EA5E9',
                },

                /* ── Heatmap ── */
                heat: {
                    base: '#E5E7EB',
                    low: '#BFDBFE',
                    mid: '#60A5FA',
                    high: '#1D4ED8',
                },

                /* ── Dark mode surfaces (future-safe) ── */
                dark: {
                    bg: '#020617',
                    surface: '#111827',
                    text: '#F9FAFB',
                    muted: '#E5E7EB',
                },

                /* ── Legacy compat (keep for un-migrated components) ── */
                navy: {
                    DEFAULT: '#003D82',
                    dark: '#002855',
                    light: '#0052B4',
                },
                teal: {
                    DEFAULT: '#20B2AA',
                    dark: '#17928B',
                    light: '#3FCFC7',
                },
                cream: {
                    DEFAULT: '#F6F4F9',
                    dark: '#E8DFC8',
                    light: '#FAF8F3',
                },
                charcoal: '#2C3E50',
                'soft-gray': '#7A8FA0',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            fontSize: {
                'micro': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
                'body': ['14px', { lineHeight: '1.55', fontWeight: '400' }],
                'body-lg': ['16px', { lineHeight: '1.55', fontWeight: '400' }],
                'h3': ['18px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
                'h2': ['24px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
                'h1': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
            },
            spacing: {
                '1': '4px',
                '2': '8px',
                '3': '12px',
                '4': '16px',
                '5': '20px',
                '6': '24px',
                '8': '32px',
                '10': '40px',
            },
            borderRadius: {
                'shell': '24px',
                'card': '16px',
                'input': '14px',
                'btn': '14px',
                'pill': '9999px',
            },
            boxShadow: {
                'card': '0 18px 45px rgba(15, 23, 42, 0.06)',
                'card-hover': '0 22px 50px rgba(15, 23, 42, 0.1)',
                'soft': '0 4px 12px rgba(15, 23, 42, 0.04)',
            },
            transitionTimingFunction: {
                'smooth': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            },
            transitionDuration: {
                '180': '180ms',
                '220': '220ms',
            },
            keyframes: {
                'slide-in': {
                    from: { transform: 'translateX(100%)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                'slide-up': {
                    from: { transform: 'translateY(6px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
            },
            animation: {
                'slide-in': 'slide-in 0.3s ease-out',
                'fade-in': 'fade-in 0.2s ease-out',
                'shimmer': 'shimmer 2s infinite linear',
                'slide-up': 'slide-up 0.22s cubic-bezier(0.22, 0.61, 0.36, 1)',
            },
        },
    },
    plugins: [],
    darkMode: 'class',
}
