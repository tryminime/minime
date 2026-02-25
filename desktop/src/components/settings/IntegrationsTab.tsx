import React, { useState, useEffect } from 'react';
import { Github, Calendar, FileText, Link as LinkIcon, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { getIntegrationAPI } from '../../services/integrationAPI';
import {
    SettingsSection,
    SettingsToggle,
    SettingsSelect,
    SettingsInput,
} from './SettingsComponents';

export default function IntegrationsTab() {
    const { settings, updateSettings } = useSettings();
    const { integrations } = settings;

    const [isConnectingGithub, setIsConnectingGithub] = useState(false);
    const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);
    const [isConnectingNotion, setIsConnectingNotion] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const integrationAPI = getIntegrationAPI();

    // Real OAuth flow for GitHub
    const handleGithubConnect = async () => {
        if (integrations.github.connected) {
            // Disconnect
            setIsConnectingGithub(true);
            setError(null);
            try {
                await integrationAPI.disconnectGitHub();
                updateSettings({
                    integrations: {
                        ...integrations,
                        github: {
                            ...integrations.github,
                            connected: false,
                            username: undefined,
                            repositories: [],
                        },
                    },
                });
            } catch (err: any) {
                setError(`Failed to disconnect GitHub: ${err.message}`);
            } finally {
                setIsConnectingGithub(false);
            }
        } else {
            // Connect via OAuth
            setIsConnectingGithub(true);
            setError(null);
            try {
                const { auth_url } = await integrationAPI.initiateGitHubOAuth();
                // Open OAuth URL in new window/tab
                window.open(auth_url, '_blank', 'width=600,height=700');
                // Note: Connection status will be updated when OAuth completes
            } catch (err: any) {
                setError(`Failed to connect GitHub: ${err.message}`);
                setIsConnectingGithub(false);
            }
        }
    };

    // Real OAuth flow for Google Calendar
    const handleCalendarConnect = async () => {
        if (integrations.googleCalendar.connected) {
            // Disconnect
            setIsConnectingCalendar(true);
            setError(null);
            try {
                await integrationAPI.disconnectGoogle();
                updateSettings({
                    integrations: {
                        ...integrations,
                        googleCalendar: {
                            ...integrations.googleCalendar,
                            connected: false,
                            calendars: [],
                        },
                    },
                });
            } catch (err: any) {
                setError(`Failed to disconnect Google: ${err.message}`);
            } finally {
                setIsConnectingCalendar(false);
            }
        } else {
            // Connect via OAuth
            setIsConnectingCalendar(true);
            setError(null);
            try {
                const { auth_url } = await integrationAPI.initiateGoogleOAuth();
                window.open(auth_url, '_blank', 'width=600,height=700');
            } catch (err: any) {
                setError(`Failed to connect Google: ${err.message}`);
                setIsConnectingCalendar(false);
            }
        }
    };

    // Real OAuth flow for Notion
    const handleNotionConnect = async () => {
        if (integrations.notion.connected) {
            // Disconnect
            setIsConnectingNotion(true);
            setError(null);
            try {
                await integrationAPI.disconnectNotion();
                updateSettings({
                    integrations: {
                        ...integrations,
                        notion: {
                            ...integrations.notion,
                            connected: false,
                        },
                    },
                });
            } catch (err: any) {
                setError(`Failed to disconnect Notion: ${err.message}`);
            } finally {
                setIsConnectingNotion(false);
            }
        } else {
            // Connect via OAuth
            setIsConnectingNotion(true);
            setError(null);
            try {
                const { auth_url } = await integrationAPI.initiateNotionOAuth();
                window.open(auth_url, '_blank', 'width=600,height=700');
            } catch (err: any) {
                setError(`Failed to connect Notion: ${err.message}`);
                setIsConnectingNotion(false);
            }
        }
    };

    // Check integration statuses on mount
    useEffect(() => {
        const checkStatuses = async () => {
            try {
                // Check GitHub
                const githubStatus = await integrationAPI.getGitHubStatus();
                if (githubStatus.connected && !integrations.github.connected) {
                    updateSettings({
                        integrations: {
                            ...integrations,
                            github: {
                                ...integrations.github,
                                connected: true,
                                username: githubStatus.username,
                            },
                        },
                    });
                }

                // Check Google
                const googleStatus = await integrationAPI.getGoogleStatus();
                if (googleStatus.connected && !integrations.googleCalendar.connected) {
                    updateSettings({
                        integrations: {
                            ...integrations,
                            googleCalendar: {
                                ...integrations.googleCalendar,
                                connected: true,
                            },
                        },
                    });
                }

                // Check Notion
                const notionStatus = await integrationAPI.getNotionStatus();
                if (notionStatus.connected && !integrations.notion.connected) {
                    updateSettings({
                        integrations: {
                            ...integrations,
                            notion: {
                                ...integrations.notion,
                                connected: true,
                            },
                        },
                    });
                }
            } catch (err) {
                // Silently fail - backend might not be available
                console.log('Could not check integration statuses:', err);
            }
        };

        checkStatuses();
    }, []);

    return (
        <div className="space-y-8">
            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="ml-auto text-sm text-red-600 dark:text-red-400 hover:underline"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* GitHub Integration */}
            <SettingsSection
                title="GitHub"
                description="Connect your GitHub account to track code contributions"
            >
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Github className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                GitHub
                            </h4>
                            {integrations.github.connected ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm text-green-600 dark:text-green-400">
                                        Connected as @{integrations.github.username}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <XCircle className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Not connected
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleGithubConnect}
                        disabled={isConnectingGithub}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${integrations.github.connected
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            } ${isConnectingGithub ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isConnectingGithub
                            ? 'Connecting...'
                            : integrations.github.connected
                                ? 'Disconnect'
                                : 'Connect'}
                    </button>
                </div>

                {integrations.github.connected && (
                    <div className="space-y-4 pt-4">
                        <SettingsToggle
                            label="Auto-track commits"
                            description="Automatically log git commits to research timeline"
                            checked={integrations.github.autoTrackCommits}
                            onChange={(checked) =>
                                updateSettings({
                                    integrations: {
                                        ...integrations,
                                        github: {
                                            ...integrations.github,
                                            autoTrackCommits: checked,
                                        },
                                    },
                                })
                            }
                        />

                        <SettingsToggle
                            label="Show contributions in dashboard"
                            description="Display GitHub activity graph"
                            checked={integrations.github.showContributions}
                            onChange={(checked) =>
                                updateSettings({
                                    integrations: {
                                        ...integrations,
                                        github: {
                                            ...integrations.github,
                                            showContributions: checked,
                                        },
                                    },
                                })
                            }
                        />

                        <SettingsToggle
                            label="Link commits to research projects"
                            description="Automatically associate commits with active projects"
                            checked={integrations.github.linkToResearch}
                            onChange={(checked) =>
                                updateSettings({
                                    integrations: {
                                        ...integrations,
                                        github: {
                                            ...integrations.github,
                                            linkToResearch: checked,
                                        },
                                    },
                                })
                            }
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Tracked Repositories ({integrations.github.repositories.length})
                            </label>
                            {integrations.github.repositories.length > 0 ? (
                                <div className="space-y-2">
                                    {integrations.github.repositories.map((repo, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"
                                        >
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {repo}
                                            </span>
                                            <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                                                Remove
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    No repositories selected
                                </p>
                            )}
                            <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                + Add Repository
                            </button>
                        </div>
                    </div>
                )}
            </SettingsSection>

            {/* Google Calendar Integration */}
            <SettingsSection
                title="Google Calendar"
                description="Sync your calendar to track meetings and block focus time"
            >
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Google Calendar
                            </h4>
                            {integrations.googleCalendar.connected ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm text-green-600 dark:text-green-400">
                                        Connected ({integrations.googleCalendar.calendars.length} calendars)
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <XCircle className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Not connected
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleCalendarConnect}
                        disabled={isConnectingCalendar}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${integrations.googleCalendar.connected
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            } ${isConnectingCalendar ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isConnectingCalendar
                            ? 'Connecting...'
                            : integrations.googleCalendar.connected
                                ? 'Disconnect'
                                : 'Connect'}
                    </button>
                </div>

                {integrations.googleCalendar.connected && (
                    <div className="space-y-4 pt-4">
                        <SettingsToggle
                            label="Auto-sync events"
                            description="Keep calendar events synced in real-time"
                            checked={integrations.googleCalendar.autoSyncEvents}
                            onChange={(checked) =>
                                updateSettings({
                                    integrations: {
                                        ...integrations,
                                        googleCalendar: {
                                            ...integrations.googleCalendar,
                                            autoSyncEvents: checked,
                                        },
                                    },
                                })
                            }
                        />

                        <SettingsToggle
                            label="Show in dashboard"
                            description="Display today's meetings in dashboard"
                            checked={integrations.googleCalendar.showInDashboard}
                            onChange={(checked) =>
                                updateSettings({
                                    integrations: {
                                        ...integrations,
                                        googleCalendar: {
                                            ...integrations.googleCalendar,
                                            showInDashboard: checked,
                                        },
                                    },
                                })
                            }
                        />

                        <SettingsToggle
                            label="Block focus time"
                            description="Automatically create 'Focus Time' blocks in calendar"
                            checked={integrations.googleCalendar.blockFocusTime}
                            onChange={(checked) =>
                                updateSettings({
                                    integrations: {
                                        ...integrations,
                                        googleCalendar: {
                                            ...integrations.googleCalendar,
                                            blockFocusTime: checked,
                                        },
                                    },
                                })
                            }
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Synced Calendars
                            </label>
                            {integrations.googleCalendar.calendars.map((cal, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded mb-2"
                                >
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{cal}</span>
                                    <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                        Settings
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </SettingsSection>

            {/* Notion Integration */}
            <SettingsSection
                title="Notion"
                description="Sync research papers and notes with Notion"
            >
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-gray-700 dark:text-gray-300" />
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                Notion
                            </h4>
                            {integrations.notion.connected ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm text-green-600 dark:text-green-400">
                                        Connected
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <XCircle className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        Not connected
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleNotionConnect}
                        disabled={isConnectingNotion}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${integrations.notion.connected
                            ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                            : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                            } ${isConnectingNotion ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isConnectingNotion
                            ? 'Connecting...'
                            : integrations.notion.connected
                                ? 'Disconnect'
                                : 'Connect'}
                    </button>
                </div>

                {integrations.notion.connected && (
                    <div className="space-y-4 pt-4">
                        <SettingsToggle
                            label="Sync papers to Notion"
                            description="Automatically create Notion pages for research papers"
                            checked={integrations.notion.syncPapers}
                            onChange={(checked) =>
                                updateSettings({
                                    integrations: {
                                        ...integrations,
                                        notion: {
                                            ...integrations.notion,
                                            syncPapers: checked,
                                        },
                                    },
                                })
                            }
                        />

                        <SettingsToggle
                            label="Auto-backup activities"
                            description="Daily backup of activities to Notion database"
                            checked={integrations.notion.autoBackupActivities}
                            onChange={(checked) =>
                                updateSettings({
                                    integrations: {
                                        ...integrations,
                                        notion: {
                                            ...integrations.notion,
                                            autoBackupActivities: checked,
                                        },
                                    },
                                })
                            }
                        />

                        <SettingsSelect
                            label="Sync Frequency"
                            value={integrations.notion.syncFrequency}
                            onChange={(value) =>
                                updateSettings({
                                    integrations: {
                                        ...integrations,
                                        notion: {
                                            ...integrations.notion,
                                            syncFrequency: value as typeof integrations.notion.syncFrequency,
                                        },
                                    },
                                })
                            }
                            options={[
                                { value: 'realtime', label: 'Real-time' },
                                { value: 'hourly', label: 'Every hour' },
                                { value: 'daily', label: 'Daily' },
                            ]}
                        />
                    </div>
                )}
            </SettingsSection>

            {/* Coming Soon */}
            <SettingsSection
                title="Coming Soon"
                description="More integrations in development"
                collapsible
                defaultExpanded={false}
            >
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { name: 'Zotero', icon: FileText, status: 'In Development' },
                        { name: 'Slack', icon: LinkIcon, status: 'Planned' },
                        { name: 'Trello', icon: LinkIcon, status: 'Planned' },
                        { name: 'Overleaf', icon: FileText, status: 'Planned' },
                        { name: 'Mendeley', icon: FileText, status: 'Planned' },
                        { name: 'Microsoft Teams', icon: LinkIcon, status: 'Planned' },
                    ].map((integration) => {
                        const Icon = integration.icon;
                        return (
                            <div
                                key={integration.name}
                                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-60"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon className="w-6 h-6 text-gray-500" />
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {integration.name}
                                    </h4>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {integration.status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </SettingsSection>
        </div>
    );
}
