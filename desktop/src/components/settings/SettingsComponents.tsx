import React, { ReactNode } from 'react';

interface SettingsSectionProps {
    title: string;
    description?: string;
    children: ReactNode;
    collapsible?: boolean;
    defaultExpanded?: boolean;
}

export function SettingsSection({
    title,
    description,
    children,
    collapsible = false,
    defaultExpanded = true,
}: SettingsSectionProps) {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
        <div className="mb-8">
            <div
                className={`mb-4 ${collapsible ? 'cursor-pointer' : ''}`}
                onClick={() => collapsible && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {title}
                    </h3>
                    {collapsible && (
                        <svg
                            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''
                                }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    )}
                </div>
                {description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                )}
            </div>

            {(!collapsible || isExpanded) && (
                <div className="space-y-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    {children}
                </div>
            )}
        </div>
    );
}

interface SettingsToggleProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

export function SettingsToggle({
    label,
    description,
    checked,
    onChange,
    disabled = false,
}: SettingsToggleProps) {
    return (
        <div className="flex items-start justify-between py-2">
            <div className="flex-1">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                    {label}
                </label>
                {description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                )}
            </div>
            <button
                type="button"
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                role="switch"
                aria-checked={checked}
                onClick={() => !disabled && onChange(!checked)}
                disabled={disabled}
            >
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </button>
        </div>
    );
}

interface SettingsSelectProps {
    label: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
}

export function SettingsSelect({
    label,
    description,
    value,
    onChange,
    options,
    disabled = false,
}: SettingsSelectProps) {
    return (
        <div className="py-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {label}
            </label>
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {description}
                </p>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

interface SettingsInputProps {
    label: string;
    description?: string;
    value: string | number;
    onChange: (value: string) => void;
    type?: 'text' | 'email' | 'number' | 'password' | 'time';
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
}

export function SettingsInput({
    label,
    description,
    value,
    onChange,
    type = 'text',
    placeholder,
    disabled = false,
    required = false,
}: SettingsInputProps) {
    return (
        <div className="py-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {description}
                </p>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    );
}

interface SettingsRadioGroupProps {
    label: string;
    description?: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string; description?: string }[];
    disabled?: boolean;
}

export function SettingsRadioGroup({
    label,
    description,
    value,
    onChange,
    options,
    disabled = false,
}: SettingsRadioGroupProps) {
    return (
        <div className="py-2">
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {label}
            </label>
            {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    {description}
                </p>
            )}
            <div className="space-y-2">
                {options.map((option) => (
                    <div key={option.value} className="flex items-start">
                        <input
                            type="radio"
                            id={option.value}
                            name={label}
                            value={option.value}
                            checked={value === option.value}
                            onChange={() => onChange(option.value)}
                            disabled={disabled}
                            className="h-4 w-4 mt-0.5 border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <label
                            htmlFor={option.value}
                            className="ml-3 block text-sm text-gray-900 dark:text-white"
                        >
                            {option.label}
                            {option.description && (
                                <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {option.description}
                                </span>
                            )}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
}
