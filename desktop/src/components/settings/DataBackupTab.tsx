import React from 'react';
import { Download, Upload, Trash2, Database, HardDrive } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import {
    SettingsSection,
    SettingsToggle,
    SettingsSelect,
    SettingsInput,
} from './SettingsComponents';

export default function DataBackupTab() {
    const { settings, updateSettings } = useSettings();
    const { backup } = settings;

    const handleExportData = () => {
        // TODO: Implement actual data export
        const dataStr = JSON.stringify(settings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `minime-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportData = () => {
        // TODO: Implement actual data import
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event: any) => {
                    try {
                        const imported = JSON.parse(event.target.result);
                        updateSettings(imported);
                        alert('Data imported successfully!');
                    } catch (error) {
                        alert('Failed to import data. Invalid file format.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <div className="space-y-8">
            {/* Automatic Backups */}
            <SettingsSection
                title="Automatic Backups"
                description="Configure automatic data backups"
            >
                <SettingsToggle
                    label="Enable automatic backups"
                    description="Automatically backup your data on a schedule"
                    checked={backup.autoBackupEnabled}
                    onChange={(checked) =>
                        updateSettings({
                            backup: { ...backup, autoBackupEnabled: checked },
                        })
                    }
                />

                {backup.autoBackupEnabled && (
                    <div className="space-y-4 pt-2">
                        <SettingsSelect
                            label="Backup Frequency"
                            value={backup.backupFrequency}
                            onChange={(value) =>
                                updateSettings({
                                    backup: {
                                        ...backup,
                                        backupFrequency: value as typeof backup.backupFrequency,
                                    },
                                })
                            }
                            options={[
                                { value: 'daily', label: 'Daily' },
                                { value: 'weekly', label: 'Weekly' },
                                { value: 'monthly', label: 'Monthly' },
                            ]}
                        />

                        <SettingsInput
                            label="Backup Time"
                            description="Time of day to run backups (24-hour format)"
                            type="time"
                            value={backup.backupTime}
                            onChange={(value) =>
                                updateSettings({
                                    backup: { ...backup, backupTime: value },
                                })
                            }
                        />

                        <SettingsInput
                            label="Retention Count"
                            description="Number of backups to keep (older ones are deleted)"
                            type="number"
                            value={backup.retentionCount}
                            onChange={(value) =>
                                updateSettings({
                                    backup: { ...backup, retentionCount: parseInt(value) || 30 },
                                })
                            }
                        />

                        <SettingsToggle
                            label="Encrypt backups"
                            description="Encrypt backup files with AES-256"
                            checked={backup.encryptBackups}
                            onChange={(checked) =>
                                updateSettings({
                                    backup: { ...backup, encryptBackups: checked },
                                })
                            }
                        />

                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                                Next Backup
                            </h4>
                            <p className="text-sm text-blue-800 dark:text-blue-400">
                                Scheduled for today at {backup.backupTime}
                            </p>
                            <button className="mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                Run Backup Now
                            </button>
                        </div>
                    </div>
                )}
            </SettingsSection>

            {/* Import/Export */}
            <SettingsSection title="Import & Export" description="Manually backup or restore your data">
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-start gap-4">
                            <Download className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    Export Data
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Download all your settings, activities, projects, and papers as a JSON file
                                </p>
                                <button
                                    onClick={handleExportData}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                    Export All Data
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-start gap-4">
                            <Upload className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    Import Data
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Restore from a previously exported backup file
                                </p>
                                <button
                                    onClick={handleImportData}
                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                >
                                    Import from File
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex gap-3">
                            <HardDrive className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
                                    Backup Location
                                </h4>
                                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                                    Backups are stored locally at:{' '}
                                    <code className="bg-yellow-100 dark:bg-yellow-900/40 px-1 py-0.5 rounded text-xs">
                                        ~/MiniMe/backups/
                                    </code>
                                </p>
                                <button className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 hover:underline">
                                    Open Backup Folder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* Storage & Cleanup */}
            <SettingsSection
                title="Storage & Cleanup"
                description="Manage local storage and clean up old data"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Storage Used
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Estimated local storage usage
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                    256 MB
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    of unlimited
                                </div>
                            </div>
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: '15%' }}
                            ></div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">Activities</div>
                                <div className="font-semibold text-gray-900 dark:text-white">
                                    128 MB
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">Papers</div>
                                <div className="font-semibold text-gray-900 dark:text-white">64 MB</div>
                            </div>
                            <div>
                                <div className="text-gray-500 dark:text-gray-400">Backups</div>
                                <div className="font-semibold text-gray-900 dark:text-white">64 MB</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                            <span className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-gray-500" />
                                Clear Cache
                            </span>
                            <span className="text-xs text-gray-500">Free 32 MB</span>
                        </button>

                        <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                            <span className="flex items-center gap-3">
                                <Trash2 className="w-5 h-5 text-gray-500" />
                                Delete Old Activities (180+ days)
                            </span>
                            <span className="text-xs text-gray-500">Free 48 MB</span>
                        </button>

                        <button className="w-full px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                            <span className="flex items-center gap-3">
                                <Trash2 className="w-5 h-5 text-gray-500" />
                                Remove Old Backups (Keep last 10)
                            </span>
                            <span className="text-xs text-gray-500">Free 24 MB</span>
                        </button>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex gap-3">
                            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">
                                    Danger Zone
                                </h4>
                                <p className="text-sm text-red-800 dark:text-red-400 mb-3">
                                    Permanently delete all data. This cannot be undone.
                                </p>
                                <button className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                                    Delete All Local Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* Sync Settings */}
            <SettingsSection
                title="Cloud Sync (Coming Soon)"
                description="Sync your data across devices"
                collapsible
                defaultExpanded={false}
            >
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-60">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                        Cloud sync is coming soon! You'll be able to sync your data securely across all
                        your devices.
                    </p>
                </div>
            </SettingsSection>
        </div>
    );
}
