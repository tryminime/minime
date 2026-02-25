import React from 'react';
import { Camera } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import {
    SettingsSection,
    SettingsInput,
    SettingsSelect,
    SettingsToggle,
    SettingsRadioGroup,
} from './SettingsComponents';

export default function ProfileTab() {
    const { settings, updateSettings } = useSettings();
    const { profile, security, preferences } = settings;

    return (
        <div className="space-y-8">
            {/* Account Information */}
            <SettingsSection
                title="Account Information"
                description="Manage your personal information and account details"
            >
                {/* Profile Picture */}
                <div className="flex items-center gap-4 py-4">
                    <div className="relative">
                        {profile.avatarUrl ? (
                            <img
                                src={profile.avatarUrl}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                <Camera className="w-8 h-8 text-gray-400" />
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Change
                        </button>
                        {profile.avatarUrl && (
                            <button className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                Remove
                            </button>
                        )}
                    </div>
                </div>

                <SettingsInput
                    label="Full Name"
                    value={profile.fullName}
                    onChange={(value) =>
                        updateSettings({
                            profile: { ...profile, fullName: value },
                        })
                    }
                    placeholder="Enter your full name"
                    required
                />

                <div className="py-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Email
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {profile.email || 'No email set'}
                        </span>
                        {profile.emailVerified && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                                ✓ Verified
                            </span>
                        )}
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            Change Email
                        </button>
                    </div>
                </div>

                <SettingsSelect
                    label="Account Type"
                    description="Select the type that best describes your role"
                    value={profile.accountType}
                    onChange={(value) =>
                        updateSettings({
                            profile: {
                                ...profile,
                                accountType: value as typeof profile.accountType,
                            },
                        })
                    }
                    options={[
                        { value: 'phd', label: 'PhD Researcher' },
                        { value: 'postdoc', label: 'Postdoc' },
                        { value: 'faculty', label: 'Faculty' },
                        { value: 'industry', label: 'Industry' },
                        { value: 'other', label: 'Other' },
                    ]}
                />

                <SettingsSelect
                    label="Time Zone"
                    description="Used for daily summaries and notifications"
                    value={profile.timezone}
                    onChange={(value) =>
                        updateSettings({
                            profile: { ...profile, timezone: value },
                        })
                    }
                    options={[
                        { value: 'America/New_York', label: 'Eastern Time (ET)' },
                        { value: 'America/Chicago', label: 'Central Time (CT)' },
                        { value: 'America/Denver', label: 'Mountain Time (MT)' },
                        { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
                        { value: 'America/Phoenix', label: 'Arizona (MST)' },
                        { value: 'Europe/London', label: 'London (GMT)' },
                        { value: 'Europe/Paris', label: 'Paris (CET)' },
                        { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
                        { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
                    ]}
                />

                <div className="py-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Join Date
                    </label>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(profile.joinDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </span>
                </div>
            </SettingsSection>

            {/* Security */}
            <SettingsSection
                title="Security"
                description="Manage your account security and login settings"
                collapsible
                defaultExpanded={false}
            >
                <div className="py-2">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Password
                    </label>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Last changed:{' '}
                            {security.lastPasswordChange
                                ? new Date(security.lastPasswordChange).toLocaleDateString()
                                : 'Never'}
                        </span>
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Change Password
                        </button>
                    </div>
                </div>

                <SettingsToggle
                    label="Two-Factor Authentication (2FA)"
                    description={
                        security.twoFactorEnabled
                            ? `Enabled via ${security.twoFactorMethod === 'app' ? 'Authenticator App' : 'SMS'}`
                            : 'Add an extra layer of security to your account'
                    }
                    checked={security.twoFactorEnabled}
                    onChange={(checked) =>
                        updateSettings({
                            security: { ...security, twoFactorEnabled: checked },
                        })
                    }
                />

                {security.twoFactorEnabled && (
                    <div className="pl-4 space-y-2">
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            Download Backup Codes
                        </button>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline ml-4">
                            Regenerate Codes
                        </button>
                    </div>
                )}

                {security.loginHistory.length > 0 && (
                    <div className="py-2">
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Recent Login History
                        </label>
                        <div className="space-y-2">
                            {security.loginHistory.slice(0, 3).map((login) => (
                                <div
                                    key={login.id}
                                    className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between"
                                >
                                    <span>
                                        {new Date(login.timestamp).toLocaleString()} - {login.device}
                                    </span>
                                    <span className="text-xs">{login.location}</span>
                                </div>
                            ))}
                        </div>
                        <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            View Full History
                        </button>
                    </div>
                )}
            </SettingsSection>

            {/* Preferences */}
            <SettingsSection
                title="Preferences"
                description="Customize your app experience"
                collapsible
                defaultExpanded={false}
            >
                <SettingsSelect
                    label="Language"
                    value={preferences.language}
                    onChange={(value) =>
                        updateSettings({
                            preferences: { ...preferences, language: value },
                        })
                    }
                    options={[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'de', label: 'German' },
                        { value: 'fr', label: 'French' },
                        { value: 'ja', label: 'Japanese' },
                        { value: 'zh', label: 'Chinese' },
                    ]}
                />

                <SettingsRadioGroup
                    label="Theme"
                    description="Choose your preferred color scheme"
                    value={preferences.theme}
                    onChange={(value) =>
                        updateSettings({
                            preferences: {
                                ...preferences,
                                theme: value as typeof preferences.theme,
                            },
                        })
                    }
                    options={[
                        {
                            value: 'system',
                            label: 'System',
                            description: 'Match your operating system theme',
                        },
                        { value: 'light', label: 'Light', description: 'Light mode' },
                        { value: 'dark', label: 'Dark', description: 'Dark mode' },
                        {
                            value: 'auto',
                            label: 'Auto',
                            description: 'Light during day, dark at night',
                        },
                    ]}
                />

                <SettingsSelect
                    label="Accent Color"
                    value={preferences.accentColor}
                    onChange={(value) =>
                        updateSettings({
                            preferences: { ...preferences, accentColor: value },
                        })
                    }
                    options={[
                        { value: 'navy', label: 'Navy' },
                        { value: 'teal', label: 'Teal' },
                        { value: 'blue', label: 'Blue' },
                        { value: 'green', label: 'Green' },
                        { value: 'purple', label: 'Purple' },
                        { value: 'red', label: 'Red' },
                    ]}
                />

                <SettingsSelect
                    label="Start Page"
                    description="Page to open when you launch MiniMe"
                    value={preferences.startPage}
                    onChange={(value) =>
                        updateSettings({
                            preferences: { ...preferences, startPage: value },
                        })
                    }
                    options={[
                        { value: 'dashboard', label: 'Dashboard' },
                        { value: 'analytics', label: 'Analytics' },
                        { value: 'projects', label: 'Projects' },
                        { value: 'papers', label: 'Papers' },
                        { value: 'knowledge-graph', label: 'Knowledge Graph' },
                        { value: 'tasks', label: 'Tasks' },
                    ]}
                />

                <SettingsSelect
                    label="Date Format"
                    value={preferences.dateFormat}
                    onChange={(value) =>
                        updateSettings({
                            preferences: { ...preferences, dateFormat: value },
                        })
                    }
                    options={[
                        { value: 'MMM DD, YYYY', label: 'Jan 31, 2026' },
                        { value: 'DD/MM/YYYY', label: '31/01/2026' },
                        { value: 'MM/DD/YYYY', label: '01/31/2026' },
                        { value: 'YYYY-MM-DD', label: '2026-01-31' },
                    ]}
                />

                <SettingsRadioGroup
                    label="Time Format"
                    value={preferences.timeFormat}
                    onChange={(value) =>
                        updateSettings({
                            preferences: {
                                ...preferences,
                                timeFormat: value as typeof preferences.timeFormat,
                            },
                        })
                    }
                    options={[
                        { value: '12h', label: '12-hour (8:00 PM)' },
                        { value: '24h', label: '24-hour (20:00)' },
                    ]}
                />
            </SettingsSection>
        </div>
    );
}
