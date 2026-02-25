/**
 * Auth Service for MiniMe Desktop
 * Handles auto-authentication in development mode.
 * Registers or logs in a dev user and stores the JWT token.
 */

import { getAPIClient } from './api';

const DEV_EMAIL = 'dev@minime.ai';
const DEV_PASSWORD = 'DevPass123!';
const DEV_FULL_NAME = 'Dev User';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface AuthResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

/**
 * Ensure the desktop app has a valid auth token.
 * In dev mode, auto-registers a user and logs in.
 * Returns true if authenticated, false otherwise.
 */
export async function ensureAuthenticated(): Promise<boolean> {
    const api = getAPIClient();

    // Check if we already have a token that works
    const existingToken = localStorage.getItem('minime_auth_token');
    if (existingToken) {
        try {
            // Verify token is still valid by calling a protected endpoint
            await api.get('/api/v1/auth/me');
            console.log('✅ Existing auth token is valid');
            return true;
        } catch {
            console.log('⚠️ Existing token invalid, re-authenticating...');
            localStorage.removeItem('minime_auth_token');
        }
    }

    // Try login first (user may already exist)
    try {
        const loginResponse = await rawPost<AuthResponse>('/api/v1/auth/login', {
            email: DEV_EMAIL,
            password: DEV_PASSWORD,
        });

        api.setAuthToken(loginResponse.access_token);
        console.log('✅ Logged in as dev user');
        return true;
    } catch (loginError: any) {
        console.log('ℹ️ Login failed, attempting registration...');
    }

    // Register new dev user
    try {
        const registerResponse = await rawPost<AuthResponse>('/api/v1/auth/register', {
            email: DEV_EMAIL,
            password: DEV_PASSWORD,
            full_name: DEV_FULL_NAME,
        });

        api.setAuthToken(registerResponse.access_token);
        console.log('✅ Registered and logged in as dev user');
        return true;
    } catch (registerError: any) {
        console.error('❌ Auto-auth failed:', registerError?.message || registerError);
        return false;
    }
}

/**
 * Raw POST without auth interceptor (for login/register which don't need tokens)
 */
async function rawPost<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
}
