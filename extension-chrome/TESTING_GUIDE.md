# Activity Queue Testing Guide

**Date**: 2026-02-03  
**Status**: Ready for Testing

---

## 🚀 Prerequisites

### 1. Backend Running

```bash
cd /home/ansari/Documents/MiniMe/backend

# Start backend
python -m uvicorn main:app --reload --port 8000

# Verify it's running
curl http://localhost:8000/health
```

### 2. Extension Loaded

```bash
# In Chrome/Edge:
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select: /home/ansari/Documents/MiniMe/extension-chrome
# 5. Verify extension loads with no errors
```

### 3. Login to Extension

```bash
# Open extension popup
# Click "Login"
# Email: test@example.com
# Password: password
# (Or create account via backend if needed)
```

---

## 🧪 Test Scenarios

### Test 1: Normal Activity Capture (Online)

**Objective**: Verify activities are captured and synced when online.

**Steps**:
1. Open Chrome DevTools → Service Worker console (chrome://extensions/)
2. Browse to 3-5 different websites (e.g., github.com, npmjs.com)
3. Wait at least 3 seconds per site
4. Switch tabs or close tabs
5. Check console for "Activity enqueued" messages
6. Wait 60 seconds for auto-flush OR
7. Open popup → Click "Sync Now"

**Expected**:
```
[ActivityQueue] Activity enqueued: browser:123:1706906400:a1b2c3
[ActivityQueue] Flushing queue...
[ActivityQueue] Syncing 5 activities...
[ActivityQueue] ✅ Flush complete: 5 synced, 0 failed (1200ms)
```

**Verification**:
```bash
# Check backend database
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/v1/activities/stats
  
# Should show:
# {
#   "total_activities": 5,
#   "by_source": {"browser": 5}
# }
```

---

### Test 2: Offline Capture (Network Failure)

**Objective**: Verify activities queue locally when offline.

**Steps**:
1. Open Chrome DevTools → Network tab → Select "Offline"
2. Browse to 5 different websites
3. Switch tabs (activities should be captured)
4. Check popup badge - should show "5" (pending count)
5. Open Service Worker console:
   ```javascript
   activityQueue.getMetrics().then(console.log)
   // Should show: pending_count: 5
   ```
6. Re-enable network (Online)
7. Wait 60s for auto-flush OR click "Sync Now"

**Expected**:
```
[ActivityQueue] Network online - triggering queue flush
[ActivityQueue] Flushing queue...
[ActivityQueue] Syncing 5 activities...
[ActivityQueue] ✅ Flush complete: 5 synced, 0 failed
```

**Verification**:
- Badge count drops to 0
- Backend receives 5 activities
- Queue metrics show `synced_count: 5`

---

### Test 3: Retry with Exponential Backoff

**Objective**: Verify retry logic when backend is down.

**Steps**:
1. Browse to 1 website (capture 1 activity)
2. Stop backend server:
   ```bash
   # In backend terminal: Ctrl+C
   ```
3. Click "Sync Now" in popup
4. Check console - should see network error
5. Check queue status:
   ```javascript
   activityQueue.getMetrying().then(console.log)
   // Should show 1 item with retry_count: 1
   ```
6. Wait 5 seconds
7. Backend still down → Check retry_count increments
8. Restart backend:
   ```bash
   python -m uvicorn main:app --reload --port 8000
   ```
9. Wait for next auto-retry or click "Sync Now"

**Expected Retry Schedule**:
```
Attempt 1: 5s delay   → retry_count: 1
Attempt 2: 30s delay  → retry_count: 2
Attempt 3: 2min delay → retry_count: 3
...
Backend restored → Sync success → status: SYNCED
```

**Verification**:
- Activity eventually syncs after backend restored
- No duplicate activities in backend

---

### Test 4: Dead Letter Queue

**Objective**: Verify dead letter handling after max retries.

**Steps**:
1. Modify queue config (temporary test):
   ```javascript
   // In service-worker.js, change:
   maxRetries: 3  // Instead of 20 for testing
   ```
2. Browse to 1 website
3. Stop backend
4. Click "Sync Now" repeatedly (4+ times)
5. Check queue status:
   ```javascript
   activityQueue.getDeadLetters().then(console.log)
   // Should show 1 item with status: "dead_letter"
   ```
6. Badge should turn RED
7. Restart backend
8. Send message to retry dead letters:
   ```javascript
   chrome.runtime.sendMessage(
       { action: 'retryQueueFailed' },
       console.log
   );
   ```

**Expected**:
```
Dead letter count: 1
Retry dead letter → status: PENDING
Flush → ✅ Synced successfully
```

**Verification**:
- Dead letter successfully recovered
- Badge turns blue or disappears
- Activity synced to backend

---

### Test 5: Deduplication

**Objective**: Verify no duplicate activities are created.

**Steps**:
1. Browse to github.com for 10 seconds
2. Click "Sync Now"
3. Immediately click "Sync Now" again (double-sync)
4. Check backend activity count
5. Check browser console for "duplicate" status

**Expected**:
```
First sync: ingested_count: 1, duplicate_count: 0
Second sync: ingested_count: 0, duplicate_count: 1
```

**Verification**:
- Only 1 activity in backend database
- client_generated_id prevents duplicates

---

### Test 6: Queue Metrics

**Objective**: Verify metrics are tracked correctly.

**Steps**:
1. Capture 10 activities (browse 10 sites)
2. Sync 8 successfully
3. Force 2 to fail (stop backend mid-sync)
4. Check metrics:
   ```javascript
   chrome.runtime.sendMessage(
       { action: 'getQueueMetrics' },
       (response) => console.log(response.metrics)
   );
   ```

**Expected Metrics**:
```json
{
  "total_captured": 10,
  "total_synced": 8,
  "pending_count": 0,
  "retrying_count": 2,
  "dead_letter_count": 0,
  "sync_success_rate": 0.8,
  "last_sync_at": "2026-02-03T22:00:00Z",
  "last_sync_duration_ms": 1200
}
```

---

### Test 7: Privacy Filters

**Objective**: Verify sensitive URLs are not captured.

**Steps**:
1. Browse to these URLs:
   - `chrome://extensions/` → Should NOT capture
   - `chrome-extension://...` → Should NOT capture
   - `about:blank` → Should NOT capture
   - Incognito tab → Should NOT capture
2. Check queue:
   ```javascript
   activityQueue.getPending().then(items => console.log(items.length))
   // Should be 0
   ```

**Expected**:
- Console shows "Skipping tracking for: chrome://"
- No activities queued
- Perfect privacy

---

### Test 8: IndexedDB Persistence

**Objective**: Verify queue survives extension reload.

**Steps**:
1. Capture 5 activities
2. Go offline (Network tab → Offline)
3. Check pending count: 5
4. Reload extension:
   - Go to chrome://extensions/
   - Click reload button
5. Check Service Worker console:
   ```javascript
   activityQueue.getMetrics().then(console.log)
   ```

**Expected**:
- pending_count still shows 5
- Activities persisted in IndexedDB
- No data loss

---

## 🔧 Debugging Commands

### Service Worker Console

Access via: chrome://extensions/ → Service Worker "inspect"

```javascript
// Get global queue instance
activityQueue

// Check metrics
await activityQueue.getMetrics()

// View pending
await activityQueue.getPending()

// View retrying
await activityQueue.getRetrying()

// View dead letters
await activityQueue.getDeadLetters()

// Force flush
await activityQueue.flush(true)

// Retry failed
await activityQueue.retryFailed()
```

### Inspect IndexedDB

1. Open DevTools on any page
2. Application tab → Storage → IndexedDB → MiniMeQueue
3. Browse `activities` and `metrics` stores

### Backend Verification

```bash
# Get auth token from extension
TOKEN="<your_jwt_token>"

# Check activities
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/v1/activities/stats

# Check specific activities
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8000/v1/activities?limit=10"
```

---

## ✅ Success Criteria

- [ ] Activities captured during normal browsing
- [ ] Activities sync to backend within 60 seconds
- [ ] Offline activities queue locally
- [ ] Queue auto-flushes when network restored
- [ ] Failed syncs retry with exponential backoff
- [ ] Dead letters can be manually retried
- [ ] No duplicate activities created
- [ ] Privacy filters work (chrome://, incognito skipped)
- [ ] Queue persists across extension reloads
- [ ] Badge accurately reflects queue status

---

## 🐛 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Queue not initialized" | Service worker not started | Reload extension |
| Activities not syncing | No auth token | Login via popup |
| Persistent RETRYING | Backend down | Check backend logs, restart |
| Badge always showing count | Dead letters present | Retry or clear dead letters |
| TypeError in console | ES module import issues | Check manifest.json has `type: "module"` |

---

## 📊 Performance Benchmarks

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Enqueue time | <10ms | Console timestamp |
| Flush 100 items | <2s | Check `processing_time_ms` in response |
| IndexedDB read | <50ms | DevTools Performance tab |
| Memory usage | <50MB | Chrome Task Manager |

---

## 🎉 Next Steps

After successful testing:

1. **Submit Test Report**: Document results
2. **Continue to Week 7**: NER Pipeline implementation
3. **Production Deploy**: Submit extension to Chrome Web Store

---

**Test Date**: 2026-02-03  
**Tester**: _______________  
**Status**: ⏳ Pending  

Good luck testing! 🚀
