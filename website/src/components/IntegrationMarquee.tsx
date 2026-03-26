'use client';

const logos = [
    { name: 'GitHub', icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" /></svg> },
    { name: 'Slack', icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.52a2.528 2.528 0 0 1 2.522-2.52 2.528 2.528 0 0 1 2.521 2.52 2.528 2.528 0 0 1-2.521 2.521h-2.522v-2.521zm-1.27 0a2.528 2.528 0 0 1-2.522 2.52 2.528 2.528 0 0 1-2.521-2.52V2.522A2.528 2.528 0 0 1 15.165 0a2.528 2.528 0 0 1 2.521 2.522v6.311zm0 10.122a2.528 2.528 0 0 1 2.521 2.522 2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.522-2.521v-2.522h2.522zm0-1.27a2.528 2.528 0 0 1-2.521-2.522 2.528 2.528 0 0 1 2.521-2.521h6.312A2.528 2.528 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.52H17.686z" /></svg> },
    { name: 'Jira', icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M11.53 2c0 1.48-1.2 2.68-2.68 2.68H5.21A3.2 3.2 0 0 1 2 1.48v.52h9.53V2zM2 6.84A3.21 3.21 0 0 0 5.21 10h6.32c1.48 0 2.68-1.2 2.68-2.68V4.16H2v2.68zM2 12.16A3.21 3.21 0 0 0 5.21 15.3A3.21 3.21 0 0 0 8.42 12.1V9.48H2v2.68zM8.42 17.48C8.42 19 7.22 20.2 5.74 20.2H2v.52a3.21 3.21 0 0 0 3.21 3.21 3.21 3.21 0 0 0 3.21-3.21v-3.24zm3.64-5.32c0 1.48-1.2 2.68-2.68 2.68H5.74A3.21 3.21 0 0 1 2.53 11.6v.56h6.84c1.48 0 2.69 1.2 2.69 2.68v-2.68zm3.63-5.32c0 1.48-1.2 2.68-2.68 2.68h-3.64A3.21 3.21 0 0 1 6.16 6.28v.56H13c1.48 0 2.69 1.2 2.69 2.68V6.84zM22 6.84A3.21 3.21 0 0 0 18.79 3.63A3.21 3.21 0 0 0 15.58 6.84V9.47H22V6.84zm0 5.32A3.21 3.21 0 0 0 18.79 8.95A3.21 3.21 0 0 0 15.58 12.16v2.63H22v-2.63zm0 5.32A3.21 3.21 0 0 0 18.79 14.27A3.21 3.21 0 0 0 15.58 17.48v2.63H22v-2.63z"/></svg> },
    { name: 'Notion', icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M4.45 2.55h15.1v18.9H4.45V2.55zm2.98 2.98v12.94h9.14V5.53H7.43z" /></svg> },
    { name: 'Google Workspace', icon: () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.18 14.53L14.7 18 12 15.3l-2.7 2.7-1.48-1.47 2.7-2.7-2.7-2.7 1.48-1.47 2.7 2.7 2.7-2.7 1.48 1.47-2.7 2.7 2.7 2.7z"/></svg> },
];

export function IntegrationMarquee() {
    return (
        <div className="py-20 border-y border-border overflow-hidden bg-bg-base relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10">
                <p className="text-sm font-semibold tracking-wider text-text-muted uppercase">Trusted by & Integrates seamlessly with</p>
            </div>

            <div className="group relative flex overflow-hidden">
                {/* Left/Right Fades */}
                <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-bg-base to-transparent z-10" />
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-bg-base to-transparent z-10" />

                <div className="flex animate-scroll-x group-hover:[animation-play-state:paused] whitespace-nowrap gap-16 md:gap-24 px-8 items-center">
                    {[...logos, ...logos, ...logos].map((logo, idx) => (
                        <div
                            key={`${logo.name}-${idx}`}
                            className="flex items-center gap-3 text-text-muted opacity-40 hover:opacity-100 hover:text-text-primary transition-all duration-300 grayscale hover:grayscale-0"
                            title={logo.name}
                        >
                            <logo.icon />
                            <span className="text-xl font-bold font-display">{logo.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
