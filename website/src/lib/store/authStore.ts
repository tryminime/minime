import { create } from 'zustand';
import { AuthUser } from '../auth';

interface AuthState {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    setUser: (user: AuthUser | null) => void;
    setIsLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    isAuthenticated: false,

    setUser: (user) =>
        set({
            user,
            isAuthenticated: !!user,
            isLoading: false,
        }),

    setIsLoading: (loading) => set({ isLoading: loading }),

    logout: () =>
        set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        }),
}));
