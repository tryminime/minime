'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { authService } from '../auth';

export function useAuth() {
    const { user, isAuthenticated, isLoading, setUser, setIsLoading } = useAuthStore();
    const router = useRouter();

    // Fetch current user on mount
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (authService.isAuthenticated()) {
                    const currentUser = await authService.fetchCurrentUser();
                    setUser(currentUser);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Auth init error:', error);
                setUser(null);
            }
        };

        initAuth();
    }, [setUser]);

    // Listen for auth:required event
    useEffect(() => {
        const handleAuthRequired = () => {
            setUser(null);
            router.push('/auth/login');
        };

        window.addEventListener('auth:required', handleAuthRequired);
        return () => window.removeEventListener('auth:required', handleAuthRequired);
    }, [setUser, router]);

    const login = (provider: 'github' | 'google') => {
        authService.initiateOAuth(provider);
    };

    const loginWithEmail = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const user = await authService.loginWithEmail(email, password);
            setUser(user);
            router.push('/dashboard/overview');
            return user;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const register = async (email: string, password: string, fullName?: string) => {
        setIsLoading(true);
        try {
            const user = await authService.register(email, password, fullName);
            setUser(user);
            router.push('/dashboard/overview');
            return user;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
        router.push('/auth/login');
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        loginWithEmail,
        register,
        logout,
    };
}
