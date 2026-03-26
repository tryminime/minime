'use client';

import { useState, useEffect } from 'react';
import { useRestoreFromCloud, useSyncHistory } from '@/lib/hooks/useCloudSyncSchedule';

/**
 * RestoreDialog — Shown after login when the user has cloud backup data.
 *
 * Checks sessionStorage for `minime_has_cloud_backup` (set by auth.ts after login).
 * If found, shows a modal offering to restore data from the cloud.
 */

export default function RestoreDialog() {
    const [show, setShow] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
    const [restoring, setRestoring] = useState(false);
    const [restored, setRestored] = useState(false);

    const restoreMutation = useRestoreFromCloud();
    const { data: historyData } = useSyncHistory();

    // Check on mount if cloud backup is available
    useEffect(() => {
        const hasBackup = sessionStorage.getItem('minime_has_cloud_backup');
        const dismissed = localStorage.getItem('minime_restore_dismissed');
        if (hasBackup === 'true' && !dismissed) {
            setLastSyncedAt(sessionStorage.getItem('minime_last_synced_at'));
            setShow(true);
        }
    }, []);

    // Track restore completion via sync history
    useEffect(() => {
        if (restoring && historyData?.history) {
            const restoreEntry = historyData.history.find(
                (e) => e.trigger === 'restore' && e.status !== 'running'
            );
            if (restoreEntry) {
                setRestoring(false);
                setRestored(true);
                setTimeout(() => {
                    handleDismiss();
                    window.location.reload(); // Reload to show restored data
                }, 2000);
            }
        }
    }, [historyData, restoring]);

    const handleRestore = () => {
        setRestoring(true);
        restoreMutation.mutate();
    };

    const handleDismiss = () => {
        setShow(false);
        // Clear the sessionStorage so it doesn't show again
        sessionStorage.removeItem('minime_has_cloud_backup');
        sessionStorage.removeItem('minime_last_synced_at');
        localStorage.setItem('minime_restore_dismissed', 'true');
    };

    if (!show) return null;

    const formattedDate = lastSyncedAt
        ? new Date(lastSyncedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })
        : 'recently';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '440px',
                    width: '90%',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    animation: 'fadeInScale 0.3s ease-out',
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        fontSize: '48px',
                        textAlign: 'center',
                        marginBottom: '16px',
                    }}
                >
                    ☁️
                </div>

                {/* Title */}
                <h2
                    style={{
                        color: '#ffffff',
                        fontSize: '20px',
                        fontWeight: 700,
                        textAlign: 'center',
                        margin: '0 0 8px 0',
                    }}
                >
                    Cloud Data Found
                </h2>

                {/* Description */}
                <p
                    style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '14px',
                        textAlign: 'center',
                        lineHeight: 1.5,
                        margin: '0 0 24px 0',
                    }}
                >
                    {restored
                        ? '✅ Your data has been restored successfully! Reloading...'
                        : restoring
                        ? '⏳ Restoring your data from the cloud...'
                        : `We found your synced data from ${formattedDate}. Would you like to restore it to this device?`}
                </p>

                {/* Progress bar when restoring */}
                {restoring && (
                    <div
                        style={{
                            height: '4px',
                            borderRadius: '2px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            marginBottom: '24px',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                borderRadius: '2px',
                                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                                animation: 'restoreProgress 2s ease-in-out infinite',
                                width: '60%',
                            }}
                        />
                    </div>
                )}

                {/* Buttons */}
                {!restoring && !restored && (
                    <div
                        style={{
                            display: 'flex',
                            gap: '12px',
                            justifyContent: 'center',
                        }}
                    >
                        <button
                            onClick={handleRestore}
                            id="restore-now-btn"
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'transform 0.15s, box-shadow 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                                (e.target as HTMLButtonElement).style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                                (e.target as HTMLButtonElement).style.boxShadow = 'none';
                            }}
                        >
                            Restore Now
                        </button>
                        <button
                            onClick={handleDismiss}
                            id="start-fresh-btn"
                            style={{
                                padding: '10px 24px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                background: 'transparent',
                                color: 'rgba(255, 255, 255, 0.7)',
                                fontWeight: 500,
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'border-color 0.15s, color 0.15s',
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.4)';
                                (e.target as HTMLButtonElement).style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                (e.target as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)';
                            }}
                        >
                            Start Fresh
                        </button>
                    </div>
                )}
            </div>

            {/* Keyframe animations */}
            <style>{`
                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                @keyframes restoreProgress {
                    0% { transform: translateX(-100%); }
                    50% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                }
            `}</style>
        </div>
    );
}
