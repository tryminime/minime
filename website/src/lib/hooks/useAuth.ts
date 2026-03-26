'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { authService } from '../auth';

// Module-level flag: run initAuth only ONCE per SPA session.
// Prevents re-triggering on every component mount (layout, dashboard page, etc.)
let _authInitialized = false;

export function useAuth() {
    const { user, isAuthenticated, isLoading, setUser, setIsLoading } = useAuthStore();
    const router = useRouter();

    useEffect(() => {
        // Skip if already initialised (e.g. after a successful login + redirect)
        if (_authInitialized) return;
        _authInitialized = true;

        const initAuth = async () => {
            setIsLoading(true);
            try {
                // 1. Valid access token in storage → fetch profile and continue
                const accessToken = authService.getAccessToken();
                if (accessToken && !authService.isTokenExpired(accessToken)) {
                    const currentUser = await authService.fetchCurrentUser();
                    setUser(currentUser);
                    return;
                }
                // 2. No valid access token → try silent refresh with stored refresh token
                const refreshedUser = await authService.silentRefresh();
                setUser(refreshedUser ?? null);  // null = not logged in
            } catch (error) {
                console.error('Auth init error:', error);
                setUser(null);
            }
        };

        initAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Listen for auth:required event (e.g. 401 mid-session)
    useEffect(() => {
        const handleAuthRequired = () => {
            _authInitialized = false; // allow re-init on next login
            setUser(null);
            router.push('/auth/login');
        };
        window.addEventListener('auth:required', handleAuthRequired);
        return () => window.removeEventListener('auth:required', handleAuthRequired);
    }, [setUser, router]);

    const login = (provider: 'github' | 'google') => {
        authService.initiateOAuth(provider);
    };

    const loginWithEmail = async (email: string, password: string, rememberDevice = false) => {
        setIsLoading(true);
        try {
            const user = await authService.loginWithEmail(email, password, rememberDevice);
            _authInitialized = true; // prevent initAuth from re-running after redirect
            setUser(user);           // also clears isLoading via store
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
            _authInitialized = true;
            setUser(user);
            router.push('/dashboard/overview');
            return user;
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        _authInitialized = false; // allow re-init on next login
        await authService.logout();
        setUser(null);
        router.push('/auth/login');
    };

    const listDevices = () => authService.listDevices();
    const revokeDevice = (sessionId: string) => authService.revokeDevice(sessionId);
    const isDeviceRemembered = () => authService.isDeviceRemembered();

    return {
        user,
        isAuthenticated,
        isLoading,
        login,
        loginWithEmail,
        register,
        logout,
        listDevices,
        revokeDevice,
        isDeviceRemembered,
    };
}
