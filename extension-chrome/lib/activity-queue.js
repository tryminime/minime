/**
 * Activity Queue Implementation for Browser Extension
 * 
 * Implements offline-first activity capture and synchronization
 * following the MiniMe Sync Protocol v1.0
 * 
 * Features:
 * - Persistent IndexedDB storage
 * - Automatic retry with exponential backoff
 * - Idempotent ingestion via client_generated_id
 * - Dead letter queue for failed items
 * - Real-time metrics tracking
 * 
 * See: docs/SYNC_PROTOCOL.md, docs/CLIENT_QUEUE_SPEC.md
 */

import { IndexedDBStorage } from './queue-storage.js';

/**
 * Queue item status enum
 */
export const QueueStatus = {
    PENDING: 'pending',
    SENDING: 'sending',
    RETRYING: 'retrying',
    DEAD_LETTER: 'dead_letter',
    SYNCED: 'synced'
};

/**
 * Activity Queue Manager
 */
export class ActivityQueue {
    constructor(config = {}) {
        this.config = {
            batchSize: config.batchSize || 100,
            maxRetries: config.maxRetries || 20,
            flushInterval: config.flushInterval || 60000, // 1 minute
            apiBaseUrl: config.apiBaseUrl || 'http://localhost:8000',
            source: config.source || 'browser',
            sourceVersion: config.sourceVersion || '1.0.0',
            debug: config.debug || false,
            ...config
        };

        this.storage = null;
        this.flushTimer = null;
        this.isRunning = false;

        // Metrics
        this.metrics = {
            total_captured: 0,
            total_synced: 0,
            total_failed: 0,
            last_sync_at: null,
            last_sync_duration_ms: 0
        };
    }

    /**
     * Initialize the queue
     */
    async start() {
        if (this.isRunning) {
            this.log('Queue already running');
            return;
        }

        this.log('Starting activity queue...');

        // Initialize storage
        this.storage = new IndexedDBStorage();
        await this.storage.init();

        // Load metrics
        await this.loadMetrics();

        // Start periodic flush
        this.flushTimer = setInterval(
            () => this.flush(),
            this.config.flushInterval
        );

        // Listen for network changes
        window.addEventListener('online', () => this.onNetworkOnline());

        this.isRunning = true;
        this.log('Queue started');

        // Initial flush
        await this.flush();
    }

    /**
     * Stop the queue
     */
    async stop() {
        if (!this.isRunning) return;

        this.log('Stopping activity queue...');

        // Clear timer
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }

        // Save metrics
        await this.saveMetrics();

        // Close storage
        if (this.storage) {
            this.storage.close();
            this.storage = null;
        }

        this.isRunning = false;
        this.log('Queue stopped');
    }

    /**
     * Enqueue a single activity
     */
    async enqueue(activity) {
        if (!this.storage) {
            throw new Error('Queue not started');
        }

        // Generate client_generated_id if not provided
        if (!activity.client_generated_id) {
            activity.client_generated_id = this.generateClientId();
        }

        // Create queue item
        const queueItem = {
            id: crypto.randomUUID(),
            client_generated_id: activity.client_generated_id,
            payload: activity,
            status: QueueStatus.PENDING,
            retry_count: 0,
            max_retries: this.config.maxRetries,
            first_attempt_at: new Date().toISOString(),
            last_attempt_at: null,
            synced_at: null,
            error_count: 0
        };

        try {
            await this.storage.add(queueItem);
            this.metrics.total_captured++;

            this.log('Activity enqueued:', queueItem.client_generated_id);

            // Trigger immediate flush if online and threshold reached
            const pendingCount = await this.storage.countByStatus(QueueStatus.PENDING);
            if (navigator.onLine && pendingCount >= this.config.batchSize) {
                this.log(`Batch threshold reached (${pendingCount}), triggering flush`);
                this.flush();
            }
        } catch (error) {
            console.error('Failed to enqueue activity:', error);
            throw error;
        }
    }

    /**
     * Enqueue multiple activities
     */
    async enqueueBatch(activities) {
        const promises = activities.map(activity => this.enqueue(activity));
        await Promise.all(promises);
    }

    /**
     * Flush pending and retry-ready activities to backend
     */
    async flush(force = false) {
        if (!this.storage) {
            this.log('Cannot flush: queue not started');
            return { success: false, reason: 'not_started', synced: 0 };
        }

        // Check network connectivity
        if (!navigator.onLine && !force) {
            this.log('Cannot flush: offline');
            return { success: false, reason: 'offline', synced: 0 };
        }

        this.log('Flushing queue...');
        const startTime = Date.now();

        try {
            // Get activities ready to sync
            const pending = await this.storage.getByStatus(QueueStatus.PENDING);
            const retrying = await this.getRetryingReady();

            const toSync = [...pending, ...retrying]
                .sort((a, b) =>
                    new Date(a.payload.occurred_at) - new Date(b.payload.occurred_at)
                )
                .slice(0, this.config.batchSize);

            if (toSync.length === 0) {
                this.log('No activities to sync');
                return { success: true, synced: 0, skipped: 0 };
            }

            this.log(`Syncing ${toSync.length} activities...`);

            // Mark as sending
            await Promise.all(
                toSync.map(item =>
                    this.storage.update({ ...item, status: QueueStatus.SENDING })
                )
            );

            // Build batch request
            const batch = {
                source: this.config.source,
                source_version: this.config.sourceVersion,
                activities: toSync.map(item => item.payload)
            };

            // Get auth token
            const token = await this.getAuthToken();
            if (!token) {
                this.log('No auth token available');
                // Revert to pending
                await Promise.all(
                    toSync.map(item =>
                        this.storage.update({ ...item, status: QueueStatus.PENDING })
                    )
                );
                return { success: false, reason: 'no_auth', synced: 0 };
            }

            // Send to backend
            const response = await fetch(`${this.config.apiBaseUrl}/v1/activities/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Client-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
                },
                body: JSON.stringify(batch)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            // Process results
            let synced = 0;
            let failed = 0;

            for (const resultItem of result.results) {
                const queueItem = toSync.find(
                    x => x.client_generated_id === resultItem.client_generated_id
                );

                if (!queueItem) continue;

                if (resultItem.status === 'ingested' || resultItem.status === 'duplicate') {
                    // Success - mark as synced
                    await this.storage.update({
                        ...queueItem,
                        status: QueueStatus.SYNCED,
                        synced_at: new Date().toISOString()
                    });
                    synced++;
                } else {
                    // Failed - increment retry
                    await this.handleFailedItem(queueItem, resultItem.error);
                    failed++;
                }
            }

            // Update metrics
            this.metrics.total_synced += synced;
            this.metrics.total_failed += failed;
            this.metrics.last_sync_at = new Date().toISOString();
            this.metrics.last_sync_duration_ms = Date.now() - startTime;

            await this.saveMetrics();

            this.log(`✅ Flush complete: ${synced} synced, ${failed} failed (${Date.now() - startTime}ms)`);

            return {
                success: true,
                synced,
                failed,
                processing_time_ms: result.processing_time_ms
            };

        } catch (error) {
            console.error('Flush error:', error);

            // Mark all sending items for retry
            const sending = await this.storage.getByStatus(QueueStatus.SENDING);
            await Promise.all(
                sending.map(item => this.handleFailedItem(item, error.message))
            );

            return {
                success: false,
                reason: error.message,
                synced: 0
            };
        }
    }

    /**
     * Get retrying items that are ready for retry (based on backoff)
     */
    async getRetryingReady() {
        const retrying = await this.storage.getByStatus(QueueStatus.RETRYING);

        return retrying.filter(item => {
            if (!item.last_attempt_at) return true;

            const backoffMs = this.calculateBackoff(item.retry_count);
            const nextAttemptAt = new Date(item.last_attempt_at).getTime() + backoffMs;

            return Date.now() >= nextAttemptAt;
        });
    }

    /**
     * Calculate exponential backoff delay
     */
    calculateBackoff(retryCount) {
        const delays = [
            5 * 1000,       // 5 seconds
            30 * 1000,      // 30 seconds
            2 * 60 * 1000,  // 2 minutes
            10 * 60 * 1000, // 10 minutes
            30 * 60 * 1000, // 30 minutes
            60 * 60 * 1000  // 1 hour
        ];

        const index = Math.min(retryCount, delays.length - 1);
        return delays[index];
    }

    /**
     * Handle failed item (increment retry or move to dead letter)
     */
    async handleFailedItem(item, errorMessage) {
        item.retry_count++;
        item.last_attempt_at = new Date().toISOString();
        item.last_error = errorMessage;
        item.error_count++;

        if (item.retry_count >= item.max_retries) {
            item.status = QueueStatus.DEAD_LETTER;
            this.log(`Item moved to dead letter: ${item.client_generated_id}`);
        } else {
            item.status = QueueStatus.RETRYING;
            const backoffMs = this.calculateBackoff(item.retry_count);
            this.log(`Item will retry in ${backoffMs / 1000}s: ${item.client_generated_id}`);
        }

        await this.storage.update(item);
    }

    /**
     * Generate client-generated ID
     */
    generateClientId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 10);
        return `${this.config.source}:${timestamp}:${random}`;
    }

    /**
     * Get auth token from extension storage
     */
    async getAuthToken() {
        try {
            const result = await chrome.storage.local.get('authToken');
            return result.authToken;
        } catch (error) {
            console.error('Failed to get auth token:', error);
            return null;
        }
    }

    /**
     * Network came back online
     */
    async onNetworkOnline() {
        this.log('Network online - triggering flush');
        await this.flush();
    }

    /**
     * Get queue metrics
     */
    async getMetrics() {
        const pending_count = await this.storage.countByStatus(QueueStatus.PENDING);
        const retrying_count = await this.storage.countByStatus(QueueStatus.RETRYING);
        const dead_letter_count = await this.storage.countByStatus(QueueStatus.DEAD_LETTER);
        const synced_count = await this.storage.countByStatus(QueueStatus.SYNCED);

        return {
            ...this.metrics,
            pending_count,
            retrying_count,
            dead_letter_count,
            synced_count,
            sync_success_rate: this.metrics.total_synced / (this.metrics.total_synced + this.metrics.total_failed) || 0
        };
    }

    /**
     * Get pending activities
     */
    async getPending() {
        return this.storage.getByStatus(QueueStatus.PENDING);
    }

    /**
     * Get retrying activities
     */
    async getRetrying() {
        return this.storage.getByStatus(QueueStatus.RETRYING);
    }

    /**
     * Get dead letter activities
     */
    async getDeadLetters() {
        return this.storage.getByStatus(QueueStatus.DEAD_LETTER);
    }

    /**
     * Retry all failed activities
     */
    async retryFailed() {
        const failed = await this.getDeadLetters();
        const retrying = await this.getRetrying();

        let count = 0;

        for (const item of [...failed, ...retrying]) {
            item.status = QueueStatus.PENDING;
            item.retry_count = 0;
            item.last_attempt_at = null;
            item.last_error = null;
            await this.storage.update(item);
            count++;
        }

        this.log(`Retrying ${count} failed items`);
        return count;
    }

    /**
     * Retry a specific dead letter item
     */
    async retryDeadLetter(id) {
        const item = await this.storage.get(id);
        if (!item) {
            throw new Error(`Item not found: ${id}`);
        }

        item.status = QueueStatus.PENDING;
        item.retry_count = 0;
        item.last_attempt_at = null;
        item.last_error = null;

        await this.storage.update(item);
        this.log(`Retrying dead letter item: ${id}`);
    }

    /**
     * Clear all dead letters
     */
    async clearDeadLetters() {
        const deadLetters = await this.getDeadLetters();

        for (const item of deadLetters) {
            await this.storage.delete(item.id);
        }

        this.log(`Cleared ${deadLetters.length} dead letter items`);
        return deadLetters.length;
    }

    /**
     * Prune old synced activities
     */
    async pruneSynced(olderThan) {
        const synced = await this.storage.getByStatus(QueueStatus.SYNCED);
        let pruned = 0;

        for (const item of synced) {
            if (new Date(item.synced_at) < olderThan) {
                await this.storage.delete(item.id);
                pruned++;
            }
        }

        this.log(`Pruned ${pruned} old synced items`);
        return pruned;
    }

    /**
     * Load metrics from storage
     */
    async loadMetrics() {
        const stored = await this.storage.getMetric('queue_metrics');
        if (stored) {
            Object.assign(this.metrics, stored);
        }
    }

    /**
     * Save metrics to storage
     */
    async saveMetrics() {
        await this.storage.setMetric('queue_metrics', this.metrics);
    }

    /**
     * Debug logging
     */
    log(...args) {
        if (this.config.debug) {
            console.log('[ActivityQueue]', ...args);
        }
    }
}
