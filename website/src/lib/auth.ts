import { getAPIClient } from './api';
import { jwtDecode } from 'jwt-decode';

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    role: 'user' | 'admin' | 'beta_tester';
    subscription_status: 'free' | 'pro' | 'enterprise';
    created_at: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in?: number;
}

class AuthService {
    private readonly API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    /**
     * Login with email and password.
     */
    async loginWithEmail(email: string, password: string): Promise<AuthUser> {
        const api = getAPIClient();
        const response = await api.post<AuthTokens>('/api/v1/auth/login', {
            email,
            password,
        });

        // Store token
        api.setAuthToken(response.access_token);

        // Fetch and return user profile
        return this.fetchCurrentUser();
    }

    /**
     * Register a new account with email and password.
     */
    async register(email: string, password: string, fullName?: string): Promise<AuthUser> {
        const api = getAPIClient();
        const response = await api.post<AuthTokens>('/api/v1/auth/register', {
            email,
            password,
            full_name: fullName || undefined,
        });

        // Store token
        api.setAuthToken(response.access_token);

        // Fetch and return user profile
        return this.fetchCurrentUser();
    }

    /**
     * Initiate OAuth login flow (redirect to backend).
     */
    initiateOAuth(provider: 'github' | 'google') {
        const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
        const state = this.generateState();

        // Store state in sessionStorage for CSRF protection
        sessionStorage.setItem(`oauth_state_${provider}`, state);

        // Redirect to backend OAuth endpoint
        window.location.href = `${this.API_URL}/api/integrations/${provider}/oauth/initiate`;
    }

    /**
     * Handle OAuth callback (called by /auth/callback/[provider]).
     */
    async handleOAuthCallback(provider: string, code: string, state?: string): Promise<AuthUser> {
        // Verify state if provided
        if (state) {
            const storedState = sessionStorage.getItem(`oauth_state_${provider}`);
            if (storedState && storedState !== state) {
                throw new Error('State mismatch: CSRF attack detected');
            }
            sessionStorage.removeItem(`oauth_state_${provider}`);
        }

        const api = getAPIClient();

        // Exchange code for tokens (backend does the heavy lifting)
        const response = await api.post<any>(
            `/api/integrations/${provider}/oauth/callback`,
            { code, state }
        );

        // Backend integration API returns user info
        // We need to also login to get JWT token
        const loginResponse = await api.post<AuthTokens>('/api/v1/auth/login', {
            email: response.email,
            // In production, backend should handle OAuth->JWT conversion
        });

        // Store token
        api.setAuthToken(loginResponse.access_token);

        // Fetch user profile
        return this.fetchCurrentUser();
    }

    /**
     * Fetch current authenticated user.
     */
    async fetchCurrentUser(): Promise<AuthUser> {
        const api = getAPIClient();
        const response = await api.get<AuthUser>('/api/v1/auth/me');
        return response;
    }

    /**
     * Refresh access token using refresh token.
     */
    async refreshAccessToken(): Promise<AuthTokens> {
        const api = getAPIClient();
        const response = await api.post<AuthTokens>('/api/v1/auth/refresh');
        api.setAuthToken(response.access_token);
        return response;
    }

    /**
     * Logout user.
     */
    async logout(): Promise<void> {
        const api = getAPIClient();
        try {
            await api.post('/api/v1/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            api.clearAuthToken();
        }
    }

    /**
     * Check if token is expired.
     */
    isTokenExpired(token: string): boolean {
        try {
            const decoded: any = jwtDecode(token);
            return decoded.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    }

    /**
     * Get access token from API client.
     */
    getAccessToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('minime_auth_token');
    }

    /**
     * Check if user is authenticated.
     */
    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        if (!token) return false;
        return !this.isTokenExpired(token);
    }

    private generateState(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
}

export const authService = new AuthService();
