import React from 'react';
import { Shield, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import {
    SettingsSection,
    SettingsToggle,
    SettingsSelect,
    SettingsInput,
} from './SettingsComponents';

export default function PrivacyTab() {
    const { settings, updateSettings } = useSettings();
    const { privacy } = settings;

    return (
        <div className="space-y-8">
            {/* Data Collection */}
            <SettingsSection
                title="Data Collection"
                description="Control what data MiniMe collects and processes"
            >
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                    <div className="flex gap-3">
                        <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                Privacy First
                            </h4>
                            <p className="text-sm text-blue-800 dark:text-blue-400">
                                All data is stored locally and encrypted. You control what is tracked.
                            </p>
                        </div>
                    </div>
                </div>

                <SettingsToggle
                    label="Track URLs and web activity"
                    description="Monitor visited pages and research sources"
                    checked={privacy.dataCollection.trackUrls}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: {
                                ...privacy,
                                dataCollection: {
                                    ...privacy.dataCollection,
                                    trackUrls: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Track applications used"
                    description="Record time spent in different apps"
                    checked={privacy.dataCollection.trackApplications}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: {
                                ...privacy,
                                dataCollection: {
                                    ...privacy.dataCollection,
                                    trackApplications: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Track projects and papers"
                    description="Monitor research projects and writing progress"
                    checked={privacy.dataCollection.trackProjects}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: {
                                ...privacy,
                                dataCollection: {
                                    ...privacy.dataCollection,
                                    trackProjects: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Extract entities (people, places, topics)"
                    description="Identify key concepts from your research"
                    checked={privacy.dataCollection.extractEntities}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: {
                                ...privacy,
                                dataCollection: {
                                    ...privacy.dataCollection,
                                    extractEntities: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Track focus metrics"
                    description="Calculate productivity and focus scores"
                    checked={privacy.dataCollection.trackFocusMetrics}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: {
                                ...privacy,
                                dataCollection: {
                                    ...privacy.dataCollection,
                                    trackFocusMetrics: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="Collect device information"
                    description="OS version, screen resolution, etc. for debugging"
                    checked={privacy.dataCollection.trackDeviceInfo}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: {
                                ...privacy,
                                dataCollection: {
                                    ...privacy.dataCollection,
                                    trackDeviceInfo: checked,
                                },
                            },
                        })
                    }
                />
            </SettingsSection>

            {/* Security & Encryption */}
            <SettingsSection
                title="Security & Encryption"
                description="Protect your data with encryption"
            >
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
                    <div className="flex gap-3">
                        <Shield className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-1">
                                Military-Grade Encryption
                            </h4>
                            <p className="text-sm text-green-800 dark:text-green-400">
                                AES-256 encryption protects your research and personal data.
                            </p>
                        </div>
                    </div>
                </div>

                <SettingsToggle
                    label="Local encryption"
                    description="Encrypt data stored on this device (recommended)"
                    checked={privacy.encryption.localEncryption}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: {
                                ...privacy,
                                encryption: {
                                    ...privacy.encryption,
                                    localEncryption: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="End-to-end encryption"
                    description="Encrypt data in transit and at rest (if using cloud sync)"
                    checked={privacy.encryption.e2eEncryption}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: {
                                ...privacy,
                                encryption: {
                                    ...privacy.encryption,
                                    e2eEncryption: checked,
                                },
                            },
                        })
                    }
                />

                <SettingsToggle
                    label="HTTPS only"
                    description="Reject insecure HTTP connections"
                    checked={privacy.httpsOnly}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: { ...privacy, httpsOnly: checked },
                        })
                    }
                />

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Sensitive Data Filtering
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    Automatically redact sensitive information from tracked data
                </p>

                <div className="space-y-2 pl-4">
                    <SettingsToggle
                        label="Filter credit card numbers"
                        checked={privacy.sensitiveDataFiltering.creditCards}
                        onChange={(checked) =>
                            updateSettings({
                                privacy: {
                                    ...privacy,
                                    sensitiveDataFiltering: {
                                        ...privacy.sensitiveDataFiltering,
                                        creditCards: checked,
                                    },
                                },
                            })
                        }
                    />

                    <SettingsToggle
                        label="Filter Social Security Numbers (SSN)"
                        checked={privacy.sensitiveDataFiltering.ssn}
                        onChange={(checked) =>
                            updateSettings({
                                privacy: {
                                    ...privacy,
                                    sensitiveDataFiltering: {
                                        ...privacy.sensitiveDataFiltering,
                                        ssn: checked,
                                    },
                                },
                            })
                        }
                    />

                    <SettingsToggle
                        label="Filter API keys and tokens"
                        checked={privacy.sensitiveDataFiltering.apiKeys}
                        onChange={(checked) =>
                            updateSettings({
                                privacy: {
                                    ...privacy,
                                    sensitiveDataFiltering: {
                                        ...privacy.sensitiveDataFiltering,
                                        apiKeys: checked,
                                    },
                                },
                            })
                        }
                    />

                    <SettingsToggle
                        label="Filter email addresses"
                        checked={privacy.sensitiveDataFiltering.emails}
                        onChange={(checked) =>
                            updateSettings({
                                privacy: {
                                    ...privacy,
                                    sensitiveDataFiltering: {
                                        ...privacy.sensitiveDataFiltering,
                                        emails: checked,
                                    },
                                },
                            })
                        }
                    />
                </div>
            </SettingsSection>

            {/* Data Retention & Deletion */}
            <SettingsSection
                title="Data Retention & Deletion"
                description="GDPR compliance and data lifecycle management"
            >
                <SettingsSelect
                    label="Data Retention Period"
                    description="How long to keep activity data"
                    value={privacy.dataRetentionDays.toString()}
                    onChange={(value) =>
                        updateSettings({
                            privacy: { ...privacy, dataRetentionDays: parseInt(value) },
                        })
                    }
                    options={[
                        { value: '30', label: '30 days' },
                        { value: '90', label: '90 days (3 months)' },
                        { value: '180', label: '180 days (6 months)' },
                        { value: '365', label: '365 days (1 year)' },
                        { value: '730', label: '730 days (2 years)' },
                        { value: '-1', label: 'Keep forever' },
                    ]}
                />

                <SettingsToggle
                    label="Auto-delete old data"
                    description="Automatically remove data older than retention period"
                    checked={privacy.autoDeleteOldData}
                    onChange={(checked) =>
                        updateSettings({
                            privacy: { ...privacy, autoDeleteOldData: checked },
                        })
                    }
                />

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                                Danger Zone
                            </h4>
                            <p className="text-sm text-red-800 dark:text-red-400 mb-4">
                                These actions are permanent and cannot be undone.
                            </p>
                            <div className="space-y-2">
                                <button className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                    Delete All Activity Data
                                </button>
                                <button className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-2">
                                    Delete All Personal Information
                                </button>
                                <button className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors ml-2">
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* GDPR & Privacy Rights */}
            <SettingsSection
                title="Your Privacy Rights (GDPR)"
                description="Exercise your data rights under GDPR"
                collapsible
                defaultExpanded={false}
            >
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Right to Access
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Request a copy of all data we have about you
                        </p>
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Download My Data
                        </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Right to Portability
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Export your data in a machine-readable format
                        </p>
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Export Data (JSON)
                        </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Right to Rectification
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Correct inaccurate personal data
                        </p>
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Update My Information
                        </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Right to Erasure ("Right to be Forgotten")
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Request complete deletion of your data
                        </p>
                        <button className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            Request Data Deletion
                        </button>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Consent Management
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            View and withdraw consent for data processing
                        </p>
                        <button className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                            Manage Consent
                        </button>
                    </div>
                </div>
            </SettingsSection>
        </div>
    );
}
