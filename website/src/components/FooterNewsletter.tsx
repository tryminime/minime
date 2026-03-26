'use client';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export function FooterNewsletter() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) {
                setStatus('done');
                setMessage("You're on the list. We'll be in touch soon.");
                setEmail('');
            } else {
                const data = await res.json().catch(() => ({}));
                setStatus('error');
                setMessage(data?.detail || 'Something went wrong. Try again shortly.');
            }
        } catch {
            setStatus('error');
            setMessage('Could not connect. Please try again later.');
        }
    };

    if (status === 'done') {
        return (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{message}</span>
            </div>
        );
    }

    return (
        <div>
            <form className="relative group/form" onSubmit={handleSubmit}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email for updates & early access"
                    className="w-full bg-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all pr-12"
                    required
                    disabled={status === 'loading'}
                />
                <button
                    type="submit"
                    className="absolute right-1.5 top-1.5 bottom-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-60"
                    aria-label="Subscribe"
                    disabled={status === 'loading'}
                >
                    {status === 'loading'
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ArrowRight className="w-4 h-4" />
                    }
                </button>
            </form>
            {status === 'error' && (
                <p className="mt-2 text-xs text-red-500">{message}</p>
            )}
        </div>
    );
}
