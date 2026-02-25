# MiniMe Activity Sync Protocol v1.0

**Version**: 1.0  
**Last Updated**: 2026-02-03  
**Status**: Production Ready

---

## 📋 Overview

The MiniMe Activity Sync Protocol defines how clients (browser extensions, desktop apps, mobile apps, and server-side integrations) synchronize activity data with the backend API.

**Key Features**:
- ✅ Idempotent ingestion with client-generated IDs
- ✅ Offline-first with persistent local queues
- ✅ Automatic retry with exponential backoff
- ✅ Batch submission for efficiency
- ✅ Multi-source support (browser, desktop, mobile, integrations)

---

## 🎯 Design Principles

### 1. Idempotency First

Every activity MUST have a stable, deterministic `client_generated_id` to enable safe retries.

**Format**: `<source>:<session_id>:<timestamp>:<hash>`

**Examples**:
- Browser: `browser:12345:1706906400:a1b2c3d4`
- Desktop: `desktop:win_1234:1706906400:e5f6g7h8`
- Mobile: `mobile:session_abc:1706906400:i9j0k1l2`
- GitHub: `github:minime/backend:commit_sha123`

### 2. Offline-First Architecture

Clients MUST queue activities locally before attempting to send. Network failures should never result in data loss.

### 3. Efficient Batching

Clients SHOULD batch activities (up to 1000 per request) to minimize network overhead.

### 4. Privacy by Design

- IP addresses are hashed server-side
- Sensitive data never leaves client device
- User controls what gets synced

---

## 🔌 Client Architecture

```
┌─────────────────────────────────────────┐
│           CLIENT APPLICATION             │
├─────────────────────────────────────────┤
│  Activity Capture Layer                 │
│  ├─ Browser Tab Events                  │
│  ├─ Window Focus Events                 │
│  ├─ File System Events                  │
│  └─ Custom Integrations                 │
│                                          │
│  ↓                                       │
│                                          │
│  Activity Queue (Persistent Storage)    │
│  ├─ pending: []                         │
│  ├─ retrying: []                        │
│  └─ dead_letter: []                     │
│                                          │
│  ↓                                       │
│                                          │
│  Sync Engine                             │
│  ├─ Network Monitor                     │
│  ├─ Retry Logic (Exponential Backoff)  │
│  ├─ Batch Builder                       │
│  └─ API Client                          │
└─────────────────────────────────────────┘
         │
         ↓ HTTPS
   ┌─────────────────┐
   │  Backend API    │
   │ POST /v1/       │
   │ activities/     │
   │ batch           │
   └─────────────────┘
```

---

## 📊 Client-Side Queue Schema

### Queue Item Structure

```typescript
interface QueuedActivity {
  id: string;                    // Local UUID
  payload: ActivityIngestItem;   // The activity to sync
  retry_count: number;           // Number of retry attempts
  last_attempt_at: Date | null;  // Last sync attempt timestamp
  first_attempt_at: Date;        // When first queued
  status: QueueStatus;           // Current status
  error?: string;                // Last error message
}

enum QueueStatus {
  PENDING = 'pending',           // Ready to send
  RETRYING = 'retrying',         // Failed, will retry
  DEAD_LETTER = 'dead_letter',   // Max retries exceeded
  SYNCED = 'synced'              // Successfully synced (can be deleted)
}
```

### Storage Implementations

| Platform | Recommended Storage | Capacity |
|----------|---------------------|----------|
| Browser Extension | IndexedDB | ~50MB |
| Desktop App | SQLite | ~1GB |
| Mobile App | SQLite / Realm | ~500MB |
| Server Integration | PostgreSQL / Redis | Unlimited |

---

## 🔄 Sync Flow

### 1. Activity Capture

```typescript
// Example: Browser tab activated
async function onTabActivated(tab: Tab) {
  const activity = {
    client_generated_id: generateClientId('browser', tab.id),
    occurred_at: new Date().toISOString(),
    type: 'page_view',
    context: {
      url: tab.url,
      domain: new URL(tab.url).hostname,
      title: tab.title
    },
    duration_seconds: null  // Will be updated on tab close
  };
  
  await activityQueue.enqueue(activity);
}
```

### 2. Queue Management

```typescript
class ActivityQueue {
  // Add activity to persistent queue
  async enqueue(activity: ActivityIngestItem): Promise<void> {
    const queuedItem: QueuedActivity = {
      id: crypto.randomUUID(),
      payload: activity,
      retry_count: 0,
      last_attempt_at: null,
      first_attempt_at: new Date(),
      status: 'pending'
    };
    
    await this.storage.add(queuedItem);
    
    // Trigger immediate sync attempt if online
    if (this.isOnline()) {
      this.flush();
    }
  }
  
  // Get all pending items
  async getPending(): Promise<QueuedActivity[]> {
    return this.storage.getByStatus('pending');
  }
  
  // Get items that need retry
  async getRetrying(): Promise<QueuedActivity[]> {
    const items = await this.storage.getByStatus('retrying');
    
    // Filter by backoff delay
    return items.filter(item => {
      const backoffMs = this.calculateBackoff(item.retry_count);
      const nextAttemptAt = item.last_attempt_at.getTime() + backoffMs;
      return Date.now() >= nextAttemptAt;
    });
  }
}
```

### 3. Batch Building

```typescript
async function buildBatch(maxSize: number = 100): Promise<ActivityBatchRequest> {
  const pending = await queue.getPending();
  const retrying = await queue.getRetrying();
  
  // Combine and sort by occurred_at
  const items = [...pending, ...retrying]
    .sort((a, b) => 
      new Date(a.payload.occurred_at).getTime() - 
      new Date(b.payload.occurred_at).getTime()
    )
    .slice(0, maxSize);
  
  return {
    source: 'browser',
    source_version: EXTENSION_VERSION,
    activities: items.map(item => item.payload)
  };
}
```

### 4. Network Sync

```typescript
async function flush(): Promise<FlushResult> {
  if (!this.isOnline()) {
    return { success: false, reason: 'offline' };
  }
  
  const batch = await this.buildBatch(100);
  
  if (batch.activities.length === 0) {
    return { success: true, synced: 0 };
  }
  
  try {
    const response = await fetch('/v1/activities/batch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Client-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      body: JSON.stringify(batch)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result: ActivityBatchResponse = await response.json();
    
    // Update queue based on results
    await this.processResults(batch.activities, result);
    
    return {
      success: true,
      synced: result.ingested_count + result.duplicate_count
    };
    
  } catch (error) {
    // Network error - mark for retry
    await this.markForRetry(batch.activities, error.message);
    
    return {
      success: false,
      reason: error.message
    };
  }
}
```

### 5. Result Processing

```typescript
async function processResults(
  sentActivities: ActivityIngestItem[],
  response: ActivityBatchResponse
): Promise<void> {
  for (const result of response.results) {
    const queueItem = await this.findByClientId(result.client_generated_id);
    
    if (!queueItem) continue;
    
    switch (result.status) {
      case 'ingested':
      case 'duplicate':
        // Success - remove from queue
        await this.storage.delete(queueItem.id);
        break;
        
      case 'failed':
        // Server error - increment retry count
        queueItem.retry_count++;
        queueItem.last_attempt_at = new Date();
        queueItem.error = result.error;
        
        if (queueItem.retry_count >= MAX_RETRIES) {
          queueItem.status = 'dead_letter';
        } else {
          queueItem.status = 'retrying';
        }
        
        await this.storage.update(queueItem);
        break;
    }
  }
}
```

---

## ⏱️ Retry & Backoff Strategy

### Exponential Backoff

```typescript
function calculateBackoff(retryCount: number): number {
  const delays = [
    5 * 1000,      // 5 seconds
    30 * 1000,     // 30 seconds
    2 * 60 * 1000, // 2 minutes
    10 * 60 * 1000, // 10 minutes
    30 * 60 * 1000, // 30 minutes
    60 * 60 * 1000  // 1 hour
  ];
  
  const index = Math.min(retryCount, delays.length - 1);
  return delays[index];
}
```

### Retry Configuration

| Attempt | Delay | Cumulative Time |
|---------|-------|-----------------|
| 1 | 5 seconds | 5s |
| 2 | 30 seconds | 35s |
| 3 | 2 minutes | 2m 35s |
| 4 | 10 minutes | 12m 35s |
| 5 | 30 minutes | 42m 35s |
| 6+ | 1 hour | - |

**Max Retries**: 20 attempts  
**Total Time**: ~20 hours before dead-letter

### Dead Letter Handling

Activities that exceed max retries are moved to `dead_letter` queue:

```typescript
async function getDeadLetters(): Promise<QueuedActivity[]> {
  return this.storage.getByStatus('dead_letter');
}

async function retryDeadLetter(id: string): Promise<void> {
  const item = await this.storage.get(id);
  item.status = 'pending';
  item.retry_count = 0;
  item.last_attempt_at = null;
  await this.storage.update(item);
}
```

**User Actions**:
- View dead letters in settings
- Manual retry individual items
- Bulk retry all
- Delete permanently

---

## 🔧 Sync Triggers

### Automatic Triggers

1. **Network Reconnection**
```typescript
window.addEventListener('online', () => {
  activityQueue.flush();
});
```

2. **Periodic Timer**
```typescript
setInterval(() => {
  if (navigator.onLine) {
    activityQueue.flush();
  }
}, 60 * 1000); // Every 60 seconds
```

3. **App Launch**
```typescript
chrome.runtime.onStartup.addListener(() => {
  activityQueue.flush();
});
```

4. **Queue Threshold**
```typescript
async enqueue(activity: ActivityIngestItem) {
  await this.storage.add(activity);
  
  const pendingCount = await this.storage.countPending();
  
  if (pendingCount >= BATCH_THRESHOLD) {
    this.flush();  // Auto-flush at 100 items
  }
}
```

### Manual Triggers

- User clicks "Sync Now" button
- Settings page opened
- Extension popup opened

---

## 🌐 Multi-Source Support

### Source Types

| Source | Client ID Format | Description |
|--------|------------------|-------------|
| `browser` | `browser:<tab_id>:<ts>:<hash>` | Browser extensions |
| `desktop` | `desktop:<window_id>:<ts>:<hash>` | Desktop apps |
| `mobile` | `mobile:<session_id>:<ts>:<hash>` | Mobile apps |
| `integration` | `<service>:<resource>:<id>` | Server webhooks |

### Integration Examples

#### GitHub Webhook

```python
# Server-side integration
@app.post("/webhooks/github")
async def github_webhook(payload: dict):
    if payload['action'] == 'push':
        activities = []
        
        for commit in payload['commits']:
            activity = {
                "client_generated_id": f"github:{payload['repository']['full_name']}:{commit['id']}",
                "occurred_at": commit['timestamp'],
                "type": "commit",
                "context": {
                    "repo": payload['repository']['full_name'],
                    "branch": payload['ref'],
                    "commit_sha": commit['id'],
                    "message": commit['message'],
                    "author": commit['author']['name']
                }
            }
            activities.append(activity)
        
        # Send to batch API
        await ingest_batch({
            "source": "integration",
            "source_version": "github-webhook-1.0",
            "activities": activities
        })
```

#### Google Calendar

```typescript
// Desktop app integration
async function syncCalendarEvents() {
  const events = await googleCalendar.getEvents({
    timeMin: lastSyncTime,
    timeMax: new Date()
  });
  
  const activities = events.map(event => ({
    client_generated_id: `gcal:${event.id}`,
    occurred_at: event.start.dateTime,
    type: 'meeting',
    context: {
      meeting_id: event.id,
      title: event.summary,
      attendees: event.attendees?.map(a => a.email),
      duration_seconds: getEventDuration(event)
    }
  }));
  
  await activityQueue.enqueueBatch(activities);
}
```

---

## 🔒 Security & Privacy

### Authentication

All sync requests MUST include JWT token:

```
Authorization: Bearer <jwt_token>
```

### Data Minimization

Clients SHOULD:
- ✅ Only sync user-approved activity types
- ✅ Filter sensitive URLs (passwords, tokens in URL)
- ✅ Sanitize PII from titles/contexts
- ❌ Never sync: passwords, credit cards, health data

### Client-Side Filtering

```typescript
function shouldSync(activity: Activity): boolean {
  // Check user preferences
  if (!settings.syncEnabled) return false;
  if (!settings.syncTypes.includes(activity.type)) return false;
  
  // Filter sensitive domains
  const domain = activity.context.domain;
  if (SENSITIVE_DOMAINS.includes(domain)) return false;
  
  // Filter local files
  if (activity.context.url?.startsWith('file://')) return false;
  
  return true;
}
```

---

## 📊 Monitoring & Debugging

### Client-Side Metrics

```typescript
interface SyncMetrics {
  total_activities_captured: number;
  total_activities_synced: number;
  pending_count: number;
  retrying_count: number;
  dead_letter_count: number;
  last_sync_at: Date;
  last_sync_duration_ms: number;
  avg_batch_size: number;
}
```

### Debug Mode

```typescript
if (DEBUG_MODE) {
  console.log('[ActivityQueue] Enqueued:', activity);
  console.log('[ActivityQueue] Pending:', await queue.getPending());
  console.log('[ActivityQueue] Flushing batch of', batch.activities.length);
}
```

---

## 🧪 Testing Recommendations

### Unit Tests

- ✅ Client ID generation determinism
- ✅ Backoff calculation accuracy
- ✅ Batch building logic
- ✅ Queue state transitions

### Integration Tests

- ✅ End-to-end sync flow
- ✅ Network failure recovery
- ✅ Duplicate handling
- ✅ Dead letter management

### Manual Testing

1. **Offline Scenario**: Disable network, capture activities, re-enable, verify sync
2. **Retry Scenario**: Simulate server error (503), verify exponential backoff
3. **Large Batch**: Queue 10,000 activities, verify efficient batching

---

## 📚 Reference Implementation

Complete reference implementations available:

- **Browser Extension**: `/examples/browser-extension/activity-queue.ts`
- **Desktop App**: `/examples/desktop-app/sync-engine.py`
- **Mobile App**: `/examples/mobile-app/ActivitySyncManager.swift`

---

**Protocol Version**: 1.0  
**Compatibility**: Backend API v1.0+  
**Last Updated**: 2026-02-03  

For questions or implementation support, see [CONTRIBUTING.md](../CONTRIBUTING.md) or open an issue.
