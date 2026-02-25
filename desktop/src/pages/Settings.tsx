import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Shield, Bell, Database, Link, Settings as SettingsIcon } from 'lucide-react';
import { SettingsTab } from '../types/settings';
import { useSettings } from '../contexts/SettingsContext';

// Import tab components
import ProfileTab from '../components/settings/ProfileTab';
import PreferencesTab from '../components/settings/PreferencesTab';
import PrivacyTab from '../components/settings/PrivacyTab';
import IntegrationsTab from '../components/settings/IntegrationsTab';
import DataBackupTab from '../components/settings/DataBackupTab';
import NotificationsTab from '../components/settings/NotificationsTab';

const TABS: { id: SettingsTab; label: string; Icon: React.FC<{ className?: string }> }[] = [
    { id: 'profile', label: 'Profile', Icon: User },
    { id: 'preferences', label: 'Preferences', Icon: SettingsIcon },
    { id: 'privacy', label: 'Privacy', Icon: Shield },
    { id: 'integrations', label: 'Integrations', Icon: Link },
    { id: 'data-backup', label: 'Data & Backup', Icon: Database },
    { id: 'notifications', label: 'Notifications', Icon: Bell },
];

const Settings: React.FC = () => {
    const { tab } = useParams<{ tab?: string }>();
    const navigate = useNavigate();
    const { settings, isSaving } = useSettings();
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const activeTab = (tab as SettingsTab) || 'profile';

    const handleTabChange = (newTab: SettingsTab) => {
        if (hasUnsavedChanges) {
            const confirm = window.confirm(
                'You have unsaved changes. Do you want to discard them?'
            );
            if (!confirm) return;
        }
        navigate(`/settings/${newTab}`);
        setHasUnsavedChanges(false);
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileTab />;
            case 'preferences':
                return <PreferencesTab />;
            case 'privacy':
                return <PrivacyTab />;
            case 'integrations':
                return <IntegrationsTab />;
            case 'data-backup':
                return <DataBackupTab />;
            case 'notifications':
                return <NotificationsTab />;
            default:
                return <ProfileTab />;
        }
    };

    return (
        <div className="min-h-screen bg-shell dark:bg-dark-bg">
            {/* Header */}
            <div className="bg-surface dark:bg-dark-surface border-b border-border">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <h1 className="text-h2 text-primary">Settings</h1>
                    <p className="text-body text-secondary mt-1">
                        Manage your account, privacy, and preferences
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex gap-8">
                    {/* Sidebar */}
                    <div className="w-64 flex-shrink-0">
                        <nav className="space-y-1">
                            {TABS.map((tabItem) => {
                                const { Icon } = tabItem;
                                const isActive = activeTab === tabItem.id;
                                return (
                                    <button
                                        key={tabItem.id}
                                        onClick={() => handleTabChange(tabItem.id)}
                                        className={`ds-nav-item ${isActive ? 'active' : ''}`}
                                    >
                                        <Icon className="w-5 h-5 icon" />
                                        <span className="text-body font-medium">{tabItem.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        {/* Save indicator */}
                        {isSaving && (
                            <div className="mt-4 p-3 ds-card" style={{ borderColor: 'var(--color-accent-light)' }}>
                                <div className="flex items-center gap-2 text-body" style={{ color: 'var(--color-accent)' }}>
                                    <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full"></div>
                                    Saving changes...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">{renderTabContent()}</div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
