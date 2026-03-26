import { getAPIClient } from './api';
import { jwtDecode } from 'jwt-decode';

export interface AuthUser {
    id: string;
    email: string;
    username: string;
    full_name?: string;
    avatar_url?: string;
    role: 'user' | 'admin' | 'beta_tester';
    is_superadmin?: boolean;
    subscription_status: 'free' | 'active' | 'canceled' | 'deleted';
    created_at: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in?: number;
    remember_device?: boolean;
    expires_in_days?: number;
    has_cloud_backup?: boolean;
    last_synced_at?: string;
}

export interface TrustedDevice {
    session_id: string;
    device_name: string;
    remember_device: boolean;
    created_at: string;
    expires_at: string;
    device_info: Record<string, unknown>;
}

const REFRESH_TOKEN_KEY = 'minime_refresh_token';
const REMEMBER_DEVICE_KEY = 'minime_remember_device';
const DEVICE_NAME_KEY = 'minime_device_name';
const CACHED_USER_KEY = 'minime_cached_user';

/** Returns true when the browser has no network connectivity. */
function isOffline(): boolean {
    if (typeof window === 'undefined') return false;
    return !navigator.onLine;
}

/** Simple browser fingerprint (not cryptographic, just for labelling). */
function getBrowserFingerprint(): string {
    const parts = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    ];
    // Tiny hash
    let hash = 0;
    const str = parts.join('|');
    for (let i = 0; i < str.length; i++) {
        hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return Math.abs(hash).toString(16);
}

/** Get a human-readable device name from the browser/OS. */
function getDeviceName(): string {
    const ua = navigator.userAgent;
    if (/iPhone|iPad/.test(ua)) return 'iPhone/iPad';
    if (/Android/.test(ua)) return 'Android Device';
    if (/Mac/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows PC';
    if (/Linux/.test(ua)) return 'Linux PC';
    return 'Browser';
}

class AuthService {
    private readonly API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    /**
     * Login with email and password.
     * @param rememberDevice - If true, refresh token lasts 90 days (stored in localStorage).
     *                         If false, refresh token lasts 7 days (stored in sessionStorage).
     */
    async loginWithEmail(
        email: string,
        password: string,
        rememberDevice = false,
    ): Promise<AuthUser> {
        const api = getAPIClient();
        const response = await api.post<AuthTokens>('/api/v1/auth/login', {
            email,
            password,
            remember_device: rememberDevice,
            device_name: getDeviceName(),
            device_fingerprint: getBrowserFingerprint(),
        });

        // Store tokens — localStorage for remembered devices, sessionStorage otherwise
        api.setAuthToken(response.access_token);
        if (response.refresh_token) {
            if (rememberDevice) {
                localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
                localStorage.setItem(REMEMBER_DEVICE_KEY, 'true');
                localStorage.setItem(DEVICE_NAME_KEY, getDeviceName());
            } else {
                sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
                localStorage.setItem(REMEMBER_DEVICE_KEY, 'false');
            }
        }

        // Store cloud backup status for restore dialog
        if (response.has_cloud_backup) {
            sessionStorage.setItem('minime_has_cloud_backup', 'true');
            if (response.last_synced_at) {
                sessionStorage.setItem('minime_last_synced_at', response.last_synced_at);
            }
        }

        return this.fetchCurrentUser();
    }

    /**
     * Attempt silent login on app startup.
     *
     * Online path:  refresh the token then fetch the user profile.
     * Offline path: validate the access token locally, return the cached profile.
     *               (No network calls are made — works 100% locally.)
     *
     * Returns the authenticated user if successful, null if login is required.
     */
    async silentRefresh(): Promise<AuthUser | null> {
        const refreshToken = this.getStoredRefreshToken();
        if (!refreshToken) return null;

        // ── Offline path ─────────────────────────────────────────────
        if (isOffline()) {
            const accessToken = this.getAccessToken();
            if (accessToken && !this.isTokenExpired(accessToken)) {
                // Access token is still valid — return cached user profile
                return this.getCachedUser();
            }
            // Access token expired; can't refresh without network.
            // The user will need to reconnect and re-auth.
            return null;
        }

        // ── Online path ──────────────────────────────────────────────
        try {
            const tokens = await this.performRefresh(refreshToken);
            if (tokens) {
                return this.fetchCurrentUser();
            }
        } catch {
            // Token expired or revoked — clear it
            this.clearStoredTokens();
        }
        return null;
    }

    /**
     * Register a new account.
     */
    async register(email: string, password: string, fullName?: string): Promise<AuthUser> {
        const api = getAPIClient();
        const response = await api.post<AuthTokens>('/api/v1/auth/register', {
            email,
            password,
            full_name: fullName || undefined,
        });

        api.setAuthToken(response.access_token);
        if (response.refresh_token) {
            sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
        }

        return this.fetchCurrentUser();
    }

    /**
     * Initiate OAuth login flow.
     */
    initiateOAuth(provider: 'github' | 'google') {
        const redirectUri = `${window.location.origin}/auth/callback/${provider}`;
        const state = this.generateState();
        sessionStorage.setItem(`oauth_state_${provider}`, state);
        window.location.href = `${this.API_URL}/api/integrations/${provider}/oauth/initiate`;
    }

    /**
     * Handle OAuth callback.
     */
    async handleOAuthCallback(provider: string, code: string, state?: string): Promise<AuthUser> {
        if (state) {
            const storedState = sessionStorage.getItem(`oauth_state_${provider}`);
            if (storedState && storedState !== state) {
                throw new Error('State mismatch: CSRF attack detected');
            }
            sessionStorage.removeItem(`oauth_state_${provider}`);
        }

        const api = getAPIClient();
        const oauthResponse = await api.post<{ email: string; username?: string }>(
            `/api/integrations/${provider}/oauth/callback`,
            { code, state }
        );

        const tokenResponse = await api.post<AuthTokens>('/api/v1/auth/oauth-exchange', {
            provider,
            email: oauthResponse.email,
            full_name: oauthResponse.username || undefined,
        });

        api.setAuthToken(tokenResponse.access_token);
        if (tokenResponse.refresh_token) {
            sessionStorage.setItem(REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
        }

        return this.fetchCurrentUser();
    }

    /**
     * Fetch current authenticated user and cache the result locally.
     * The cached copy is used in offline mode to avoid showing an empty profile.
     */
    async fetchCurrentUser(): Promise<AuthUser> {
        const api = getAPIClient();
        const user = await api.get<AuthUser>('/api/v1/auth/me');
        // Persist for offline use
        try { localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user)); } catch {}
        return user;
    }

    /**
     * Return the last successfully fetched user from local cache (offline fallback).
     */
    getCachedUser(): AuthUser | null {
        try {
            const raw = localStorage.getItem(CACHED_USER_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    /**
     * Validate the current access token locally without a network call.
     * Uses the backend /verify-local endpoint.
     * Only callable when online — when offline, decode and check expiry locally.
     */
    async verifyLocalToken(): Promise<{ valid: boolean; user_id?: string }> {
        const accessToken = this.getAccessToken();
        if (!accessToken) return { valid: false };

        // Offline path: check expiry locally
        if (isOffline()) {
            return { valid: !this.isTokenExpired(accessToken) };
        }

        // Online path: server confirms the token
        try {
            const api = getAPIClient();
            return api.post<{ valid: boolean; user_id: string }>('/api/v1/auth/verify-local');
        } catch {
            // Fallback: trust local expiry check
            return { valid: !this.isTokenExpired(accessToken) };
        }
    }

    /**
     * Refresh access token using stored refresh token.
     */
    async refreshAccessToken(): Promise<AuthTokens> {
        const refreshToken = this.getStoredRefreshToken();
        if (!refreshToken) throw new Error('No refresh token available');
        const tokens = await this.performRefresh(refreshToken);
        if (!tokens) throw new Error('Token refresh failed');
        return tokens;
    }

    /**
     * List trusted devices for the current user.
     */
    async listDevices(): Promise<TrustedDevice[]> {
        const api = getAPIClient();
        const response = await api.get<{ devices: TrustedDevice[] }>('/api/v1/auth/devices');
        return response.devices;
    }

    /**
     * Revoke a specific device session.
     */
    async revokeDevice(sessionId: string): Promise<void> {
        const api = getAPIClient();
        await api.delete(`/api/v1/auth/devices/${sessionId}`);
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
            this.clearStoredTokens();
        }
    }

    /**
     * Check if token is expired.
     */
    isTokenExpired(token: string): boolean {
        try {
            const decoded: { exp: number } = jwtDecode(token);
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
     * Check if user is authenticated (access token valid OR refresh token available).
     */
    isAuthenticated(): boolean {
        const token = this.getAccessToken();
        if (token && !this.isTokenExpired(token)) return true;
        // Also consider remembered — they'll silentRefresh on startup
        return !!this.getStoredRefreshToken();
    }

    /** Whether current session has remember-device set. */
    isDeviceRemembered(): boolean {
        return localStorage.getItem(REMEMBER_DEVICE_KEY) === 'true';
    }

    // ─── Private helpers ────────────────────────────────────────────

    private getStoredRefreshToken(): string | null {
        // Check localStorage first (remembered devices), then sessionStorage
        return localStorage.getItem(REFRESH_TOKEN_KEY)
            || sessionStorage.getItem(REFRESH_TOKEN_KEY)
            || null;
    }

    private clearStoredTokens() {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(REMEMBER_DEVICE_KEY);
        localStorage.removeItem(DEVICE_NAME_KEY);
    }

    private async performRefresh(refreshToken: string): Promise<AuthTokens | null> {
        try {
            const api = getAPIClient();
            const response = await api.post<AuthTokens>('/api/v1/auth/refresh', { refresh_token: refreshToken });

            api.setAuthToken(response.access_token);
            if (response.refresh_token) {
                // Preserve the same storage location (localStorage = remembered, sessionStorage = not)
                const remembered = localStorage.getItem(REMEMBER_DEVICE_KEY) === 'true';
                if (remembered) {
                    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
                } else {
                    sessionStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token);
                }
            }
            return response;
        } catch {
            return null;
        }
    }

    private generateState(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);
    }
}

export const authService = new AuthService();


