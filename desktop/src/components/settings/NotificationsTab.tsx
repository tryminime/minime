import React from 'react';
import { Bell, BellOff, Mail, Moon } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import {
    SettingsSection,
    SettingsToggle,
    SettingsSelect,
    SettingsInput,
} from './SettingsComponents';

export default function NotificationsTab() {
    const { settings, updateSettings } = useSettings();
    const { notifications } = settings;

    return (
        <div className="space-y-8">
            {/* Notification Channels */}
            <SettingsSection
                title="Notification Channels"
                description="Choose how you want to be notified"
            >
                <SettingsToggle
                    label="In-app notifications"
                    description="Show notifications within the MiniMe app"
                    checked={notifications.channels.inApp}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                channels: {
                                    ...notifications.channels,
                                    inApp: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Browser notifications"
                    description="Show desktop notifications when browser is open"
                    checked={notifications.channels.browser}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                channels: {
                                    ...notifications.channels,
                                    browser: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Desktop notifications"
                    description="Native OS notifications"
                    checked={notifications.channels.desktop}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                channels: {
                                    ...notifications.channels,
                                    desktop: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Email notifications"
                    description="Send notifications via email"
                    checked={notifications.channels.email}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                channels: {
                                    ...notifications.channels,
                                    email: checked,
                                },
                            },
                        })
                    }
                />

                {notifications.channels.email && (
                    <div className="pl-8 space-y-3">
                        <SettingsInput
                            label="Email Address"
                            type="email"
                            value={notifications.emailAddress || ''}
                            onChange={(value) =>
                                updateSettings({
                                    notifications: { ...notifications, emailAddress: value },
                                })
                            }
                            placeholder="you@example.com"
                        />

                        <SettingsSelect
                            label="Email Frequency"
                            value={notifications.emailFrequency}
                            onChange={(value) =>
                                updateSettings({
                                    notifications: {
                                        ...notifications,
                                        emailFrequency: value as typeof notifications.emailFrequency,
                                    },
                                })
                            }
                            options={[
                                { value: 'instant', label: 'Instant (as they happen)' },
                                { value: 'daily', label: 'Daily digest' },
                                { value: 'weekly', label: 'Weekly summary' },
                            ]}
                        />

                        {notifications.emailFrequency !== 'instant' && (
                            <SettingsInput
                                label="Send at (24-hour format)"
                                type="time"
                                value={notifications.emailTime || '09:00'}
                                onChange={(value) =>
                                    updateSettings({
                                        notifications: { ...notifications, emailTime: value },
                                    })
                                }
                            />
                        )}
                    </div>
                )}

                <SettingsToggle
                    label="Slack notifications"
                    description="Send updates to your Slack workspace"
                    checked={notifications.channels.slack}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                channels: {
                                    ...notifications.channels,
                                    slack: checked,
                                },
                            },
                        })
                    }
                />

                {notifications.channels.slack && (
                    <div className="pl-8">
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Configure Slack Integration
                        </button>
                    </div>
                )}
            </SettingsSection>

            {/* Notification Types */}
            <SettingsSection
                title="What to Notify About"
                description="Choose which events trigger notifications"
            >
                <SettingsToggle
                    label="Daily summary"
                    description="Daily overview of your research progress"
                    checked={notifications.types.dailySummary}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                types: {
                                    ...notifications.types,
                                    dailySummary: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Deadlines & milestones"
                    description="Upcoming deadlines and project milestones"
                    checked={notifications.types.deadlines}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                types: {
                                    ...notifications.types,
                                    deadlines: checked,
                                },
                            },
                        })
                    }
                />

                {notifications.types.deadlines && (
                    <div className="pl-8">
                        <SettingsInput
                            label="Warn me (days before deadline)"
                            type="number"
                            value={notifications.deadlineWarningDays}
                            onChange={(value) =>
                                updateSettings({
                                    notifications: {
                                        ...notifications,
                                        deadlineWarningDays: parseInt(value) || 7,
                                    },
                                })
                            }
                        />
                    </div>
                )}

                <SettingsToggle
                    label="Focus sessions"
                    description="Start and end of focus/deep work sessions"
                    checked={notifications.types.focusSessions}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                types: {
                                    ...notifications.types,
                                    focusSessions: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Burnout alerts"
                    description="Warning when overworking or missing breaks"
                    checked={notifications.types.burnoutAlerts}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                types: {
                                    ...notifications.types,
                                    burnoutAlerts: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Insights & suggestions"
                    description="AI-powered productivity insights"
                    checked={notifications.types.insights}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                types: {
                                    ...notifications.types,
                                    insights: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="System notifications"
                    description="Updates, backups, and maintenance"
                    checked={notifications.types.systemNotifications}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                types: {
                                    ...notifications.types,
                                    systemNotifications: checked,
                                },
                            },
                        })
                    }
                />
            </SettingsSection>

            {/* Do Not Disturb */}
            <SettingsSection
                title="Do Not Disturb"
                description="Silence notifications during specific times"
            >
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg mb-4">
                    <div className="flex gap-3">
                        <Moon className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-1">
                                Quiet Hours
                            </h4>
                            <p className="text-sm text-purple-800 dark:text-purple-400">
                                Notifications will be silenced during your specified quiet hours.
                            </p>
                        </div>
                    </div>
                </div>

                <SettingsToggle
                    label="Enable Do Not Disturb"
                    checked={notifications.doNotDisturb.enabled}
                    onChange={(checked) =>
                        updateSettings({
                            notifications: {
                                ...notifications,
                                doNotDisturb: {
                                    ...notifications.doNotDisturb,
                                    enabled: checked,
                                },
                            },
                        })
                    }
                />

                {notifications.doNotDisturb.enabled && (
                    <div className="space-y-4 pl-4">
                        <div className="flex gap-4">
                            <SettingsInput
                                label="Quiet hours start"
                                type="time"
                                value={notifications.doNotDisturb.quietHoursStart}
                                onChange={(value) =>
                                    updateSettings({
                                        notifications: {
                                            ...notifications,
                                            doNotDisturb: {
                                                ...notifications.doNotDisturb,
                                                quietHoursStart: value,
                                            },
                                        },
                                    })
                                }
                            />

                            <SettingsInput
                                label="Quiet hours end"
                                type="time"
                                value={notifications.doNotDisturb.quietHoursEnd}
                                onChange={(value) =>
                                    updateSettings({
                                        notifications: {
                                            ...notifications,
                                            doNotDisturb: {
                                                ...notifications.doNotDisturb,
                                                quietHoursEnd: value,
                                            },
                                        },
                                    })
                                }
                            />
                        </div>

                        <SettingsToggle
                            label="Weekend mode"
                            description="Silence all notifications on Saturdays and Sundays"
                            checked={notifications.doNotDisturb.weekendMode}
                            onChange={(checked) =>
                                updateSettings({
                                    notifications: {
                                        ...notifications,
                                        doNotDisturb: {
                                            ...notifications.doNotDisturb,
                                            weekendMode: checked,
                                        },
                                    },
                                })
                            }
                        />

                        <SettingsToggle
                            label="Mute during meetings"
                            description="Auto-silence when calendar shows you're in a meeting"
                            checked={notifications.doNotDisturb.muteInMeetings}
                            onChange={(checked) =>
                                updateSettings({
                                    notifications: {
                                        ...notifications,
                                        doNotDisturb: {
                                            ...notifications.doNotDisturb,
                                            muteInMeetings: checked,
                                        },
                                    },
                                })
                            }
                        />
                    </div>
                )}
            </SettingsSection>

            {/* Quick Actions */}
            <SettingsSection title="Quick Actions" collapsible defaultExpanded={false}>
                <div className="space-y-3">
                    <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                        <span className="flex items-center gap-3">
                            <Bell className="w-5 h-5 text-gray-500" />
                            Test Notifications
                        </span>
                        <span className="text-xs text-gray-500">Send test notification</span>
                    </button>

                    <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                        <span className="flex items-center gap-3">
                            <BellOff className="w-5 h-5 text-gray-500" />
                            Snooze All (1 hour)
                        </span>
                        <span className="text-xs text-gray-500">Temporary silence</span>
                    </button>

                    <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                        <span className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-gray-500" />
                            View Notification History
                        </span>
                        <span className="text-xs text-gray-500">Last 30 days</span>
                    </button>
                </div>
            </SettingsSection>
        </div>
    );
}
