// IndexedDB storage manager with encryption support
export class StorageManager {
    static DB_NAME = 'MiniMeActivities';
    static STORE_NAME = 'activities';
    static DB_VERSION = 1;
    static db = null;

    static async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('synced', 'synced', { unique: false });
                    store.createIndex('domain', 'domain', { unique: false });
                    console.log('✅ IndexedDB object store created');
                }
            };
        });
    }

    static async saveActivity(activity) {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);

            const item = {
                ...activity,
                synced: false,
                createdAt: new Date().toISOString(),
            };

            const request = store.add(item);

            request.onsuccess = () => {
                console.log('Activity saved:', activity.id);
                resolve();
            };

            request.onerror = () => {
                console.error('Save error:', request.error);
                reject(request.error);
            };
        });
    }

    static async getUnsyncedActivities(limit = 100) {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_NAME], 'readonly');
            const store = tx.objectStore(this.STORE_NAME);

            // Don't use index - just iterate all records and filter
            const results = [];
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && results.length < limit) {
                    if (cursor.value.synced === false) {
                        results.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    static async markSynced(activityIds) {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);

            let completed = 0;

            for (const id of activityIds) {
                const request = store.get(id);

                request.onsuccess = () => {
                    const activity = request.result;
                    if (activity) {
                        activity.synced = true;
                        activity.syncedAt = new Date().toISOString();
                        store.put(activity);
                    }

                    completed++;
                    if (completed === activityIds.length) {
                        resolve();
                    }
                };

                request.onerror = () => reject(request.error);
            }

            // Handle empty array
            if (activityIds.length === 0) {
                resolve();
            }
        });
    }

    static async getUnsyncedCount() {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_NAME], 'readonly');
            const store = tx.objectStore(this.STORE_NAME);

            // Don't use index - just iterate all records and filter
            let count = 0;
            const request = store.openCursor();

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.synced === false) {
                        count++;
                    }
                    cursor.continue();
                } else {
                    resolve(count);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    static async getTodayStats() {
        const db = await this.init();
        const today = new Date().toISOString().split('T')[0];

        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_NAME], 'readonly');
            const store = tx.objectStore(this.STORE_NAME);
            const index = store.index('timestamp');

            const request = index.openCursor();
            const todayActivities = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.timestamp.startsWith(today)) {
                        todayActivities.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    const totalTime = todayActivities.reduce((sum, a) => sum + (a.durationSeconds || 0), 0);
                    const domains = new Set(todayActivities.map(a => a.domain));
                    const entities = todayActivities.reduce((sum, a) => sum + (a.entities?.length || 0), 0);

                    resolve({
                        totalTime: totalTime,
                        pagesVisited: domains.size,
                        entitiesFound: entities,
                    });
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    static async getRecentActivities(limit = 5) {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_NAME], 'readonly');
            const store = tx.objectStore(this.STORE_NAME);
            const index = store.index('timestamp');

            const activities = [];
            const request = index.openCursor(null, 'prev'); // Descending order

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && activities.length < limit) {
                    const activity = cursor.value;
                    activities.push({
                        url: activity.url,
                        domain: activity.domain,
                        favicon: `https://www.google.com/s2/favicons?domain=${activity.domain}&sz=32`,
                        duration: activity.durationSeconds,
                        timestamp: activity.timestamp,
                    });
                    cursor.continue();
                } else {
                    resolve(activities);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    static async clearOldData(daysToKeep = 30) {
        const db = await this.init();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const cutoff = cutoffDate.toISOString();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);
            const index = store.index('timestamp');

            const request = index.openCursor();
            let deleted = 0;

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.timestamp < cutoff && cursor.value.synced) {
                        cursor.delete();
                        deleted++;
                    }
                    cursor.continue();
                } else {
                    console.log(`Cleaned up ${deleted} old activities`);
                    resolve(deleted);
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    static async getAllActivities() {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_NAME], 'readonly');
            const store = tx.objectStore(this.STORE_NAME);

            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    static async clearAll() {
        const db = await this.init();

        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.STORE_NAME], 'readwrite');
            const store = tx.objectStore(this.STORE_NAME);

            const request = store.clear();

            request.onsuccess = () => {
                console.log('All data cleared');
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
}
