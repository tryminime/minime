'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { getAPIClient } from '@/lib/api';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const api = getAPIClient();
            const response = await api.post<{ access_token: string; refresh_token: string }>('/api/v1/auth/login', {
                email,
                password,
            });

            // Store tokens
            api.setAuthToken(response.access_token);
            if (response.refresh_token) {
                localStorage.setItem('minime_refresh_token', response.refresh_token);
            }

            // Decode token to check admin status
            const payload = JSON.parse(atob(response.access_token.split('.')[1]));
            if (!payload.is_superadmin) {
                api.clearAuthToken();
                localStorage.removeItem('minime_refresh_token');
                setError('Access denied. This portal is for administrators only.');
                setIsSubmitting(false);
                return;
            }

            // Store admin flag
            localStorage.setItem('minime_is_admin', 'true');

            // Redirect to admin dashboard
            router.push('/dashboard/admin');
        } catch (err: any) {
            const message = err?.detail || err?.message || 'Invalid credentials';
            setError(typeof message === 'string' ? message : JSON.stringify(message));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
             style={{ background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0d0d2b 100%)' }}>

            {/* Animated background grid */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px]" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full max-w-[440px] mx-4 z-10">
                {/* Card */}
                <div className="bg-[#0d0d1f]/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

                    {/* Logo & Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 shadow-lg">
                            <Shield className="w-8 h-8 text-red-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
                        <p className="text-sm mt-2 text-gray-400">
                            MiniMe Platform Administration
                        </p>
                    </div>

                    {/* Security Badge */}
                    <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <Shield className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <p className="text-xs text-amber-200/80">Restricted access. Authorized personnel only.</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl text-sm bg-red-500/10 border border-red-500/20 text-red-400">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-400">
                                Admin Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    placeholder="admin@tryminime.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm bg-white/5 text-white placeholder:text-gray-600 border border-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-gray-400">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-12 py-3 rounded-xl text-sm bg-white/5 text-white placeholder:text-gray-600 border border-white/10 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 focus:outline-none transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-gray-500 hover:text-gray-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting || !email || !password}
                            className="w-full flex items-center justify-center gap-2 mt-6 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 transition-all shadow-[0_4px_14px_0_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    Access Admin Panel
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <Link href="/auth/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            ← Back to User Login
                        </Link>
                    </div>
                </div>

                {/* Bottom Text */}
                <p className="text-center text-[10px] text-gray-600 mt-4">
                    This is a secure administrative interface. All actions are logged.
                </p>
            </div>
        </div>
    );
}
