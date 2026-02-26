'use client';

import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/lib/auth';
import { useAuthStore } from '@/lib/store/authStore';

export default function OAuthCallbackPage({
    params,
}: {
    params: Promise<{ provider: string }>;
}) {
    const { provider } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useAuthStore((s) => s.setUser);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                const code = searchParams.get('code');
                const state = searchParams.get('state');
                const errorParam = searchParams.get('error');

                if (errorParam) {
                    throw new Error(`OAuth error: ${errorParam}`);
                }

                if (!code) {
                    throw new Error('Missing authorization code');
                }

                // Handle OAuth callback
                const user = await authService.handleOAuthCallback(
                    provider,
                    code,
                    state || undefined
                );

                setUser(user);

                // Redirect to dashboard
                router.push('/dashboard/overview');
            } catch (error) {
                console.error('Auth callback error:', error);
                setError(error instanceof Error ? error.message : 'Authentication failed');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/auth/login?error=auth_failed');
                }, 3000);
            }
        };

        handleCallback();
    }, [provider, searchParams, setUser, router]);

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50">
                <div className="text-center max-w-md">
                    <div className="mb-4 text-red-600">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-gray-900">Authentication Failed</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <p className="text-sm text-gray-500">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h1 className="text-2xl font-bold mb-2">Authenticating...</h1>
                <p className="text-gray-600">Please wait while we sign you in with {provider}.</p>
            </div>
        </div>
    );
}

