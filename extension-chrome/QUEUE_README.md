# Browser Extension Activity Queue - Reference Implementation

**Status**: ✅ Production Ready  
**Version**: 1.0  
**Last Updated**: 2026-02-03

---

## 📋 Overview

This is the **complete reference implementation** of the MiniMe Activity Queue for browser extensions, following the [Sync Protocol v1.0](../../docs/SYNC_PROTOCOL.md) specification.

---

## 📁 Files

### Core Implementation

1. **`lib/queue-storage.js`**
   - IndexedDB storage adapter
   - CRUD operations for queue items
   - Metrics storage
   - **Lines**: ~200

2. **`lib/activity-queue.js`**
   - Main ActivityQueue class
   - Enqueue, flush, retry logic
   - Exponential backoff
   - Dead letter handling
   - **Lines**: ~450

3. **`examples/queue-integration-example.js`**
   - Complete integration with Chrome Extension APIs
   - Tab/window event capture
   - Badge updates
   - Manual sync handlers
   - **Lines**: ~250

---

##🚀 Quick Start

### 1. Add to manifest.json

```json
{
  "manifest_version": 3,
  "name": "MiniMe Activity Tracker",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "tabs",
    "activeTab"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  }
}
```

### 2. Initialize Queue in background.js

```javascript
import { ActivityQueue } from './lib/activity-queue.js';

let queue;

chrome.runtime.onInstalled.addListener(async () => {
    queue = new ActivityQueue({
        apiBaseUrl: 'http://localhost:8000',
        source: 'browser',
        sourceVersion: '1.0.0',
        debug: true
    });
    
    await queue.start();
    console.log('✅ Queue initialized');
});
```

### 3. Capture Activities

```javascript
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    await queue.enqueue({
        client_generated_id: `browser:${tab.id}:${Date.now()}:${hash()}`,
        occurred_at: new Date().toISOString(),
        type: 'page_view',
        context: {
            url: tab.url,
            domain: new URL(tab.url).hostname,
            title: tab.title
        }
    });
});
```

---

## 🔧 API Reference

### ActivityQueue Class

#### Constructor

```javascript
const queue = new ActivityQueue({
    batchSize: 100,           // Max items per batch
    maxRetries: 20,           // Max retry attempts
    flushInterval: 60000,     // Auto-flush interval (ms)
    apiBaseUrl: string,       // Backend API URL
    source: 'browser',        // Source identifier
    sourceVersion: string,    // Version string
    debug: boolean            // Enable logging
});
```

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `start()` | Initialize queue and start auto-flush | `Promise<void>` |
| `stop()` | Stop queue and save state | `Promise<void>` |
| `enqueue(activity)` | Add activity to queue | `Promise<void>` |
| `enqueueBatch(activities[])` | Add multiple activities | `Promise<void>` |
| `flush(force?)` | Sync activities to backend | `Promise<FlushResult>` |
| `getMetrics()` | Get queue metrics | `Promise<Metrics>` |
| `getPending()` | Get pending activities | `Promise<Activity[]>` |
| `getRetrying()` | Get retrying activities | `Promise<Activity[]>` |
| `getDeadLetters()` | Get dead letter activities | `Promise<Activity[]>` |
| `retryFailed()` | Retry all failed items | `Promise<number>` |
| `retryDeadLetter(id)` | Retry specific dead letter | `Promise<void>` |
| `clearDeadLetters()` | Delete all dead letters | `Promise<number>` |
| `pruneSynced(date)` | Delete old synced items | `Promise<number>` |

---

## 📊 Queue States

```
┌─────────┐
│ PENDING │ ──(flush)──> [Backend API]
└─────────┘                    │
     ▲                         │
     │                    ┌────▼────┐
     │                    │ SUCCESS │
     │                    └─────────┘
     │                         │
     │                    ┌────▼────┐
     │                    │ SYNCED  │
     │                    └─────────┘
     │
     │
┌────┴─────┐
│ RETRYING │ ◄──(backoff)── [Network Error]
└──────────┘
     │
     │ (max retries exceeded)
     ▼
┌─────────────┐
│ DEAD_LETTER │
└─────────────┘
```

---

## ⏱️ Retry Backoff Schedule

| Attempt | Delay | Cumulative |
|---------|-------|------------|
| 1 | 5s | 5s |
| 2 | 30s | 35s |
| 3 | 2min | 2m35s |
| 4 | 10min | 12m35s |
| 5 | 30min | 42m35s |
| 6+ | 1h | - |

After **20 attempts** (~20 hours), item moves to DEAD_LETTER.

---

## 🧪 Testing

### Unit Tests (with Jest)

```javascript
import { ActivityQueue } from './lib/activity-queue.js';

describe('ActivityQueue', () => {
    let queue;
    
    beforeEach(async () => {
        queue = new ActivityQueue({ debug: false });
        await queue.start();
    });
    
    afterEach(async () => {
        await queue.stop();
    });
    
    test('enqueue activity', async () => {
        await queue.enqueue({
            occurred_at: new Date().toISOString(),
            type: 'page_view',
            context: { domain: 'github.com' }
        });
        
        const pending = await queue.getPending();
        expect(pending.length).toBe(1);
    });
    
    test('calculate backoff', () => {
        expect(queue.calculateBackoff(0)).toBe(5000);      // 5s
        expect(queue.calculateBackoff(2)).toBe(120000);    // 2min
        expect(queue.calculateBackoff(100)).toBe(3600000); // 1h (max)
    });
});
```

### Integration Test (Manual)

1. **Offline Test**
   ```javascript
   // 1. Disconnect network
   // 2. Capture 10 activities
   await queue.enqueue(activity);
   
   // 3. Check pending
   const metrics = await queue.getMetrics();
   console.log(metrics.pending_count); // Should be 10
   
   // 4. Reconnect network
   // 5. Wait for auto-flush or manual flush
   await queue.flush();
   
   // 6. Check synced
   console.log(metrics.synced_count); // Should be 10
   ```

2. **Retry Test**
   ```javascript
   // 1. Stop backend server
   // 2. Capture activity
   // 3. Flush will fail → status = RETRYING
   
   const retrying = await queue.getRetrying();
   console.log(retrying[0].retry_count); // Should increment
   
   // 4. Wait for backoff
   // 5. Start backend
   // 6. Next auto-flush will succeed
   ```

---

## 📈 Monitoring

### Get Real-Time Metrics

```javascript
const metrics = await queue.getMetrics();

console.log({
    total_captured: metrics.total_captured,
    total_synced: metrics.total_synced,
    pending_count: metrics.pending_count,
    retrying_count: metrics.retrying_count,
    dead_letter_count: metrics.dead_letter_count,
    sync_success_rate: metrics.sync_success_rate,
    last_sync_at: metrics.last_sync_at
});
```

### Display in Popup

```javascript
// popup.js
chrome.runtime.sendMessage(
    { action: 'get_metrics' },
    (response) => {
        if (response.success) {
            document.getElementById('pending').textContent = 
                response.metrics.pending_count;
            document.getElementById('success-rate').textContent = 
                (response.metrics.sync_success_rate * 100).toFixed(1) + '%';
        }
    }
);
```

---

## 🐛 Debugging

### Enable Debug Logging

```javascript
const queue = new ActivityQueue({ debug: true });
```

### Console Access

```javascript
// In background service worker console
window.activityQueue.getMetrics().then(console.log);
window.activityQueue.getPending().then(console.log);
window.activityQueue.flush(true); // Force flush
```

### Inspect IndexedDB

1. Open Chrome DevTools
2. Application tab → Storage → IndexedDB → MiniMeQueue
3. View `activities` and `metrics` stores

---

## 🔒 Privacy & Security

### Sensitive URL Filtering

Add to queue configuration:

```javascript
const SENSITIVE_DOMAINS = [
    'localhost',
    '127.0.0.1',
    'chrome://',
    'chrome-extension://'
];

// Before enqueue
if (SENSITIVE_DOMAINS.some(domain => url.includes(domain))) {
    return; // Skip
}
```

### PII Sanitization

```javascript
function sanitizeContext(context) {
    // Remove query parameters that might contain tokens
    if (context.url) {
        const url = new URL(context.url);
        url.search = ''; // Remove query params
        context.url = url.toString();
    }
    
    return context;
}
```

---

## 📚 See Also

- **[Sync Protocol](../../docs/SYNC_PROTOCOL.md)** - Protocol specification
- **[Client Queue Spec](../../docs/CLIENT_QUEUE_SPEC.md)** - Queue specification
- **[Week 6 Walkthrough](../../.gemini/antigravity/brain/.../week_6_complete.md)** - Implementation guide

---

## ✅ Checklist for Integration

- [ ] Add queue files to extension
- [ ] Update manifest.json with permissions
- [ ] Initialize queue in background.js
- [ ] Capture tab/window events
- [ ] Implement manual sync in popup
- [ ] Add badge updates
- [ ] Test offline scenario
- [ ] Test retry logic
- [ ] Monitor metrics
- [ ] Deploy!

---

**Status**: ✅ Production Ready  
**Tested With**: Chrome 121+, Edge 121+  
**Backend Compatibility**: API v1.0+  

🚀 **Ready for production use!**
