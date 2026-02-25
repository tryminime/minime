// Settings type definitions
export interface ProfileSettings {
    fullName: string;
    email: string;
    emailVerified: boolean;
    accountType: 'phd' | 'postdoc' | 'faculty' | 'industry' | 'other';
    timezone: string;
    avatarUrl?: string;
    joinDate: string;
}

export interface SecuritySettings {
    twoFactorEnabled: boolean;
    twoFactorMethod: 'app' | 'sms';
    lastPasswordChange?: string;
    loginHistory: LoginHistoryItem[];
    connectedDevices: ConnectedDevice[];
}

export interface LoginHistoryItem {
    id: string;
    timestamp: string;
    device: string;
    location: string;
    browser: string;
}

export interface ConnectedDevice {
    id: string;
    name: string;
    type: 'desktop' | 'mobile' | 'tablet';
    lastActive: string;
    current: boolean;
}

export interface PreferencesSettings {
    language: string;
    theme: 'system' | 'light' | 'dark' | 'auto';
    accentColor: string;
    startPage: string;
    defaultView: {
        showAllSections: boolean;
        expandAllCards: boolean;
    };
    dateFormat: string;
    timeFormat: '12h' | '24h';
}

export interface ActivityTrackingSettings {
    enabled: boolean;
    trackDesktopApp: {
        projectSwitches: boolean;
        fileEdits: boolean;
        codeCommits: boolean;
        documentChanges: boolean;
    };
    trackApplicationTime: {
        ide: boolean;
        browser: boolean;
        writingApps: boolean;
        communication: boolean;
        videoCalls: boolean;
    };
    idleThreshold: number; // minutes
    pauseWhenLocked: boolean;
    granularity: 'high' | 'medium' | 'low';
}

export interface FocusSettings {
    autoDetectDeepWork: boolean;
    deepWorkThreshold: number; // minutes
    taskSwitchLimit: number;
    focusScoreWeights: {
        deepWorkHours: number;
        breakFrequency: number;
        meetings: number;
        socialInteraction: number;
    };
    focusModeEnabled: boolean;
    defaultFocusDuration: number; // minutes
    autoBreakDuration: number; // minutes
}

export interface ProjectSettings {
    showCompletedProjects: boolean;
    defaultView: 'all' | 'active' | 'archived';
    sortBy: 'recent' | 'name' | 'progress';
    autoCreateTasksFromCalendar: boolean;
    showTaskDependencies: boolean;
    suggestNextTask: boolean;
    autoScheduleTasks: boolean;
    targetWordCount: number;
    defaultWritingPace: number; // words per day
    deadlineWarningDays: number;
    emailReminders: boolean;
}

export interface PrivacySettings {
    dataCollection: {
        trackUrls: boolean;
        trackApplications: boolean;
        trackProjects: boolean;
        extractEntities: boolean;
        trackFocusMetrics: boolean;
        trackDeviceInfo: boolean;
    };
    httpsOnly: boolean;
    sensitiveDataFiltering: {
        creditCards: boolean;
        ssn: boolean;
        apiKeys: boolean;
        emails: boolean;
    };
    encryption: {
        localEncryption: boolean;
        e2eEncryption: boolean;
    };
    dataRetentionDays: number;
    autoDeleteOldData: boolean;
}

export interface IntegrationSettings {
    github: {
        connected: boolean;
        username?: string;
        accessToken?: string;
        repositories: string[];
        autoTrackCommits: boolean;
        showContributions: boolean;
        linkToResearch: boolean;
    };
    googleCalendar: {
        connected: boolean;
        calendars: string[];
        autoSyncEvents: boolean;
        showInDashboard: boolean;
        blockFocusTime: boolean;
    };
    notion: {
        connected: boolean;
        syncPapers: boolean;
        autoBackupActivities: boolean;
        syncFrequency: 'realtime' | 'hourly' | 'daily';
    };
}

export interface NotificationSettings {
    channels: {
        inApp: boolean;
        browser: boolean;
        email: boolean;
        desktop: boolean;
        slack: boolean;
    };
    emailAddress?: string;
    emailFrequency: 'instant' | 'daily' | 'weekly';
    emailTime?: string;
    types: {
        dailySummary: boolean;
        deadlines: boolean;
        focusSessions: boolean;
        burnoutAlerts: boolean;
        insights: boolean;
        systemNotifications: boolean;
    };
    deadlineWarningDays: number;
    doNotDisturb: {
        enabled: boolean;
        quietHoursStart: string;
        quietHoursEnd: string;
        weekendMode: boolean;
        muteInMeetings: boolean;
    };
}

export interface BackupSettings {
    autoBackupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    backupTime: string;
    retentionCount: number;
    encryptBackups: boolean;
}

export interface Settings {
    profile: ProfileSettings;
    security: SecuritySettings;
    preferences: PreferencesSettings;
    activityTracking: ActivityTrackingSettings;
    focus: FocusSettings;
    projects: ProjectSettings;
    privacy: PrivacySettings;
    integrations: IntegrationSettings;
    notifications: NotificationSettings;
    backup: BackupSettings;
}

export type SettingsTab =
    | 'profile'
    | 'preferences'
    | 'privacy'
    | 'integrations'
    | 'data-backup'
    | 'notifications';
