# MiniMe Client-Side Activity Queue Specification

**Version**: 1.0  
**Last Updated**: 2026-02-03  
**Target Platforms**: Browser Extension, Desktop App, Mobile App

---

## 📋 Overview

This document specifies the client-side activity queue implementation for MiniMe clients. The queue ensures reliable activity capture and synchronization even when the network is unavailable.

---

## 🎯 Requirements

### Functional Requirements

1. **Persistent Storage**: Activities must survive app restarts
2. **FIFO Ordering**: Activities synced in order captured
3. **Idempotency**: Safe to retry without duplicates
4. **Backpressure**: Handle burst activity capture
5. **Observability**: Expose queue metrics

### Non-Functional Requirements

1. **Performance**: <10ms to enqueue an activity
2. **Storage**: Support 10,000+ queued activities
3. **Memory**: <50MB RAM usage
4. **Battery**: Minimal impact on mobile battery

---

## 📊 Data Structures

### Queue Item Schema

```typescript
interface QueuedActivity {
  // Identifiers
  id: string;                      // Local UUID
  client_generated_id: string;     // Idempotency key
  
  // Payload
  payload: ActivityIngestItem;
  
  // State management  
  status: QueueStatus;
  retry_count: number;
  max_retries: number;             // Default: 20
  
  // Timestamps
  first_attempt_at: Date;
  last_attempt_at: Date | null;
  synced_at: Date | null;
  
  // Error tracking
  last_error?: string;
  error_count: number;
}

enum QueueStatus {
  PENDING = 'pending',             // Ready to send
  SENDING = 'sending',             // Currently being sent
  RETRYING = 'retrying',           // Failed, will retry
  DEAD_LETTER = 'dead_letter',     // Max retries exceeded
  SYNCED = 'synced'                // Successfully synced
}
```

### Queue Metrics

```typescript
interface QueueMetrics {
  total_captured: number;
  total_synced: number;
  pending_count: number;
  retrying_count: number;
  dead_letter_count: number;
  last_sync_at: Date | null;
  last_sync_duration_ms: number;
  avg_batch_size: number;
  sync_success_rate: number;      // 0-1
}
```

---

## 🔧 Core API

### ActivityQueue Class

```typescript
class ActivityQueue {
  constructor(config: QueueConfig);
  
  // Enqueue operations
  async enqueue(activity: ActivityIngestItem): Promise<void>;
  async enqueueBatch(activities: ActivityIngestItem[]): Promise<void>;
  
  // Sync operations
  async flush(force?: boolean): Promise<FlushResult>;
  async retryFailed(): Promise<number>;
  
  // State queries
  async getPending(): Promise<QueuedActivity[]>;
  async getRetrying(): Promise<QueuedActivity[]>;
  async getDeadLetters(): Promise<QueuedActivity[]>;
  async getMetrics(): Promise<QueueMetrics>;
  
  // Maintenance
  async pruneSynced(olderThan: Date): Promise<number>;
  async clearDeadLetters(): Promise<number>;
  async retryDeadLetter(id: string): Promise<void>;
  
  // Lifecycle
  async start(): Promise<void>;
  async stop(): Promise<void>;
}

interface QueueConfig {
  storage: StorageAdapter;
  batchSize: number;              // Default: 100
  maxRetries: number;             // Default: 20
  flushInterval: number;          // Default: 60000 (1 min)
  apiClient: APIClient;
}
```

---

## 💾 Storage Adapters

### Browser Extension (IndexedDB)

```typescript
class IndexedDBStorage implements StorageAdapter {
  private db: IDBDatabase;
  
  async init(): Promise<void> {
    const request = indexedDB.open('MiniMeQueue', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Queued activities store
      const store = db.createObjectStore('activities', {
        keyPath: 'id'
      });
      
      store.createIndex('status', 'status');
      store.createIndex('client_generated_id', 'client_generated_id', {unique: true});
      store.create Index('first_attempt_at', 'first_attempt_at');
    };
    
    this.db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  
  async add(item: QueuedActivity): Promise<void> {
    const tx = this.db.transaction(['activities'], 'readwrite');
    const store = tx.objectStore('activities');
    await store.add(item);
  }
  
  async getByStatus(status: QueueStatus): Promise<QueuedActivity[]> {
    const tx = this.db.transaction(['activities'], 'readonly');
    const store = tx.objectStore('activities');
    const index = store.index('status');
    
    return await index.getAll(status);
  }
  
  async update(item: QueuedActivity): Promise<void> {
    const tx = this.db.transaction(['activities'], 'readwrite');
    const store = tx.objectStore('activities');
    await store.put(item);
  }
  
  async delete(id: string): Promise<void> {
    const tx = this.db.transaction(['activities'], 'readwrite');
    const store = tx.objectStore('activities');
    await store.delete(id);
  }
}
```

### Desktop App (SQLite)

```python
import sqlite3
import json
from datetime import datetime
from typing import List, Optional

class SQLiteStorage:
    def __init__(self, db_path: str):
        self.conn = sqlite3.connect(db_path)
        self.init_schema()
    
    def init_schema(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS queued_activities (
                id TEXT PRIMARY KEY,
                client_generated_id TEXT UNIQUE NOT NULL,
                payload TEXT NOT NULL,
                status TEXT NOT NULL,
                retry_count INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 20,
                first_attempt_at TEXT NOT NULL,
                last_attempt_at TEXT,
                synced_at TEXT,
                last_error TEXT,
                error_count INTEGER DEFAULT 0
            )
        """)
        
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_status 
            ON queued_activities(status)
        """)
    
    def add(self, item: dict):
        self.conn.execute("""
            INSERT INTO queued_activities VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        """, (
            item['id'],
            item['client_generated_id'],
            json.dumps(item['payload']),
            item['status'],
            item['retry_count'],
            item['max_retries'],
            item['first_attempt_at'],
            item.get('last_attempt_at'),
            item.get('synced_at'),
            item.get('last_error'),
            item['error_count']
        ))
        self.conn.commit()
    
    def get_by_status(self, status: str) -> List[dict]:
        cursor = self.conn.execute(
            "SELECT * FROM queued_activities WHERE status = ?",
            (status,)
        )
        
        rows = cursor.fetchall()
        return [self._row_to_dict(row) for row in rows]
```

---

## 🔄 Sync Logic

### Flush Algorithm

```typescript
async function flush(): Promise<FlushResult> {
  // 1. Check network connectivity
  if (!navigator.onLine) {
    return { success: false, reason: 'offline', synced: 0 };
  }
  
  // 2. Get activities ready to sync
  const pending = await queue.getPending();
  const retrying = await queue.getRetryingReady();
  
  const toSync = [...pending, ...retrying]
    .sort((a, b) => 
      a.payload.occurred_at.getTime() - b.payload.occurred_at.getTime()
    )
    .slice(0, config.batchSize);
  
  if (toSync.length === 0) {
    return { success: true, synced: 0 };
  }
  
  // 3. Mark as sending
  await Promise.all(
    toSync.map(item => 
      storage.update({ ...item, status: 'sending' })
    )
  );
  
  // 4. Build batch request
  const batch: ActivityBatchRequest = {
    source: config.source,
    source_version: config.sourceVersion,
    activities: toSync.map(item => item.payload)
  };
  
  try {
    // 5. Send to backend
    const response = await apiClient.post('/v1/activities/batch', batch);
    
    // 6. Process results
    let synced = 0;
    
    for (const result of response.results) {
      const item = toSync.find(
        x => x.client_generated_id === result.client_generated_id
      );
      
      if (!item) continue;
      
      if (result.status === 'ingested' || result.status === 'duplicate') {
        // Success - mark as synced
        await storage.update({
          ...item,
          status: 'synced',
          synced_at: new Date()
        });
        synced++;
        
      } else {
        // Failed - retry
        item.retry_count++;
        item.last_attempt_at = new Date();
        item.last_error = result.error;
        item.error_count++;
        
        if (item.retry_count >= item.max_retries) {
          item.status = 'dead_letter';
        } else {
          item.status = 'retrying';
        }
        
        await storage.update(item);
      }
    }
    
    return {
      success: true,
      synced,
      failed: toSync.length - synced
    };
    
  } catch (error) {
    // 7. Network error - mark all for retry
    for (const item of toSync) {
      item.retry_count++;
      item.last_attempt_at = new Date();
      item.last_error = error.message;
      item.status = 'retrying';
      
      await storage.update(item);
    }
    
    return {
      success: false,
      reason: error.message,
      synced: 0
    };
  }
}
```

### Retry Backoff

```typescript
function shouldRetry(item: QueuedActivity): boolean {
  if (item.status !== 'retrying') return false;
  if(!item.last_attempt_at) return true;
  
  const backoffMs = calculateBackoff(item.retry_count);
  const nextAttemptAt = item.last_attempt_at.getTime() + backoffMs;
  
  return Date.now() >= nextAttemptAt;
}

function calculateBackoff(retryCount: number): number {
  const delays = [
    5 * 1000,       // 5s
    30 * 1000,      // 30s
    2 * 60 * 1000,  // 2m
    10 * 60 * 1000, // 10m
    30 * 60 * 1000, // 30m
    60 * 60 * 1000  // 1h
  ];
  
  return delays[Math.min(retryCount, delays.length - 1)];
}
```

---

## 🛠️ Lifecycle Management

### Automatic Flushing

```typescript
class ActivityQueue {
  private flushTimer: NodeJS.Timeout | null = null;
  
  async start() {
    // Initial flush on startup
    await this.flush();
    
    // Set up periodic flushing
    this.flushTimer = setInterval(
      () => this.flush(),
      this.config.flushInterval
    );
    
    // Listen for network events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flush());
    }
  }
  
  async stop() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
```

### Maintenance Tasks

```typescript
// Run daily background task
async function runMaintenance() {
  // 1. Delete old synced activities (7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await queue.pruneSynced(sevenDaysAgo);
  
  // 2. Retry dead letters with user approval
  if (userSettings.autoRetryDeadLetters) {
    await queue.retryFailed();
  }
  
  // 3. Log metrics
  const metrics = await queue.getMetrics();
  console.log('Queue metrics:', metrics);
}
```

---

## 📱 Platform-Specific Notes

### Browser Extension

- **Storage Limit**: ~50MB (check `navigator.storage.estimate()`)
- **Background**: Use service worker `setInterval` for Chrome
- **Lifecycle**: Flush on extension update/uninstall

### Desktop App

- **Storage**: SQLite file in user data directory
- **Background**: Run sync service in main process
- **Lifecycle**: Flush on app quit

### Mobile App

- **Storage**: Realm or SQLite
- **Background**: iOS Background Fetch, Android WorkManager
- **Lifecycle**: Flush before app backgrounding

---

## ✅ Reference Implementation

Complete reference implementations:

- **Browser**: `/examples/browser-extension/ActivityQueue.ts`
- **Desktop**: `/examples/desktop-app/activity_queue.py`
- **Mobile**: `/examples/mobile-app/ActivityQueue.swift`

---

**Specification Version**: 1.0  
**Status**: Production Ready  
**Last Updated**: 2026-02-03
