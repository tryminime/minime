'use client';

import { useScreenshots, useDeleteScreenshot } from '@/lib/hooks/useScreenshots';
import { Camera, Monitor, Trash2, Image, HardDrive } from 'lucide-react';

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    });
}

export function ScreenshotGallery() {
    const { data, isLoading, error } = useScreenshots(20);
    const deleteScreenshot = useDeleteScreenshot();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-500">
                <p className="font-semibold">Failed to load screenshots</p>
            </div>
        );
    }

    const screenshots = data?.screenshots || [];
    const totalSize = screenshots.reduce((sum, s) => sum + s.file_size_bytes, 0);

    return (
        <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Camera className="w-4 h-4 text-gray-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data?.total || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Total Screenshots</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <HardDrive className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatFileSize(totalSize)}</p>
                    <p className="text-xs text-gray-500 mt-1">Storage Used</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                            <Image className="w-4 h-4 text-green-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {screenshots.length > 0 ? `${screenshots[0].width}×${screenshots[0].height}` : '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Latest Resolution</p>
                </div>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <Camera className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                    <p className="text-sm font-medium text-blue-800">Screenshots are encrypted</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                        All screenshots are encrypted on your device before upload. Only metadata is shown here.
                    </p>
                </div>
            </div>

            {/* Screenshot grid */}
            {screenshots.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No screenshots captured</p>
                    <p className="text-sm mt-1">Screenshots will appear here when captured from the desktop app</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {screenshots.map(screenshot => (
                        <div
                            key={screenshot.id}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                        >
                            {/* Placeholder for encrypted image */}
                            <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <div className="text-center">
                                    <Camera className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-400">{screenshot.width} × {screenshot.height}</p>
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {screenshot.label || 'Screenshot'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            <Monitor className="w-3 h-3 inline mr-1" />
                                            {screenshot.monitor_name} · {formatFileSize(screenshot.file_size_bytes)}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {formatDate(screenshot.created_at)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => deleteScreenshot.mutate(screenshot.id)}
                                        disabled={deleteScreenshot.isPending}
                                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Delete screenshot"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
