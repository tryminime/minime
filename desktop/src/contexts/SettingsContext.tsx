import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings } from '../types/settings';
import { getSettingsAPI } from '../services/settingsAPI';

interface SettingsContextType {
    settings: Settings;
    updateSettings: (updates: Partial<Settings>) => Promise<void>;
    resetSettings: () => void;
    syncWithBackend: () => Promise<void>;
    isLoading: boolean;
    isSaving: boolean;
    backendAvailable: boolean;
    lastSynced: Date | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: Settings = {
    profile: {
        fullName: '',
        email: '',
        emailVerified: false,
        accountType: 'phd',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        joinDate: new Date().toISOString(),
    },
    security: {
        twoFactorEnabled: false,
        twoFactorMethod: 'app',
        loginHistory: [],
        connectedDevices: [],
    },
    preferences: {
        language: 'en',
        theme: 'system',
        accentColor: 'navy',
        startPage: 'dashboard',
        defaultView: {
            showAllSections: true,
            expandAllCards: true,
        },
        dateFormat: 'MMM DD, YYYY',
        timeFormat: '12h',
    },
    activityTracking: {
        enabled: true,
        trackDesktopApp: {
            projectSwitches: true,
            fileEdits: true,
            codeCommits: true,
            documentChanges: true,
        },
        trackApplicationTime: {
            ide: true,
            browser: true,
            writingApps: true,
            communication: true,
            videoCalls: true,
        },
        idleThreshold: 5,
        pauseWhenLocked: true,
        granularity: 'medium',
    },
    focus: {
        autoDetectDeepWork: true,
        deepWorkThreshold: 30,
        taskSwitchLimit: 2,
        focusScoreWeights: {
            deepWorkHours: 50,
            breakFrequency: 20,
            meetings: 10,
            socialInteraction: 20,
        },
        focusModeEnabled: true,
        defaultFocusDuration: 90,
        autoBreakDuration: 15,
    },
    projects: {
        showCompletedProjects: false,
        defaultView: 'active',
        sortBy: 'recent',
        autoCreateTasksFromCalendar: true,
        showTaskDependencies: true,
        suggestNextTask: true,
        autoScheduleTasks: true,
        targetWordCount: 8000,
        defaultWritingPace: 500,
        deadlineWarningDays: 14,
        emailReminders: true,
    },
    privacy: {
        dataCollection: {
            trackUrls: true,
            trackApplications: true,
            trackProjects: true,
            extractEntities: true,
            trackFocusMetrics: true,
            trackDeviceInfo: true,
        },
        httpsOnly: true,
        sensitiveDataFiltering: {
            creditCards: true,
            ssn: true,
            apiKeys: true,
            emails: true,
        },
        encryption: {
            localEncryption: true,
            e2eEncryption: true,
        },
        dataRetentionDays: 365,
        autoDeleteOldData: true,
    },
    integrations: {
        github: {
            connected: false,
            repositories: [],
            autoTrackCommits: true,
            showContributions: true,
            linkToResearch: true,
        },
        googleCalendar: {
            connected: false,
            calendars: [],
            autoSyncEvents: true,
            showInDashboard: true,
            blockFocusTime: true,
        },
        notion: {
            connected: false,
            syncPapers: true,
            autoBackupActivities: true,
            syncFrequency: 'daily',
        },
    },
    notifications: {
        channels: {
            inApp: true,
            browser: true,
            email: false,
            desktop: true,
            slack: false,
        },
        emailFrequency: 'daily',
        types: {
            dailySummary: true,
            deadlines: true,
            focusSessions: true,
            burnoutAlerts: true,
            insights: true,
            systemNotifications: true,
        },
        deadlineWarningDays: 7,
        doNotDisturb: {
            enabled: false,
            quietHoursStart: '18:00',
            quietHoursEnd: '09:00',
            weekendMode: false,
            muteInMeetings: true,
        },
    },
    backup: {
        autoBackupEnabled: true,
        backupFrequency: 'daily',
        backupTime: '23:00',
        retentionCount: 30,
        encryptBackups: true,
    },
};

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [backendAvailable, setBackendAvailable] = useState(false);
    const [lastSynced, setLastSynced] = useState<Date | null>(null);

    const settingsAPI = getSettingsAPI();
    const syncEnabled = import.meta.env.VITE_SYNC_SETTINGS === 'true';

    // Check backend availability on mount
    useEffect(() => {
        const checkBackend = async () => {
            if (syncEnabled) {
                const available = await settingsAPI.checkBackend();
                setBackendAvailable(available);

                if (available) {
                    console.log('✅ Backend available - settings will sync');
                } else {
                    console.log('⚠️ Backend unavailable - using localStorage only');
                }
            }
        };
        checkBackend();
    }, []);

    // Load settings from localStorage on mount
    useEffect(() => {
        const loadSettings = () => {
            try {
                const stored = localStorage.getItem('minime_settings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    setSettings({ ...DEFAULT_SETTINGS, ...parsed });
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Save settings to localStorage whenever they change
    useEffect(() => {
        if (!isLoading) {
            try {
                localStorage.setItem('minime_settings', JSON.stringify(settings));
            } catch (error) {
                console.error('Failed to save settings:', error);
            }
        }
    }, [settings, isLoading]);

    const updateSettings = async (updates: Partial<Settings>) => {
        setIsSaving(true);
        try {
            // Optimistic update - update UI immediately
            const newSettings = {
                ...settings,
                ...updates,
            };

            setSettings(newSettings);

            // Background sync to backend (if available)
            if (backendAvailable && syncEnabled) {
                try {
                    // Sync specific sections that were updated
                    if (updates.profile) {
                        await settingsAPI.updateProfile(newSettings.profile);
                    }
                    if (updates.activityTracking) {
                        // Map to backend's "tracking" field
                        await settingsAPI.updateTracking(newSettings.activityTracking as any);
                    }
                    if (updates.focus) {
                        await settingsAPI.updateFocus(newSettings.focus);
                    }
                    if (updates.privacy) {
                        await settingsAPI.updatePrivacy(newSettings.privacy as any);
                    }
                    if (updates.notifications) {
                        await settingsAPI.updateNotifications(newSettings.notifications as any);
                    }

                    setLastSynced(new Date());
                    console.log('✅ Settings synced to backend');
                } catch (syncError) {
                    console.error('⚠️ Failed to sync settings to backend:', syncError);
                    // Don't revert - localStorage still has the update
                }
            }

            console.log('Settings updated:', updates);
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    const syncWithBackend = async (): Promise<void> => {
        if (!backendAvailable) {
            throw new Error('Backend is not available');
        }

        setIsSaving(true);
        try {
            await settingsAPI.syncSettings(settings);
            setLastSynced(new Date());
            console.log('✅ All settings synced to backend');
        } catch (error) {
            console.error('❌ Failed to sync settings:', error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    const resetSettings = () => {
        setSettings(DEFAULT_SETTINGS);
        localStorage.removeItem('minime_settings');
    };

    return (
        <SettingsContext.Provider
            value={{
                settings,
                updateSettings,
                resetSettings,
                syncWithBackend,
                isLoading,
                isSaving,
                backendAvailable,
                lastSynced,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
}
