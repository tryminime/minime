import React from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import {
    SettingsSection,
    SettingsToggle,
    SettingsSelect,
    SettingsInput,
    SettingsRadioGroup,
} from './SettingsComponents';

export default function PreferencesTab() {
    const { settings, updateSettings } = useSettings();
    const { activityTracking, focus, projects } = settings;

    return (
        <div className="space-y-8">
            {/* Activity Tracking */}
            <SettingsSection
                title="Activity Tracking"
                description="Control what activities are tracked and how"
            >
                <SettingsToggle
                    label="Enable Activity Tracking"
                    description="When disabled, no activities will be captured"
                    checked={activityTracking.enabled}
                    onChange={(checked) =>
                        updateSettings({
                            activityTracking: { ...activityTracking, enabled: checked },
                        })
                    }
                />

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Track Desktop App Activity
                </h4>
                <div className="space-y-2 pl-4">
                    <SettingsToggle
                        label="Track project switches"
                        checked={activityTracking.trackDesktopApp.projectSwitches}
                        onChange={(checked) =>
                            updateSettings({
                                activityTracking: {
                                    ...activityTracking,
                                    trackDesktopApp: {
                                        ...activityTracking.trackDesktopApp,
                                        projectSwitches: checked,
                                    },
                                },
                            })
                        }
                        disabled={!activityTracking.enabled}
                    />
                    <SettingsToggle
                        label="Track file edits"
                        checked={activityTracking.trackDesktopApp.fileEdits}
                        onChange={(checked) =>
                            updateSettings({
                                activityTracking: {
                                    ...activityTracking,
                                    trackDesktopApp: {
                                        ...activityTracking.trackDesktopApp,
                                        fileEdits: checked,
                                    },
                                },
                            })
                        }
                        disabled={!activityTracking.enabled}
                    />
                    <SettingsToggle
                        label="Track code commits"
                        checked={activityTracking.trackDesktopApp.codeCommits}
                        onChange={(checked) =>
                            updateSettings({
                                activityTracking: {
                                    ...activityTracking,
                                    trackDesktopApp: {
                                        ...activityTracking.trackDesktopApp,
                                        codeCommits: checked,
                                    },
                                },
                            })
                        }
                        disabled={!activityTracking.enabled}
                    />
                    <SettingsToggle
                        label="Track document changes"
                        checked={activityTracking.trackDesktopApp.documentChanges}
                        onChange={(checked) =>
                            updateSettings({
                                activityTracking: {
                                    ...activityTracking,
                                    trackDesktopApp: {
                                        ...activityTracking.trackDesktopApp,
                                        documentChanges: checked,
                                    },
                                },
                            })
                        }
                        disabled={!activityTracking.enabled}
                    />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Track Application Time
                </h4>
                <div className="space-y-2 pl-4">
                    <SettingsToggle
                        label="IDE time (VS Code, PyCharm, etc.)"
                        checked={activityTracking.trackApplicationTime.ide}
                        onChange={(checked) =>
                            updateSettings({
                                activityTracking: {
                                    ...activityTracking,
                                    trackApplicationTime: {
                                        ...activityTracking.trackApplicationTime,
                                        ide: checked,
                                    },
                                },
                            })
                        }
                        disabled={!activityTracking.enabled}
                    />
                    <SettingsToggle
                        label="Browser time (all tabs)"
                        checked={activityTracking.trackApplicationTime.browser}
                        onChange={(checked) =>
                            updateSettings({
                                activityTracking: {
                                    ...activityTracking,
                                    trackApplicationTime: {
                                        ...activityTracking.trackApplicationTime,
                                        browser: checked,
                                    },
                                },
                            })
                        }
                        disabled={!activityTracking.enabled}
                    />
                    <SettingsToggle
                        label="Writing apps (Word, Google Docs)"
                        checked={activityTracking.trackApplicationTime.writingApps}
                        onChange={(checked) =>
                            updateSettings({
                                activityTracking: {
                                    ...activityTracking,
                                    trackApplicationTime: {
                                        ...activityTracking.trackApplicationTime,
                                        writingApps: checked,
                                    },
                                },
                            })
                        }
                        disabled={!activityTracking.enabled}
                    />
                    <SettingsToggle
                        label="Communication (Slack, Email)"
                        checked={activityTracking.trackApplicationTime.communication}
                        onChange={(checked) =>
                            updateSettings({
                                activityTracking: {
                                    ...activityTracking,
                                    trackApplicationTime: {
                                        ...activityTracking.trackApplicationTime,
                                        communication: checked,
                                    },
                                },
                            })
                        }
                        disabled={!activityTracking.enabled}
                    />
                    <SettingsToggle
                        label="Video calls (Zoom, Teams)"
                        checked={activityTracking.trackApplicationTime.videoCalls}
                        onChange={(checked) =>
                            updateSettings({
                                activityTracking: {
                                    ...activityTracking,
                                    trackApplicationTime: {
                                        ...activityTracking.trackApplicationTime,
                                        videoCalls: checked,
                                    },
                                },
                            })
                        }
                        disabled={!activityTracking.enabled}
                    />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <SettingsSelect
                    label="Idle Detection"
                    description="Pause tracking after this many minutes of inactivity"
                    value={activityTracking.idleThreshold.toString()}
                    onChange={(value) =>
                        updateSettings({
                            activityTracking: {
                                ...activityTracking,
                                idleThreshold: parseInt(value),
                            },
                        })
                    }
                    options={[
                        { value: '3', label: '3 minutes' },
                        { value: '5', label: '5 minutes' },
                        { value: '10', label: '10 minutes' },
                        { value: '15', label: '15 minutes' },
                        { value: '30', label: '30 minutes' },
                    ]}
                    disabled={!activityTracking.enabled}
                />

                <SettingsToggle
                    label="Pause when screen locked"
                    checked={activityTracking.pauseWhenLocked}
                    onChange={(checked) =>
                        updateSettings({
                            activityTracking: { ...activityTracking, pauseWhenLocked: checked },
                        })
                    }
                    disabled={!activityTracking.enabled}
                />

                <SettingsRadioGroup
                    label="Activity Granularity"
                    description="Level of detail to capture"
                    value={activityTracking.granularity}
                    onChange={(value) =>
                        updateSettings({
                            activityTracking: {
                                ...activityTracking,
                                granularity: value as typeof activityTracking.granularity,
                            },
                        })
                    }
                    options={[
                        {
                            value: 'high',
                            label: 'High detail',
                            description: 'Captures every action',
                        },
                        {
                            value: 'medium',
                            label: 'Medium',
                            description: 'Captures major milestones (recommended)',
                        },
                        {
                            value: 'low',
                            label: 'Low',
                            description: 'Only daily summaries',
                        },
                    ]}
                    disabled={!activityTracking.enabled}
                />
            </SettingsSection>

            {/* Focus & Deep Work */}
            <SettingsSection
                title="Focus & Deep Work"
                description="Configure focus detection and deep work tracking"
            >
                <SettingsToggle
                    label="Auto-detect deep work sessions"
                    description="Automatically identify focused work periods"
                    checked={focus.autoDetectDeepWork}
                    onChange={(checked) =>
                        updateSettings({
                            focus: { ...focus, autoDetectDeepWork: checked },
                        })
                    }
                />

                <SettingsInput
                    label="Deep Work Threshold (minutes)"
                    description="Minimum duration to qualify as deep work"
                    type="number"
                    value={focus.deepWorkThreshold}
                    onChange={(value) =>
                        updateSettings({
                            focus: { ...focus, deepWorkThreshold: parseInt(value) || 30 },
                        })
                    }
                />

                <SettingsInput
                    label="Task Switch Limit"
                    description="Maximum app switches during deep work"
                    type="number"
                    value={focus.taskSwitchLimit}
                    onChange={(value) =>
                        updateSettings({
                            focus: { ...focus, taskSwitchLimit: parseInt(value) || 2 },
                        })
                    }
                />

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Focus Score Weights (Total: 100%)
                </h4>
                <div className="space-y-3 pl-4">
                    <SettingsInput
                        label="Deep work hours"
                        type="number"
                        value={focus.focusScoreWeights.deepWorkHours}
                        onChange={(value) =>
                            updateSettings({
                                focus: {
                                    ...focus,
                                    focusScoreWeights: {
                                        ...focus.focusScoreWeights,
                                        deepWorkHours: parseInt(value) || 50,
                                    },
                                },
                            })
                        }
                    />
                    <SettingsInput
                        label="Break frequency"
                        type="number"
                        value={focus.focusScoreWeights.breakFrequency}
                        onChange={(value) =>
                            updateSettings({
                                focus: {
                                    ...focus,
                                    focusScoreWeights: {
                                        ...focus.focusScoreWeights,
                                        breakFrequency: parseInt(value) || 20,
                                    },
                                },
                            })
                        }
                    />
                    <SettingsInput
                        label="Meetings"
                        type="number"
                        value={focus.focusScoreWeights.meetings}
                        onChange={(value) =>
                            updateSettings({
                                focus: {
                                    ...focus,
                                    focusScoreWeights: {
                                        ...focus.focusScoreWeights,
                                        meetings: parseInt(value) || 10,
                                    },
                                },
                            })
                        }
                    />
                    <SettingsInput
                        label="Social interaction"
                        type="number"
                        value={focus.focusScoreWeights.socialInteraction}
                        onChange={(value) =>
                            updateSettings({
                                focus: {
                                    ...focus,
                                    focusScoreWeights: {
                                        ...focus.focusScoreWeights,
                                        socialInteraction: parseInt(value) || 20,
                                    },
                                },
                            })
                        }
                    />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <SettingsToggle
                    label="Enable Focus Mode"
                    description="Block distractions during focus sessions"
                    checked={focus.focusModeEnabled}
                    onChange={(checked) =>
                        updateSettings({
                            focus: { ...focus, focusModeEnabled: checked },
                        })
                    }
                />

                <SettingsInput
                    label="Default Focus Duration (minutes)"
                    description="How long for each focus block (Pomodoro-style)"
                    type="number"
                    value={focus.defaultFocusDuration}
                    onChange={(value) =>
                        updateSettings({
                            focus: { ...focus, defaultFocusDuration: parseInt(value) || 90 },
                        })
                    }
                    disabled={!focus.focusModeEnabled}
                />

                <SettingsInput
                    label="Auto-break After (minutes)"
                    description="Automatic break reminder"
                    type="number"
                    value={focus.autoBreakDuration}
                    onChange={(value) =>
                        updateSettings({
                            focus: { ...focus, autoBreakDuration: parseInt(value) || 15 },
                        })
                    }
                    disabled={!focus.focusModeEnabled}
                />
            </SettingsSection>

            {/* Projects & Tasks */}
            <SettingsSection
                title="Projects & Tasks"
                description="Manage project display and task automation"
            >
                <SettingsToggle
                    label="Show completed projects"
                    description="Display archived projects in project list"
                    checked={projects.showCompletedProjects}
                    onChange={(checked) =>
                        updateSettings({
                            projects: { ...projects, showCompletedProjects: checked },
                        })
                    }
                />

                <SettingsRadioGroup
                    label="Default View"
                    value={projects.defaultView}
                    onChange={(value) =>
                        updateSettings({
                            projects: {
                                ...projects,
                                defaultView: value as typeof projects.defaultView,
                            },
                        })
                    }
                    options={[
                        { value: 'all', label: 'All Projects' },
                        { value: 'active', label: 'Active Only' },
                        { value: 'archived', label: 'Archived Only' },
                    ]}
                />

                <SettingsRadioGroup
                    label="Sort By"
                    value={projects.sortBy}
                    onChange={(value) =>
                        updateSettings({
                            projects: {
                                ...projects,
                                sortBy: value as typeof projects.sortBy,
                            },
                        })
                    }
                    options={[
                        { value: 'recent', label: 'Most Recent' },
                        { value: 'name', label: 'Name (A-Z)' },
                        { value: 'progress', label: 'Progress' },
                    ]}
                />

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Task Management
                </h4>
                <div className="space-y-2">
                    <SettingsToggle
                        label="Auto-create tasks from calendar"
                        checked={projects.autoCreateTasksFromCalendar}
                        onChange={(checked) =>
                            updateSettings({
                                projects: { ...projects, autoCreateTasksFromCalendar: checked },
                            })
                        }
                    />
                    <SettingsToggle
                        label="Show task dependencies"
                        checked={projects.showTaskDependencies}
                        onChange={(checked) =>
                            updateSettings({
                                projects: { ...projects, showTaskDependencies: checked },
                            })
                        }
                    />
                    <SettingsToggle
                        label="Suggest next task based on priority"
                        checked={projects.suggestNextTask}
                        onChange={(checked) =>
                            updateSettings({
                                projects: { ...projects, suggestNextTask: checked },
                            })
                        }
                    />
                    <SettingsToggle
                        label="Auto-schedule tasks in calendar"
                        checked={projects.autoScheduleTasks}
                        onChange={(checked) =>
                            updateSettings({
                                projects: { ...projects, autoScheduleTasks: checked },
                            })
                        }
                    />
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Paper Tracking
                </h4>
                <SettingsInput
                    label="Target Word Count Per Paper"
                    type="number"
                    value={projects.targetWordCount}
                    onChange={(value) =>
                        updateSettings({
                            projects: { ...projects, targetWordCount: parseInt(value) || 8000 },
                        })
                    }
                />

                <SettingsInput
                    label="Default Writing Pace (words/day)"
                    type="number"
                    value={projects.defaultWritingPace}
                    onChange={(value) =>
                        updateSettings({
                            projects: { ...projects, defaultWritingPace: parseInt(value) || 500 },
                        })
                    }
                />

                <SettingsInput
                    label="Deadline Warning (days before)"
                    type="number"
                    value={projects.deadlineWarningDays}
                    onChange={(value) =>
                        updateSettings({
                            projects: { ...projects, deadlineWarningDays: parseInt(value) || 14 },
                        })
                    }
                />

                <SettingsToggle
                    label="Email reminders for deadlines"
                    checked={projects.emailReminders}
                    onChange={(checked) =>
                        updateSettings({
                            projects: { ...projects, emailReminders: checked },
                        })
                    }
                />
            </SettingsSection>
        </div>
    );
}
