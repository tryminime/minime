'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Github, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Home, WifiOff } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

import { useAuth } from '@/lib/hooks/useAuth';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useEffect, useState } from 'react';

type AuthTab = 'login' | 'register';

export default function LoginPage() {
    const { loginWithEmail, register, isAuthenticated } = useAuth();
    const { isOffline } = useNetworkStatus();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<AuthTab>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [rememberDevice, setRememberDevice] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard/overview');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            if (activeTab === 'login') {
                await loginWithEmail(email, password, rememberDevice);
            } else {
                await register(email, password, fullName || undefined);
                setSuccess('Account created! Redirecting...');
            }
        } catch (err: any) {
            const message = err?.detail || err?.message || 'Something went wrong. Please try again.';
            setError(typeof message === 'string' ? message : JSON.stringify(message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchTab = (tab: AuthTab) => {
        setActiveTab(tab);
        setError('');
        setSuccess('');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-bg-base relative overflow-hidden">
            {/* Nav Handle */}
            <div className="absolute top-6 left-6 right-6 z-50 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm font-medium bg-elevated px-4 py-2 rounded-full border border-border shadow-sm">
                    <Home className="w-4 h-4" /> Back to Home
                </Link>
                <ThemeToggle />
            </div>

            {/* Decorative elements conforming to Design System */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative w-full max-w-[420px] mx-4 z-10">
                {/* Card */}
                <div className="bg-white/5 dark:bg-[#0d0d1f]/80 backdrop-blur-3xl border border-border/50 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">

                    {/* Logo & Header */}
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-elevated/50 border border-border/50 shadow-soft group hover:border-indigo-500/30 transition-colors">
                            <Image
                                src="/icon.png"
                                alt="MiniMe"
                                width={40}
                                height={40}
                                className="rounded-xl group-hover:scale-105 transition-transform"
                                priority
                            />
                        </Link>
                        <h1 className="text-2xl font-display font-bold text-text-primary tracking-tight">Welcome to MiniMe</h1>
                        <p className="text-sm mt-2 text-text-secondary">
                            Intelligence from action
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex mb-8 p-1 rounded-xl bg-elevated border border-border/50 relative">
                        <div
                            className="absolute inset-y-1 w-[calc(50%-4px)] bg-bg-base rounded-lg border border-border/50 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                            style={{ transform: activeTab === 'register' ? 'translateX(calc(100% + 2px))' : 'translateX(2px)' }}
                        />
                        <button
                            type="button"
                            onClick={() => switchTab('login')}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors relative z-10 \${activeTab === 'login' ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => switchTab('register')}
                            className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors relative z-10 \${activeTab === 'register' ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Offline warning */}
                    {isOffline && (
                        <div className="mb-6 p-4 rounded-xl text-sm bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 flex items-start gap-3">
                            <WifiOff className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold mb-0.5">Internet required to sign in</p>
                                <p className="text-xs opacity-80">First-time login requires an internet connection to verify your account. Once logged in, MiniMe works fully offline.</p>
                            </div>
                        </div>
                    )}

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 rounded-xl text-sm bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400">
                            {success}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 shadow-none">
                        {/* Full Name (register only) */}
                        {activeTab === 'register' && (
                            <div className="animate-fade-in group space-y-1.5 mt-[-8px]">
                                <label className="block text-xs font-semibold text-text-muted group-focus-within:text-text-primary transition-colors">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-elevated/50 text-text-primary placeholder:text-text-muted/50 border border-border/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div className="group space-y-1.5">
                            <label className="block text-xs font-semibold text-text-muted group-focus-within:text-text-primary transition-colors">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-elevated/50 text-text-primary placeholder:text-text-muted/50 border border-border/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="group space-y-1.5">
                            <label className="block text-xs font-semibold text-text-muted group-focus-within:text-text-primary transition-colors">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={activeTab === 'register' ? 'Min 8 chars, mixed, special' : '••••••••'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={activeTab === 'register' ? 8 : 1}
                                    className="w-full pl-10 pr-12 py-3 rounded-xl text-sm bg-elevated/50 text-text-primary placeholder:text-text-muted/50 border border-border/50 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 focus:outline-none transition-all shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-text-muted hover:bg-bg-base hover:text-text-primary transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember this device (login only) */}
                        {activeTab === 'login' && (
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2.5 cursor-pointer group" htmlFor="remember-device">
                                    <div className="relative">
                                        <input
                                            id="remember-device"
                                            type="checkbox"
                                            checked={rememberDevice}
                                            onChange={(e) => setRememberDevice(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-4 h-4 rounded border border-border/60 bg-elevated/50 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-all flex items-center justify-center">
                                            {rememberDevice && (
                                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 10">
                                                    <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-text-muted group-hover:text-text-secondary transition-colors select-none">
                                        Remember this device <span className="text-text-muted/60">(90 days)</span>
                                    </span>
                                </label>
                            </div>
                        )}
                        <button
                            id="auth-submit"
                            type="submit"
                            disabled={isSubmitting || !email || !password || (activeTab === 'login' && isOffline)}
                            className="w-full flex items-center justify-center gap-2 mt-6 py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-[0_4px_14px_0_rgba(99,102,241,0.2)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.3)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative mt-8 mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border/60" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-4 text-xs font-medium text-text-muted bg-bg-base border border-border/30 rounded-full py-0.5">
                                OR CONTINUE WITH
                            </span>
                        </div>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { /* OAuth: github */ }}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-bg-surface border border-border rounded-xl text-sm font-semibold text-text-primary hover:bg-elevated hover:border-border/80 transition-all shadow-sm active:scale-[0.98]"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </button>
                        <button
                            onClick={() => { /* OAuth: google */ }}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-bg-surface border border-border rounded-xl text-sm font-semibold text-text-primary hover:bg-elevated hover:border-border/80 transition-all shadow-sm active:scale-[0.98]"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                    </div>

                    {/* Footer Policy */}
                    <div className="mt-8 text-center text-xs text-text-muted">
                        By continuing, you agree to our{' '}
                        <a href="/legal/terms" className="text-text-primary hover:text-indigo-500 transition-colors font-medium">Terms</a>
                        {' '}and{' '}
                        <a href="/legal/privacy" className="text-text-primary hover:text-indigo-500 transition-colors font-medium">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </div>
    );
}
