import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getIntegrationAPI } from '../services/integrationAPI';

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Processing authorization...');
    const [provider, setProvider] = useState<string>('');

    useEffect(() => {
        const handleCallback = async () => {
            // Extract OAuth parameters from URL
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            // Check for OAuth errors
            if (error) {
                setStatus('error');
                setMessage(
                    errorDescription || `Authorization failed: ${error}`
                );
                setTimeout(() => navigate('/settings'), 3000);
                return;
            }

            // Validate required parameters
            if (!code || !state) {
                setStatus('error');
                setMessage('Invalid OAuth callback - missing parameters');
                setTimeout(() => navigate('/settings'), 3000);
                return;
            }

            // Parse provider from state
            try {
                const stateData = JSON.parse(decodeURIComponent(state));
                const providerName = stateData.provider as 'github' | 'google' | 'notion';
                setProvider(providerName);

                // Call backend to complete OAuth
                const integrationAPI = getIntegrationAPI();
                const result = await integrationAPI.handleOAuthCallback(providerName, code);

                if (result.connected) {
                    setStatus('success');
                    setMessage(
                        `Successfully connected ${providerName}!${result.username ? ` Welcome, ${result.username}` : ''
                        }`
                    );
                } else {
                    setStatus('error');
                    setMessage('Failed to complete authorization');
                }
            } catch (err: any) {
                console.error('OAuth callback error:', err);
                setStatus('error');
                setMessage(
                    err.message || 'Failed to complete authorization. Please try again.'
                );
            }

            // Redirect back to settings after 2 seconds
            setTimeout(() => navigate('/settings'), 2000);
        };

        handleCallback();
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        {status === 'loading' && (
                            <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin" />
                        )}
                        {status === 'success' && (
                            <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
                        )}
                        {status === 'error' && (
                            <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                        {status === 'loading' && 'Connecting...'}
                        {status === 'success' && 'Connected Successfully!'}
                        {status === 'error' && 'Connection Failed'}
                    </h1>

                    {/* Message */}
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                        {message}
                    </p>

                    {/* Provider Badge */}
                    {provider && (
                        <div className="flex justify-center mb-4">
                            <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                                {provider}
                            </span>
                        </div>
                    )}

                    {/* Auto-redirect message */}
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                        {status === 'loading'
                            ? 'Please wait...'
                            : 'Redirecting to settings...'}
                    </p>

                    {/* Manual redirect button (if auto-redirect fails) */}
                    {status !== 'loading' && (
                        <div className="mt-6">
                            <button
                                onClick={() => navigate('/settings')}
                                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Go to Settings
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
