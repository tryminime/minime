/**
 * IndexedDB Storage Adapter for Activity Queue
 * Implements persistent storage for offline-first activity capture
 * 
 * Based on: MiniMe Sync Protocol v1.0
 * See: docs/CLIENT_QUEUE_SPEC.md
 */

export class IndexedDBStorage {
    constructor(dbName = 'MiniMeQueue', version = 1) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    /**
     * Initialize IndexedDB database and schema
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create queued activities object store
                if (!db.objectStoreNames.contains('activities')) {
                    const store = db.createObjectStore('activities', {
                        keyPath: 'id'
                    });

                    // Indexes for efficient queries
                    store.createIndex('status', 'status', { unique: false });
                    store.createIndex('client_generated_id', 'client_generated_id', { unique: true });
                    store.createIndex('first_attempt_at', 'first_attempt_at', { unique: false });
                    store.createIndex('last_attempt_at', 'last_attempt_at', { unique: false });
                    store.createIndex('retry_count', 'retry_count', { unique: false });
                }

                // Create metrics object store
                if (!db.objectStoreNames.contains('metrics')) {
                    db.createObjectStore('metrics', { keyPath: 'key' });
                }
            };
        });
    }

    /**
     * Add a new activity to the queue
     */
    async add(item) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['activities'], 'readwrite');
            const store = tx.objectStore('activities');
            const request = store.add(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Update an existing activity
     */
    async update(item) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['activities'], 'readwrite');
            const store = tx.objectStore('activities');
            const request = store.put(item);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete an activity by ID
     */
    async delete(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['activities'], 'readwrite');
            const store = tx.objectStore('activities');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get an activity by ID
     */
    async get(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['activities'], 'readonly');
            const store = tx.objectStore('activities');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get activities by status
     */
    async getByStatus(status) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['activities'], 'readonly');
            const store = tx.objectStore('activities');
            const index = store.index('status');
            const request = index.getAll(status);

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Find activity by client_generated_id
     */
    async findByClientId(clientId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['activities'], 'readonly');
            const store = tx.objectStore('activities');
            const index = store.index('client_generated_id');
            const request = index.get(clientId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Count activities by status
     */
    async countByStatus(status) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['activities'], 'readonly');
            const store = tx.objectStore('activities');
            const index = store.index('status');
            const request = index.count(status);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all activities (for debugging)
     */
    async getAll() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['activities'], 'readonly');
            const store = tx.objectStore('activities');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete activities older than specified date
     */
    async deleteOlderThan(date) {
        const all = await this.getAll();
        let deleted = 0;

        for (const item of all) {
            if (new Date(item.first_attempt_at) < date) {
                await this.delete(item.id);
                deleted++;
            }
        }

        return deleted;
    }

    /**
     * Store metrics
     */
    async setMetric(key, value) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['metrics'], 'readwrite');
            const store = tx.objectStore('metrics');
            const request = store.put({ key, value, updated_at: new Date().toISOString() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get metric value
     */
    async getMetric(key) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['metrics'], 'readonly');
            const store = tx.objectStore('metrics');
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Close database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
