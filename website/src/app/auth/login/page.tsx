'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Github, Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

import { useAuth } from '@/lib/hooks/useAuth';
import { useEffect, useState } from 'react';

type AuthTab = 'login' | 'register';

export default function LoginPage() {
    const { loginWithEmail, register, isAuthenticated } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<AuthTab>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
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
                await loginWithEmail(email, password);
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
        <div className="min-h-screen flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e40af 100%)',
        }}>
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
            </div>

            <div className="relative w-full max-w-md mx-4">
                {/* Card */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 60px -15px rgba(99, 102, 241, 0.15)',
                }}>
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                            style={{
                                background: 'rgba(99, 102, 241, 0.08)',
                                border: '1px solid rgba(99, 102, 241, 0.2)',
                                boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.3)',
                            }}>
                            <Image
                                src="/icon.png"
                                alt="MiniMe"
                                width={44}
                                height={44}
                                className="rounded-lg"
                                priority
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">MiniMe</h1>
                        <p className="text-sm mt-1" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                            Intelligence From Action
                        </p>
                    </div>


                    {/* Tab Switcher */}
                    <div className="flex mb-6 p-1 rounded-xl" style={{ background: 'rgba(30, 41, 59, 0.6)' }}>
                        <button
                            type="button"
                            onClick={() => switchTab('login')}
                            className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
                            style={{
                                background: activeTab === 'login' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                color: activeTab === 'login' ? '#a5b4fc' : 'rgba(148, 163, 184, 0.6)',
                                border: activeTab === 'login' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                            }}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            onClick={() => switchTab('register')}
                            className="flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-200"
                            style={{
                                background: activeTab === 'register' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                color: activeTab === 'register' ? '#a5b4fc' : 'rgba(148, 163, 184, 0.6)',
                                border: activeTab === 'register' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                            }}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl text-sm" style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#fca5a5',
                        }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 p-3 rounded-xl text-sm" style={{
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            color: '#86efac',
                        }}>
                            {success}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name (register only) */}
                        {activeTab === 'register' && (
                            <div>
                                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(148, 163, 184, 0.5)' }} />
                                    <input
                                        id="fullName"
                                        type="text"
                                        placeholder="John Doe"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all duration-200"
                                        style={{
                                            background: 'rgba(30, 41, 59, 0.5)',
                                            border: '1px solid rgba(99, 102, 241, 0.15)',
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.15)'}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(148, 163, 184, 0.5)' }} />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all duration-200"
                                    style={{
                                        background: 'rgba(30, 41, 59, 0.5)',
                                        border: '1px solid rgba(99, 102, 241, 0.15)',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.15)'}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(148, 163, 184, 0.8)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(148, 163, 184, 0.5)' }} />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={activeTab === 'register' ? 'Min 8 chars, upper, lower, digit, special' : '••••••••'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={activeTab === 'register' ? 8 : 1}
                                    className="w-full pl-10 pr-12 py-3 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all duration-200"
                                    style={{
                                        background: 'rgba(30, 41, 59, 0.5)',
                                        border: '1px solid rgba(99, 102, 241, 0.15)',
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(99, 102, 241, 0.15)'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                                    style={{ color: 'rgba(148, 163, 184, 0.5)' }}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {activeTab === 'register' && (
                                <p className="text-xs mt-1.5" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                                    Must include uppercase, lowercase, number, and special character
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            id="auth-submit"
                            type="submit"
                            disabled={isSubmitting || !email || !password}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                boxShadow: isSubmitting ? 'none' : '0 4px 14px -3px rgba(99, 102, 241, 0.4)',
                            }}
                            onMouseOver={(e) => { if (!isSubmitting) e.currentTarget.style.boxShadow = '0 6px 20px -3px rgba(99, 102, 241, 0.6)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px -3px rgba(99, 102, 241, 0.4)'; }}
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
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full" style={{ borderTop: '1px solid rgba(99, 102, 241, 0.15)' }} />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 text-xs" style={{
                                background: 'rgba(15, 23, 42, 0.8)',
                                color: 'rgba(148, 163, 184, 0.5)',
                            }}>
                                or continue with
                            </span>
                        </div>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { /* OAuth: login('github') */ }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{
                                background: 'rgba(30, 41, 59, 0.5)',
                                border: '1px solid rgba(99, 102, 241, 0.15)',
                                color: 'rgba(203, 213, 225, 0.8)',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.15)'}
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </button>
                        <button
                            onClick={() => { /* OAuth: login('google') */ }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                            style={{
                                background: 'rgba(30, 41, 59, 0.5)',
                                border: '1px solid rgba(99, 102, 241, 0.15)',
                                color: 'rgba(203, 213, 225, 0.8)',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'}
                            onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.15)'}
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

                    {/* Footer */}
                    <div className="mt-6 text-center">
                        <p className="text-xs" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
                            By continuing, you agree to our{' '}
                            <a href="/legal/terms" className="underline hover:text-indigo-400 transition-colors">Terms</a>{' '}
                            and{' '}
                            <a href="/legal/privacy" className="underline hover:text-indigo-400 transition-colors">Privacy Policy</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
