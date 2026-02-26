import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 120000; // 120 seconds for AI responses

// Types
export interface APIError {
    message: string;
    status: number;
    detail?: any;
}

export class APIClient {
    private client: AxiosInstance;
    private authToken: string | null = null;

    constructor(baseURL: string = API_BASE_URL) {
        this.client = axios.create({
            baseURL,
            timeout: API_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Important for httpOnly cookies
        });

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                // Add auth token if available
                if (this.authToken) {
                    config.headers.Authorization = `Bearer ${this.authToken}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                // Handle 401 Unauthorized (token expired)
                if (error.response?.status === 401) {
                    // Clear invalid token
                    this.clearAuthToken();

                    // Trigger re-authentication
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('auth:required'));
                    }
                }

                return Promise.reject(this.handleError(error));
            }
        );
    }

    /**
     * Set authentication token
     */
    setAuthToken(token: string): void {
        this.authToken = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('minime_auth_token', token);
        }
    }

    /**
     * Clear authentication token
     */
    clearAuthToken(): void {
        this.authToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('minime_auth_token');
        }
    }

    /**
     * Load token from localStorage
     */
    loadAuthToken(): void {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('minime_auth_token');
            if (token) {
                this.authToken = token;
            }
        }
    }

    /**
     * Check if backend is available
     */
    async checkHealth(): Promise<boolean> {
        try {
            const response = await this.client.get('/health', { timeout: 5000 });
            return response.status === 200 && response.data?.status === 'healthy';
        } catch (error) {
            console.error('Backend health check failed:', error);
            return false;
        }
    }

    /**
     * GET request
     */
    async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.get(url, config);
        return response.data;
    }

    /**
     * POST request
     */
    async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.post(url, data, config);
        return response.data;
    }

    /**
     * PUT request
     */
    async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.put(url, data, config);
        return response.data;
    }

    /**
     * DELETE request
     */
    async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.delete(url, config);
        return response.data;
    }

    /**
     * PATCH request
     */
    async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
        const response: AxiosResponse<T> = await this.client.patch(url, data, config);
        return response.data;
    }

    /**
     * Handle API errors
     */
    private handleError(error: any): APIError {
        if (error.response) {
            // Server responded with error status
            return {
                message: error.response.data?.message || error.response.data?.detail || 'Server error',
                status: error.response.status,
                detail: error.response.data,
            };
        } else if (error.request) {
            // Request made but no response received
            return {
                message: 'No response from server. Please check your connection.',
                status: 0,
                detail: error.message,
            };
        } else {
            // Error in request setup
            return {
                message: error.message || 'An unexpected error occurred',
                status: -1,
                detail: error,
            };
        }
    }
}

// Singleton instance
let apiClientInstance: APIClient | null = null;

/**
 * Get API client singleton
 */
export function getAPIClient(): APIClient {
    if (!apiClientInstance) {
        apiClientInstance = new APIClient();
        apiClientInstance.loadAuthToken();
    }
    return apiClientInstance;
}

/**
 * Reset API client (useful for testing or switching environments)
 */
export function resetAPIClient(): void {
    apiClientInstance = null;
}

export default getAPIClient;
