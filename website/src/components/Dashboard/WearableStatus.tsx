'use client';

import { useWearableStatus, useWearableData } from '@/lib/hooks/useWearables';
import { Watch, Heart, Footprints, Moon, Wifi, WifiOff, ExternalLink } from 'lucide-react';

const PROVIDER_CONFIG: Record<string, { name: string; color: string; icon: string; gradient: string }> = {
    fitbit: {
        name: 'Fitbit',
        color: '#00B0B9',
        icon: '⌚',
        gradient: 'from-teal-500 to-cyan-400',
    },
    oura: {
        name: 'Oura Ring',
        color: '#7C7C7C',
        icon: '💍',
        gradient: 'from-gray-600 to-gray-400',
    },
    apple_health: {
        name: 'Apple Health',
        color: '#FF2D55',
        icon: '🍎',
        gradient: 'from-pink-500 to-red-400',
    },
};

export function WearableStatus() {
    const { data: providers, isLoading, error } = useWearableStatus();
    const { data: wearableData } = useWearableData(undefined, 7);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p className="font-semibold">Failed to load wearable data</p>
            </div>
        );
    }

    const providerList = providers || [];
    const connectedCount = providerList.filter(p => p.connected).length;

    return (
        <div>
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                            <Watch className="w-4 h-4 text-teal-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{connectedCount}</p>
                    <p className="text-xs text-gray-500 mt-1">Connected Devices</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Heart className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {wearableData?.total_data_points || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Data Points (7d)</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Wifi className="w-4 h-4 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{providerList.length}</p>
                    <p className="text-xs text-gray-500 mt-1">Available Providers</p>
                </div>
            </div>

            {/* Provider cards */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Wearable Providers</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {providerList.length === 0 ? (
                    // Default providers if status endpoint returns empty
                    Object.entries(PROVIDER_CONFIG).map(([key, config]) => (
                        <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{config.icon}</span>
                                        <div>
                                            <p className="font-semibold text-gray-900">{config.name}</p>
                                            <p className="text-xs text-gray-500">Not connected</p>
                                        </div>
                                    </div>
                                    <WifiOff className="w-5 h-5 text-gray-300" />
                                </div>
                                <button
                                    className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-all border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Connect
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    providerList.map(provider => {
                        const config = PROVIDER_CONFIG[provider.provider] || {
                            name: provider.name, color: '#6b7280', icon: '⌚',
                            gradient: 'from-gray-500 to-gray-400',
                        };

                        return (
                            <div
                                key={provider.provider}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                            >
                                <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{config.icon}</span>
                                            <div>
                                                <p className="font-semibold text-gray-900">{config.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {provider.connected
                                                        ? provider.device_name || 'Connected'
                                                        : 'Not connected'}
                                                </p>
                                            </div>
                                        </div>
                                        {provider.connected ? (
                                            <Wifi className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <WifiOff className="w-5 h-5 text-gray-300" />
                                        )}
                                    </div>

                                    {provider.connected && provider.last_synced && (
                                        <p className="text-xs text-gray-400 mb-3">
                                            Last synced: {new Date(provider.last_synced).toLocaleDateString('en-US', {
                                                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                                            })}
                                        </p>
                                    )}

                                    <button
                                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${provider.connected
                                                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {provider.connected ? (
                                            <>
                                                <WifiOff className="w-4 h-4" />
                                                Disconnect
                                            </>
                                        ) : (
                                            <>
                                                <ExternalLink className="w-4 h-4" />
                                                Connect
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Metric types info */}
            <div className="mt-8 bg-gray-50 rounded-xl border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tracked Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Footprints className="w-4 h-4 text-blue-500" />
                        Steps
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Heart className="w-4 h-4 text-red-500" />
                        Heart Rate
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Moon className="w-4 h-4 text-indigo-500" />
                        Sleep
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Watch className="w-4 h-4 text-green-500" />
                        Activity
                    </div>
                </div>
            </div>
        </div>
    );
}
